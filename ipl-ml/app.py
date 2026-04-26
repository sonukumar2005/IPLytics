"""
app.py  –  Production Flask API for IPL Match Winner Prediction
---------------------------------------------------------------
Endpoints:
    GET  /          – Status page
    GET  /health    – Health check  → {"status": "healthy"}
    GET  /teams     – List of known IPL teams
    GET  /venues    – List of known IPL venues
    POST /predict   – Predict match winner

POST /predict  payload:
    {
        "team1":        "Mumbai Indians",
        "team2":        "Chennai Super Kings",
        "venue":        "Wankhede Stadium",
        "tossWinner":   "Mumbai Indians",
        "tossDecision": "bat"
    }

POST /predict  response:
    {
        "team1":            "Mumbai Indians",
        "team2":            "Chennai Super Kings",
        "team1Probability": 62.4,
        "team2Probability": 37.6,
        "predictedWinner":  "Mumbai Indians"
    }
"""

import os
import json
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

from predict import predict_match
from feature_engineering import normalize_team, load_and_clean

app = Flask(__name__)
CORS(app)

# ── Data paths ─────────────────────────────────────────────────────────
DATA_DIR       = os.path.join(os.path.dirname(__file__), "..", "ipl-backend",
                              "src", "main", "resources", "data")
MATCHES_CSV    = os.path.join(DATA_DIR, "matches.csv")
DELIVERIES_CSV = os.path.join(DATA_DIR, "deliveries.csv")

# ── Cache team / venue lists ────────────────────────────────────────────
_lists = {}

def _get_lists():
    if not _lists:
        try:
            matches, _ = load_and_clean(MATCHES_CSV, DELIVERIES_CSV)
            teams  = sorted(set(
                list(matches["team1"].unique()) +
                list(matches["team2"].unique())
            ))
            venues = sorted(matches["venue"].dropna().unique().tolist())
            _lists["teams"]  = [t for t in teams if isinstance(t, str)]
            _lists["venues"] = [v for v in venues if isinstance(v, str)]
        except Exception:
            _lists["teams"]  = []
            _lists["venues"] = []
    return _lists


# ── Routes ──────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return """
    <html>
    <head>
        <title>IPL ML Prediction API</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; display: flex; align-items: center;
                   justify-content: center; height: 100vh; background: #0f172a; color: #e2e8f0; margin: 0; }
            .box { border: 1px solid #334155; padding: 32px 40px; border-radius: 12px;
                   background: #1e293b; max-width: 480px; width: 100%; }
            h1 { color: #f59e0b; margin-top: 0; font-size: 1.6rem; }
            code { background: #0f172a; padding: 2px 8px; border-radius: 4px;
                   color: #6ee7b7; font-size: 0.9rem; }
            .badge { display: inline-block; padding: 3px 10px; border-radius: 20px;
                     background: #065f46; color: #6ee7b7; font-size: 0.8rem; }
            ul { padding-left: 1.2rem; }
            li { margin: 6px 0; }
        </style>
    </head>
    <body>
        <div class="box">
            <h1>🏏 IPL Predictor API</h1>
            <p>Status: <span class="badge">● Online</span></p>
            <p>Model: <strong>XGBoost + Probability Calibration</strong></p>
            <ul>
                <li><code>POST /predict</code> – Predict match winner</li>
                <li><code>GET /teams</code> – List all IPL teams</li>
                <li><code>GET /venues</code> – List all venues</li>
                <li><code>GET /health</code> – Health check</li>
            </ul>
        </div>
    </body>
    </html>
    """


@app.route("/health")
def health():
    return jsonify({"status": "healthy"})


@app.route("/teams")
def teams():
    return jsonify({"teams": _get_lists()["teams"]})


@app.route("/venues")
def venues():
    return jsonify({"venues": _get_lists()["venues"]})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict IPL match winner with calibrated probabilities.
    """
    try:
        data = request.get_json(force=True)

        team1         = data.get("team1", "").strip()
        team2         = data.get("team2", "").strip()
        venue         = data.get("venue", "").strip()
        toss_winner   = data.get("tossWinner", "").strip()
        toss_decision = data.get("tossDecision", "field").strip().lower()

        # ── Validation ───────────────────────────────────────────────
        missing = [f for f, v in [
            ("team1", team1), ("team2", team2),
            ("venue", venue), ("tossWinner", toss_winner)
        ] if not v]
        if missing:
            return jsonify({"error": f"Missing required fields: {missing}"}), 400

        if team1 == team2:
            return jsonify({"error": "team1 and team2 must be different"}), 400

        if toss_decision not in ("bat", "field"):
            return jsonify({"error": "tossDecision must be 'bat' or 'field'"}), 400

        toss_winner_norm = normalize_team(toss_winner)
        t1_norm = normalize_team(team1)
        t2_norm = normalize_team(team2)
        if toss_winner_norm not in (t1_norm, t2_norm):
            return jsonify({"error": "tossWinner must be one of team1 or team2"}), 400

        # ── Prediction ───────────────────────────────────────────────
        result = predict_match(
            team1=team1,
            team2=team2,
            venue=venue,
            toss_winner=toss_winner,
            toss_decision=toss_decision
        )

        return jsonify(result)

    except FileNotFoundError as e:
        return jsonify({
            "error": "Model not trained yet. Please run train_model.py first.",
            "detail": str(e)
        }), 503

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ── Entry point ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Starting IPL Prediction API on http://localhost:5000 …")
    app.run(host="0.0.0.0", port=5000, debug=False)
