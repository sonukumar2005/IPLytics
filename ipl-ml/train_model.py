"""
train_model.py
--------------
Production XGBoost training pipeline for IPL match-winner prediction.

Key improvements:
  - Team-symmetry data augmentation (both team1/team2 perspectives)
  - Season ordinal encoding
  - Match-type encoding (League vs Playoff)
  - Temporal train/test split (no future leakage)
  - RandomizedSearchCV with 5-fold StratifiedKFold
  - Probability calibration (isotonic)
  - Full evaluation + plots

Usage:  python train_model.py
"""

import os, sys, json, warnings
import joblib
import numpy as np
import pandas as pd

import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import (
    train_test_split, StratifiedKFold,
    cross_val_score, RandomizedSearchCV
)
from sklearn.preprocessing import LabelEncoder
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)
from sklearn.utils.class_weight import compute_sample_weight
import xgboost as xgb

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    warnings.warn("shap not installed – SHAP plots will be skipped.")

from feature_engineering import load_and_clean, build_features, FEATURE_COLS

warnings.filterwarnings("ignore")

# ── Paths ───────────────────────────────────────────────────────────────
BASE     = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE, "..", "ipl-backend", "src", "main", "resources", "data")

MATCHES_CSV    = os.path.join(DATA_DIR, "matches.csv")
DELIVERIES_CSV = os.path.join(DATA_DIR, "deliveries.csv")
MODEL_DIR      = os.path.join(BASE, "model")
os.makedirs(MODEL_DIR, exist_ok=True)

# ── 1. Build dataset ────────────────────────────────────────────────────
def build_dataset():
    print("[*] Loading & cleaning data...")
    matches, deliveries = load_and_clean(MATCHES_CSV, DELIVERIES_CSV)
    print(f"  Matches after cleaning : {len(matches)}")

    print("[*] Building feature matrix (may take 1-2 min)...")
    df = build_features(matches, deliveries)
    print(f"  Feature matrix shape   : {df.shape}")

    # ── Team-symmetry augmentation ───────────────────────────────────
    # For each match, add the mirror perspective (swap team1 <-> team2).
    # This doubles training data and removes team-order bias.
    mirror = df.copy()

    # Swap team identity stats
    swap_pairs = [
        ("t1_overall_win_pct",  "t2_overall_win_pct"),
        ("t1_recent_form",      "t2_recent_form"),
        ("t1_bat_first_pct",    "t2_bat_first_pct"),
        ("t1_chasing_pct",      "t2_chasing_pct"),
        ("t2_chasing_pct",      "t1_chasing_pct"),   # already swapped above; included for clarity
        ("t1_toss_win_pct",     "t2_toss_win_pct"),
        ("t1_h2h_wins",         "t2_h2h_wins"),
        ("t1_venue_win_pct",    "t2_venue_win_pct"),
        ("t1_momentum",         "t2_momentum"),
        ("t1_nrr_proxy",        "t2_nrr_proxy"),
        ("t1_bat_strength",     "t2_bat_strength"),
        ("t1_bowl_strength",    "t2_bowl_strength"),
        ("t1_strike_rate",      "t2_strike_rate"),
        ("t1_economy",          "t2_economy"),
    ]
    for col_a, col_b in swap_pairs:
        if col_a in mirror.columns and col_b in mirror.columns:
            mirror[col_a], mirror[col_b] = df[col_b].copy(), df[col_a].copy()

    # Swap team names
    mirror["team1"], mirror["team2"] = df["team2"].copy(), df["team1"].copy()

    # Flip toss_is_t1
    mirror["toss_is_t1"] = 1 - df["toss_is_t1"]

    # Flip h2h_ratio
    mirror["h2h_ratio"] = 1 - df["h2h_ratio"]

    # Flip label: if original team1 won (label=1), mirrored team1 (orig team2) lost → label=0
    mirror["target"] = 1 - df["target"]

    df_aug = pd.concat([df, mirror], ignore_index=True)
    df_aug = df_aug.sort_values("date").reset_index(drop=True)
    print(f"  After symmetry augmentation: {df_aug.shape}")
    return df_aug


# ── 2. Encode categoricals ───────────────────────────────────────────────
def encode_categoricals(df):
    encoders = {}
    for col in ["team1", "team2", "venue"]:
        le = LabelEncoder()
        df[col + "_enc"] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    return df, encoders


# ── 3. Train ─────────────────────────────────────────────────────────────
def train(df):
    df, encoders = encode_categoricals(df)

    feature_cols = FEATURE_COLS + ["team1_enc", "team2_enc", "venue_enc"]
    X = df[feature_cols].values.astype(np.float32)
    y = df["target"].values.astype(int)

    # Temporal split – last 15% as test (chronological order preserved)
    split = int(0.85 * len(X))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    print(f"  Train rows : {len(X_train)}  |  Test rows : {len(X_test)}")

    sw_train = compute_sample_weight("balanced", y_train)

    # ── Baseline CV ──────────────────────────────────────────────────
    base = xgb.XGBClassifier(
        n_estimators=300, learning_rate=0.05, max_depth=5,
        subsample=0.8, colsample_bytree=0.8,
        eval_metric="logloss", random_state=42, n_jobs=-1
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(base, X_train, y_train, cv=cv,
                                scoring="roc_auc", n_jobs=-1)
    print(f"  Baseline CV ROC-AUC : {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

    # ── Hyperparameter search ────────────────────────────────────────
    print("[*] Running RandomizedSearchCV (80 iterations)...")
    param_dist = {
        "n_estimators":     [200, 300, 400, 500, 600],
        "max_depth":        [3, 4, 5, 6, 7],
        "learning_rate":    [0.005, 0.01, 0.02, 0.05, 0.07, 0.1],
        "subsample":        [0.6, 0.7, 0.8, 0.9, 1.0],
        "colsample_bytree": [0.5, 0.6, 0.7, 0.8, 0.9],
        "min_child_weight": [1, 3, 5, 7, 10],
        "gamma":            [0, 0.05, 0.1, 0.2, 0.3],
        "reg_alpha":        [0, 0.05, 0.1, 0.5, 1.0],
        "reg_lambda":       [0.5, 1.0, 1.5, 2.0, 3.0],
        "scale_pos_weight": [1],
    }
    search = RandomizedSearchCV(
        xgb.XGBClassifier(eval_metric="logloss", random_state=42, n_jobs=-1),
        param_distributions=param_dist,
        n_iter=80,
        cv=cv,
        scoring="roc_auc",
        verbose=1,
        random_state=42,
        n_jobs=-1,
    )
    search.fit(X_train, y_train, sample_weight=sw_train)
    print(f"  Best CV ROC-AUC : {search.best_score_:.4f}")
    print(f"  Best params     : {search.best_params_}")

    best_xgb = search.best_estimator_

    # ── Probability calibration ──────────────────────────────────────
    print("[*] Calibrating probabilities (isotonic, cv=5)...")
    calibrated = CalibratedClassifierCV(best_xgb, method="isotonic", cv=5)
    calibrated.fit(X_train, y_train, sample_weight=sw_train)

    return calibrated, best_xgb, encoders, feature_cols, X_test, y_test, X_train, y_train


# ── 4. Evaluate ──────────────────────────────────────────────────────────
def evaluate(model, X_test, y_test):
    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy":  round(accuracy_score(y_test, y_pred),         4),
        "precision": round(precision_score(y_test, y_pred),        4),
        "recall":    round(recall_score(y_test, y_pred),           4),
        "f1_score":  round(f1_score(y_test, y_pred),               4),
        "roc_auc":   round(roc_auc_score(y_test, y_proba),         4),
    }
    print("\n--- Evaluation Metrics ----------------------------------------")
    for k, v in metrics.items():
        print(f"  {k:12s}: {v:.4f}")
    print()
    print(classification_report(y_test, y_pred,
                                target_names=["Team2 Wins", "Team1 Wins"]))
    return metrics, y_pred, y_proba


# ── 5. Plots ─────────────────────────────────────────────────────────────
def _save(fig, name):
    p = os.path.join(MODEL_DIR, name)
    fig.savefig(p, dpi=130, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved : {p}")


def plot_confusion_matrix(y_test, y_pred):
    cm   = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, cmap="Blues")
    for ii in range(2):
        for jj in range(2):
            ax.text(jj, ii, str(cm[ii, jj]), ha="center", va="center",
                    color="white" if cm[ii, jj] > cm.max() / 2 else "black", fontsize=14)
    ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
    ax.set_xticklabels(["Team2 Wins", "Team1 Wins"])
    ax.set_yticklabels(["Team2 Wins", "Team1 Wins"])
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
    ax.set_title("Confusion Matrix"); plt.colorbar(im, ax=ax)
    _save(fig, "confusion_matrix.png")


def plot_calibration(model, X_test, y_test):
    y_prob = model.predict_proba(X_test)[:, 1]
    prob_true, prob_pred = calibration_curve(y_test, y_prob, n_bins=10)
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.plot(prob_pred, prob_true, "s-", label="Model", color="#4f46e5")
    ax.plot([0, 1], [0, 1], "k--", label="Perfect calibration")
    ax.set_xlabel("Mean predicted probability"); ax.set_ylabel("Fraction of positives")
    ax.set_title("Calibration Curve"); ax.legend()
    _save(fig, "calibration_curve.png")


def plot_feature_importance(best_xgb, feature_cols):
    fi = pd.Series(best_xgb.feature_importances_, index=feature_cols)
    fi = fi.sort_values(ascending=False).head(20)
    fig, ax = plt.subplots(figsize=(10, 7))
    fi[::-1].plot(kind="barh", color="#4f46e5", ax=ax)
    ax.set_title("Top 20 Feature Importances (XGBoost)")
    ax.set_xlabel("Importance")
    _save(fig, "feature_importance.png")


def plot_shap(best_xgb, X_train, feature_cols):
    if not SHAP_AVAILABLE:
        print("  [skip] shap not installed")
        return
    try:
        explainer = shap.TreeExplainer(best_xgb)
        sample    = X_train[:min(500, len(X_train))]
        shap_vals = explainer.shap_values(sample)
        fig, ax   = plt.subplots(figsize=(10, 8))
        shap.summary_plot(shap_vals, sample, feature_names=feature_cols,
                          show=False, plot_size=None)
        _save(fig, "shap_summary.png")
    except Exception as e:
        print(f"  [skip] SHAP plot failed: {e}")


# ── 6. Save ──────────────────────────────────────────────────────────────
def save_artefacts(model, encoders, feature_cols, metrics):
    for name, obj in [
        ("model.pkl",         model),
        ("match_predictor.pkl", model),   # backward compat alias
        ("encoders.pkl",      encoders),
        ("feature_names.pkl", feature_cols),
    ]:
        p = os.path.join(MODEL_DIR, name)
        joblib.dump(obj, p)
        if name != "match_predictor.pkl":
            print(f"  Saved : {p}")

    p = os.path.join(MODEL_DIR, "metrics.json")
    with open(p, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Saved : {p}")


# ── Main ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  IPL Match Predictor - Production XGBoost Training")
    print("=" * 60)

    df = build_dataset()

    (calibrated_model, best_xgb, encoders,
     feature_cols, X_test, y_test,
     X_train, y_train) = train(df)

    print("\n[*] Evaluating on held-out test set...")
    metrics, y_pred, y_proba = evaluate(calibrated_model, X_test, y_test)

    print("\n[*] Generating plots...")
    plot_confusion_matrix(y_test, y_pred)
    plot_calibration(calibrated_model, X_test, y_test)
    plot_feature_importance(best_xgb, feature_cols)
    plot_shap(best_xgb, X_train, feature_cols)

    print("\n[*] Saving artefacts...")
    save_artefacts(calibrated_model, encoders, feature_cols, metrics)

    print("\n[OK] Training complete.")
    print(f"   Final ROC-AUC : {metrics['roc_auc']:.4f}")
    print(f"   Accuracy      : {metrics['accuracy']:.4f}")
    print(f"   F1-Score      : {metrics['f1_score']:.4f}")
