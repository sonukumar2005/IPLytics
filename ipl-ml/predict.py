"""
predict.py
----------
Prediction helper – given match setup parameters, loads the trained
model and returns win probabilities for both teams.

Usage (standalone):
    python predict.py \
        --team1 "Mumbai Indians" \
        --team2 "Chennai Super Kings" \
        --venue "Wankhede Stadium" \
        --toss_winner "Mumbai Indians" \
        --toss_decision "bat"
"""

import os
import json
import argparse
import warnings
import joblib
import numpy as np
import pandas as pd

from feature_engineering import (
    load_and_clean, normalize_team, FEATURE_COLS
)

warnings.filterwarnings("ignore")

MODEL_DIR      = os.path.join(os.path.dirname(__file__), "model")
MODEL_PATH     = os.path.join(MODEL_DIR, "model.pkl")
ENCODERS_PATH  = os.path.join(MODEL_DIR, "encoders.pkl")
FEAT_NAMES_PATH = os.path.join(MODEL_DIR, "feature_names.pkl")

DATA_DIR       = os.path.join(os.path.dirname(__file__), "..", "ipl-backend",
                              "src", "main", "resources", "data")
MATCHES_CSV    = os.path.join(DATA_DIR, "matches.csv")
DELIVERIES_CSV = os.path.join(DATA_DIR, "deliveries.csv")


# ── Singleton cache so the API does not re-load on every request ────────
_cache = {}

def _load_artefacts():
    if "model" not in _cache:
        _cache["model"]    = joblib.load(MODEL_PATH)
        _cache["encoders"] = joblib.load(ENCODERS_PATH)
        _cache["features"] = joblib.load(FEAT_NAMES_PATH)

    if "matches" not in _cache:
        matches, deliveries = load_and_clean(MATCHES_CSV, DELIVERIES_CSV)
        _cache["matches"]    = matches
        _cache["deliveries"] = deliveries

        # Pre-compute ball-by-ball aggregates
        _cache["bat_strength"]  = (
            deliveries.groupby("batting_team")["batsman_runs"].mean()
        )
        _cache["bowl_strength"] = (
            deliveries.groupby("bowling_team")["total_runs"].mean()
        )
        _cache["strike_rate"]   = deliveries.groupby("batting_team").apply(
            lambda d: (d["batsman_runs"].sum() / max(1, len(d))) * 100
        )
        _cache["economy"]       = deliveries.groupby("bowling_team").apply(
            lambda d: d["total_runs"].sum() / max(1, len(d) / 6)
        )

    return (_cache["model"], _cache["encoders"], _cache["features"],
            _cache["matches"], _cache["bat_strength"],
            _cache["bowl_strength"], _cache["strike_rate"], _cache["economy"])


# ── Feature assembler for a single prediction request ──────────────────

def _safe_encode(le, value):
    """Encode, defaulting to 0 for unseen labels."""
    try:
        return int(le.transform([value])[0])
    except Exception:
        return 0


def _pct(series, value, total):
    return value / total if total > 0 else 0.5


def build_single_feature_vector(
        team1: str, team2: str, venue: str,
        toss_winner: str, toss_decision: str,
        matches: pd.DataFrame,
        bat_strength, bowl_strength, strike_rate, economy,
        encoders: dict, feature_cols: list
) -> np.ndarray:
    """
    Reconstruct the same feature vector used during training for a live
    prediction request (uses *all* historical data as past context).
    """
    team1       = normalize_team(team1)
    team2       = normalize_team(team2)
    toss_winner = normalize_team(toss_winner)

    past = matches  # all history = best prior for unseen future match

    # ── Helper closures ─────────────────────────────────────────────
    def overall_win_pct(team):
        tm = past[(past["team1"] == team) | (past["team2"] == team)]
        return (tm["winner"] == team).sum() / len(tm) if len(tm) else 0.5

    def recent_form(team, n=5):
        tm = past[(past["team1"] == team) | (past["team2"] == team)].tail(n)
        return (tm["winner"] == team).sum() / len(tm) if len(tm) else 0.5

    def mode_pct(team, decision):
        sub = past[past["toss_decision"] == decision]
        sub = sub[sub["toss_winner"] == team]
        return (sub["winner"] == team).sum() / len(sub) if len(sub) else 0.5

    def toss_win_pct(team):
        tm = past[(past["team1"] == team) | (past["team2"] == team)]
        return (tm["toss_winner"] == team).sum() / len(tm) if len(tm) else 0.5

    # H2H
    h2h = past[
        ((past["team1"] == team1) & (past["team2"] == team2)) |
        ((past["team1"] == team2) & (past["team2"] == team1))
    ]
    h2h_total   = len(h2h)
    t1_h2h_wins = (h2h["winner"] == team1).sum()
    t2_h2h_wins = (h2h["winner"] == team2).sum()
    h2h_ratio   = t1_h2h_wins / h2h_total if h2h_total else 0.5

    # Venue
    pv = past[past["venue"] == venue]
    pv_total = len(pv)

    def venue_win_pct(team):
        tm = pv[(pv["team1"] == team) | (pv["team2"] == team)]
        return (tm["winner"] == team).sum() / len(tm) if len(tm) else 0.5

    avg_venue_score = pv["target_runs"].mean() if pv_total else 160.0
    if pd.isna(avg_venue_score):
        avg_venue_score = 160.0

    if pv_total:
        bf  = pv[pv["toss_decision"] == "bat"]
        bfw = (bf["toss_winner"] == bf["winner"]).sum()
        bat_first_adv   = bfw / pv_total
        chasing_success = 1 - bat_first_adv
        toss_impact = (pv["toss_winner"] == pv["winner"]).sum() / pv_total
    else:
        bat_first_adv   = 0.5
        chasing_success = 0.5
        toss_impact     = 0.5

    # Momentum
    def momentum(team, n=3):
        tm = past[(past["team1"] == team) | (past["team2"] == team)].tail(n)
        if not len(tm):
            return 0.5
        wts  = np.array([0.2, 0.3, 0.5][3 - len(tm):])
        wins = np.array([(1 if r == team else 0) for r in tm["winner"]])
        return float(np.dot(wts, wins))

    def nrr(team):
        tm = past[(past["team1"] == team) | (past["team2"] == team)]
        if not len(tm):
            return 0.0
        w = (tm["winner"] == team).sum()
        return (w - (len(tm) - w)) / len(tm)

    # Delivery features
    def _get(series, key, fallback):
        return float(series.get(key, series.mean() if len(series) else fallback))

    row = {
        "t1_overall_win_pct":  overall_win_pct(team1),
        "t2_overall_win_pct":  overall_win_pct(team2),
        "t1_recent_form":      recent_form(team1),
        "t2_recent_form":      recent_form(team2),
        "t1_bat_first_pct":    mode_pct(team1, "bat"),
        "t2_chasing_pct":      mode_pct(team2, "field"),
        "t2_bat_first_pct":    mode_pct(team2, "bat"),
        "t1_chasing_pct":      mode_pct(team1, "field"),
        "t1_toss_win_pct":     toss_win_pct(team1),
        "t2_toss_win_pct":     toss_win_pct(team2),
        "toss_is_t1":          1 if toss_winner == team1 else 0,
        "toss_bat":            1 if toss_decision == "bat" else 0,
        "toss_impact_venue":   toss_impact,
        "t1_h2h_wins":         int(t1_h2h_wins),
        "t2_h2h_wins":         int(t2_h2h_wins),
        "h2h_total":           int(h2h_total),
        "h2h_ratio":           h2h_ratio,
        "t1_venue_win_pct":    venue_win_pct(team1),
        "t2_venue_win_pct":    venue_win_pct(team2),
        "avg_venue_score":     avg_venue_score,
        "bat_first_adv":       bat_first_adv,
        "chasing_success":     chasing_success,
        "t1_momentum":         momentum(team1),
        "t2_momentum":         momentum(team2),
        "t1_nrr_proxy":        nrr(team1),
        "t2_nrr_proxy":        nrr(team2),
        "t1_bat_strength":     _get(bat_strength,  team1, 7.5),
        "t2_bat_strength":     _get(bat_strength,  team2, 7.5),
        "t1_bowl_strength":    _get(bowl_strength, team1, 8.0),
        "t2_bowl_strength":    _get(bowl_strength, team2, 8.0),
        "t1_strike_rate":      _get(strike_rate,   team1, 125.0),
        "t2_strike_rate":      _get(strike_rate,   team2, 125.0),
        "t1_economy":          _get(economy,        team1, 8.5),
        "t2_economy":          _get(economy,        team2, 8.5),
        # categorical encodes
        "team1_enc":  _safe_encode(encoders["team1"], team1),
        "team2_enc":  _safe_encode(encoders["team2"], team2),
        "venue_enc":  _safe_encode(encoders["venue"],  venue),
    }

    return np.array([row[c] for c in feature_cols], dtype=np.float32).reshape(1, -1)


# ── Public prediction function ─────────────────────────────────────────

def predict_match(team1: str, team2: str, venue: str,
                  toss_winner: str, toss_decision: str) -> dict:
    """
    Returns:
        {
            "team1": "...",
            "team2": "...",
            "team1Probability": 62.4,
            "team2Probability": 37.6,
            "predictedWinner": "..."
        }
    """
    (model, encoders, feature_cols,
     matches, bat_strength,
     bowl_strength, strike_rate, economy) = _load_artefacts()

    X = build_single_feature_vector(
        team1, team2, venue, toss_winner, toss_decision,
        matches, bat_strength, bowl_strength, strike_rate, economy,
        encoders, feature_cols
    )

    proba = model.predict_proba(X)[0]   # [prob_team2_wins, prob_team1_wins]
    t1_prob = round(float(proba[1]) * 100, 1)
    t2_prob = round(100 - t1_prob, 1)
    winner  = team1 if t1_prob >= t2_prob else team2

    return {
        "team1":             normalize_team(team1),
        "team2":             normalize_team(team2),
        "team1Probability":  t1_prob,
        "team2Probability":  t2_prob,
        "predictedWinner":   winner,
    }


# ── CLI ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="IPL Match Predictor")
    parser.add_argument("--team1",         required=True)
    parser.add_argument("--team2",         required=True)
    parser.add_argument("--venue",         required=True)
    parser.add_argument("--toss_winner",   required=True)
    parser.add_argument("--toss_decision", required=True, choices=["bat", "field"])
    args = parser.parse_args()

    result = predict_match(
        args.team1, args.team2, args.venue,
        args.toss_winner, args.toss_decision
    )
    print(json.dumps(result, indent=2))
