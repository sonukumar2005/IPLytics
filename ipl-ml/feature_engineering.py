"""
feature_engineering.py
-----------------------
Advanced cricket-specific feature engineering for IPL Match Prediction.
Generates team stats, head-to-head, venue, player and toss features.
"""

import pandas as pd
import numpy as np
from collections import defaultdict


# ─────────────────────────────────────────────
# Team name normalisation map
# ─────────────────────────────────────────────
TEAM_ALIASES = {
    "Rising Pune Supergiant":  "Rising Pune Supergiants",
    "Rising Pune Supergiants": "Rising Pune Supergiants",
    "Delhi Daredevils":        "Delhi Capitals",
    "Kings XI Punjab":         "Punjab Kings",
    "Deccan Chargers":         "Deccan Chargers",
    "Kochi Tuskers Kerala":    "Kochi Tuskers Kerala",
    "Pune Warriors":           "Pune Warriors",
    "Gujarat Lions":           "Gujarat Lions",
}

TEAMS = [
    "Chennai Super Kings",
    "Mumbai Indians",
    "Kolkata Knight Riders",
    "Royal Challengers Bangalore",
    "Sunrisers Hyderabad",
    "Delhi Capitals",
    "Punjab Kings",
    "Rajasthan Royals",
    "Deccan Chargers",
    "Kochi Tuskers Kerala",
    "Pune Warriors",
    "Gujarat Lions",
    "Rising Pune Supergiants",
    "Lucknow Super Giants",
    "Gujarat Titans",
]


def normalize_team(name: str) -> str:
    if not isinstance(name, str):
        return name
    return TEAM_ALIASES.get(name.strip(), name.strip())


# ─────────────────────────────────────────────
# Data loading & cleaning
# ─────────────────────────────────────────────

def load_and_clean(matches_path: str, deliveries_path: str):
    """
    Load & clean matches.csv and deliveries.csv.
    Returns (matches_df, deliveries_df).
    """
    matches = pd.read_csv(matches_path)
    deliveries = pd.read_csv(deliveries_path)

    # Strip whitespace from column names (deliveries.csv has trailing spaces)
    deliveries.columns = deliveries.columns.str.strip()
    matches.columns = matches.columns.str.strip()

    # Strip string columns in deliveries
    for col in ["batting_team", "bowling_team", "batter", "bowler",
                "non_striker", "player_dismissed", "dismissal_kind",
                "fielder", "extras_type"]:
        if col in deliveries.columns:
            deliveries[col] = deliveries[col].astype(str).str.strip()

    # ── Normalize date ──────────────────────────────────────────────
    matches["date"] = pd.to_datetime(matches["date"], errors="coerce")
    matches = matches.sort_values("date").reset_index(drop=True)

    # ── Drop no-result / abandoned matches ─────────────────────────
    matches = matches[
        matches["result"].notna() &
        (~matches["result"].isin(["no result", "No Result", "NA"])) &
        matches["winner"].notna() &
        (matches["winner"] != "NA")
    ].copy()

    # ── Normalize team names ─────────────────────────────────────────
    for col in ["team1", "team2", "winner", "toss_winner"]:
        if col in matches.columns:
            matches[col] = matches[col].apply(normalize_team)

    for col in ["batting_team", "bowling_team"]:
        if col in deliveries.columns:
            deliveries[col] = deliveries[col].apply(normalize_team)

    # ── Handle residual NaN cities ──────────────────────────────────
    matches["city"] = matches["city"].fillna("Unknown")
    matches["venue"] = matches["venue"].fillna("Unknown")

    # ── Drop obvious duplicates ─────────────────────────────────────
    matches = matches.drop_duplicates(subset=["id"]).copy()

    return matches, deliveries


# ─────────────────────────────────────────────
# Helper: rolling window 
# ─────────────────────────────────────────────

def _rolling_win_rate(team_matches: pd.DataFrame, team: str, n: int = 5) -> pd.Series:
    """
    For every row (match), compute the last-n win-rate for `team`
    among matches that occurred *before* that row's date.
    Returns a Series aligned to team_matches.index.
    """
    results = []
    for idx in range(len(team_matches)):
        past = team_matches.iloc[:idx]
        if len(past) == 0:
            results.append(0.5)
        else:
            recent = past.tail(n)
            wins = (recent["winner"] == team).sum()
            results.append(wins / len(recent))
    return pd.Series(results, index=team_matches.index)


# ─────────────────────────────────────────────
# Core feature builder
# ─────────────────────────────────────────────

def build_features(matches: pd.DataFrame, deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Build the full feature matrix from cleaned match + delivery data.
    Returns a DataFrame ready for modelling (no leakage – all stats
    are computed using only matches that happened *before* each row).
    """

    matches = matches.copy().sort_values("date").reset_index(drop=True)

    # Pre-index team/venue match lists for speed
    team_match_idx  = defaultdict(list)   # team -> list of global indices
    venue_match_idx = defaultdict(list)   # venue -> list of global indices

    for i, row in matches.iterrows():
        team_match_idx[row["team1"]].append(i)
        team_match_idx[row["team2"]].append(i)
        venue_match_idx[row["venue"]].append(i)

    # Determine correct batsman column name (handles both schemas)
    bat_run_col = "batsman_runs" if "batsman_runs" in deliveries.columns else "batter_runs"

    # ── Player impact from deliveries ───────────────────────────────
    # Batting strength proxy: average runs per ball (weighted recent)
    bat_strength = (
        deliveries.groupby("batting_team")[bat_run_col]
        .mean()
        .rename("bat_strength")
    )
    bowl_strength = (
        deliveries.groupby("bowling_team")["total_runs"]
        .mean()
        .rename("bowl_strength_conceded")
    )

    # Economy rate proxy
    economy = deliveries.groupby("bowling_team").apply(
        lambda d: d["total_runs"].sum() / max(1, len(d) / 6)
    ).rename("economy_proxy")

    strike_rate = deliveries.groupby("batting_team").apply(
        lambda d: (d[bat_run_col].sum() / max(1, len(d))) * 100
    ).rename("strike_rate_proxy")

    feature_rows = []

    for i, row in matches.iterrows():
        t1   = row["team1"]
        t2   = row["team2"]
        ven  = row["venue"]
        toss = row["toss_winner"]
        toss_dec = row.get("toss_decision", "field")

        # ── All matches BEFORE this one ─────────────────────────────
        past = matches.iloc[:i]

        # ── Team overall win % ──────────────────────────────────────
        def team_overall_win_pct(team, df):
            tm = df[(df["team1"] == team) | (df["team2"] == team)]
            if len(tm) == 0:
                return 0.5
            return (tm["winner"] == team).sum() / len(tm)

        t1_overall = team_overall_win_pct(t1, past)
        t2_overall = team_overall_win_pct(t2, past)

        # ── Recent form (last 5) ─────────────────────────────────────
        def recent_form(team, df, n=5):
            tm = df[(df["team1"] == team) | (df["team2"] == team)].tail(n)
            if len(tm) == 0:
                return 0.5
            return (tm["winner"] == team).sum() / len(tm)

        t1_form = recent_form(t1, past)
        t2_form = recent_form(t2, past)

        # ── Batting-first / chasing win % ───────────────────────────
        def bat_first_win_pct(team, df):
            bfm = df[df["toss_decision"] == "bat"]
            bfm_team = bfm[(bfm["toss_winner"] == team)]
            if len(bfm_team) == 0:
                return 0.5
            return (bfm_team["winner"] == team).sum() / len(bfm_team)

        def chasing_win_pct(team, df):
            chm = df[df["toss_decision"] == "field"]
            chm_team = chm[(chm["toss_winner"] == team)]
            if len(chm_team) == 0:
                return 0.5
            return (chm_team["winner"] == team).sum() / len(chm_team)

        t1_bat_first = bat_first_win_pct(t1, past)
        t2_chasing   = chasing_win_pct(t2, past)
        t2_bat_first = bat_first_win_pct(t2, past)
        t1_chasing   = chasing_win_pct(t1, past)

        # ── Toss win % ───────────────────────────────────────────────
        def toss_win_pct(team, df):
            tm = df[(df["team1"] == team) | (df["team2"] == team)]
            if len(tm) == 0:
                return 0.5
            return (tm["toss_winner"] == team).sum() / len(tm)

        t1_toss_pct = toss_win_pct(t1, past)
        t2_toss_pct = toss_win_pct(t2, past)

        # ── Head-to-head ─────────────────────────────────────────────
        h2h = past[
            ((past["team1"] == t1) & (past["team2"] == t2)) |
            ((past["team1"] == t2) & (past["team2"] == t1))
        ]
        h2h_total = len(h2h)
        t1_h2h_wins = (h2h["winner"] == t1).sum()
        t2_h2h_wins = (h2h["winner"] == t2).sum()
        h2h_ratio = t1_h2h_wins / h2h_total if h2h_total > 0 else 0.5

        # ── Venue features ───────────────────────────────────────────
        past_venue = past[past["venue"] == ven]
        v_total = len(past_venue)

        def venue_win_pct(team, df):
            tm = df[(df["team1"] == team) | (df["team2"] == team)]
            if len(tm) == 0:
                return 0.5
            return (tm["winner"] == team).sum() / len(tm)

        t1_venue_pct = venue_win_pct(t1, past_venue)
        t2_venue_pct = venue_win_pct(t2, past_venue)

        # Average score at venue (target_runs as proxy)
        avg_venue_score = (
            past_venue["target_runs"].mean()
            if v_total > 0 and "target_runs" in past_venue.columns
            else 160.0
        )
        if pd.isna(avg_venue_score):
            avg_venue_score = 160.0

        # Bat-first advantage at venue
        if v_total > 0:
            bat_first_at_venue = past_venue[past_venue["toss_decision"] == "bat"]
            bat_first_wins = sum(
                (bat_first_at_venue["toss_winner"] == bat_first_at_venue["winner"])
            )
            bat_first_adv = bat_first_wins / v_total
            chasing_success = 1 - bat_first_adv
        else:
            bat_first_adv   = 0.5
            chasing_success = 0.5

        # ── Toss features ────────────────────────────────────────────
        toss_is_t1 = 1 if toss == t1 else 0
        toss_bat   = 1 if toss_dec == "bat" else 0

        # Toss impact at this venue
        if v_total > 0:
            toss_wins_at_venue = past_venue[past_venue["toss_winner"] == past_venue["winner"]]
            toss_impact = len(toss_wins_at_venue) / v_total
        else:
            toss_impact = 0.5

        # ── Momentum score (last 3 matches) ─────────────────────────
        def momentum(team, df, n=3):
            tm = df[(df["team1"] == team) | (df["team2"] == team)].tail(n)
            if len(tm) == 0:
                return 0.5
            weights = np.array([0.2, 0.3, 0.5][3 - len(tm):])
            wins = np.array([(1 if r == team else 0) for r in tm["winner"]])
            return float(np.dot(weights, wins))

        t1_momentum = momentum(t1, past)
        t2_momentum = momentum(t2, past)

        # ── Player-level features from deliveries ────────────────────
        t1_bat_str = float(bat_strength.get(t1, bat_strength.mean() if len(bat_strength) else 7.5))
        t2_bat_str = float(bat_strength.get(t2, bat_strength.mean() if len(bat_strength) else 7.5))
        t1_bowl_str = float(bowl_strength.get(t1, bowl_strength.mean() if len(bowl_strength) else 8.0))
        t2_bowl_str = float(bowl_strength.get(t2, bowl_strength.mean() if len(bowl_strength) else 8.0))
        t1_sr  = float(strike_rate.get(t1, strike_rate.mean() if len(strike_rate) else 125.0))
        t2_sr  = float(strike_rate.get(t2, strike_rate.mean() if len(strike_rate) else 125.0))
        t1_eco = float(economy.get(t1, economy.mean() if len(economy) else 8.5))
        t2_eco = float(economy.get(t2, economy.mean() if len(economy) else 8.5))

        # ── NRR proxy ────────────────────────────────────────────────
        def nrr_proxy(team, df):
            tm = df[(df["team1"] == team) | (df["team2"] == team)]
            if len(tm) == 0:
                return 0.0
            wins = (tm["winner"] == team).sum()
            losses = len(tm) - wins
            return (wins - losses) / max(1, len(tm))

        t1_nrr = nrr_proxy(t1, past)
        t2_nrr = nrr_proxy(t2, past)

        # ── Target label ─────────────────────────────────────────────
        label = 1 if row["winner"] == t1 else 0

        feature_rows.append({
            # Meta
            "match_id":         row["id"],
            "date":             row["date"],
            "team1":            t1,
            "team2":            t2,
            "venue":            ven,
            "season":           row.get("season", 0),

            # Team overall
            "t1_overall_win_pct":  t1_overall,
            "t2_overall_win_pct":  t2_overall,

            # Recent form
            "t1_recent_form":      t1_form,
            "t2_recent_form":      t2_form,

            # Mode-specific win %
            "t1_bat_first_pct":    t1_bat_first,
            "t2_chasing_pct":      t2_chasing,
            "t2_bat_first_pct":    t2_bat_first,
            "t1_chasing_pct":      t1_chasing,

            # Toss
            "t1_toss_win_pct":     t1_toss_pct,
            "t2_toss_win_pct":     t2_toss_pct,
            "toss_is_t1":          toss_is_t1,
            "toss_bat":            toss_bat,
            "toss_impact_venue":   toss_impact,

            # H2H
            "t1_h2h_wins":         int(t1_h2h_wins),
            "t2_h2h_wins":         int(t2_h2h_wins),
            "h2h_total":           int(h2h_total),
            "h2h_ratio":           h2h_ratio,

            # Venue
            "t1_venue_win_pct":    t1_venue_pct,
            "t2_venue_win_pct":    t2_venue_pct,
            "avg_venue_score":     avg_venue_score,
            "bat_first_adv":       bat_first_adv,
            "chasing_success":     chasing_success,

            # Momentum / NRR
            "t1_momentum":         t1_momentum,
            "t2_momentum":         t2_momentum,
            "t1_nrr_proxy":        t1_nrr,
            "t2_nrr_proxy":        t2_nrr,

            # Player / delivery stats
            "t1_bat_strength":     t1_bat_str,
            "t2_bat_strength":     t2_bat_str,
            "t1_bowl_strength":    t1_bowl_str,
            "t2_bowl_strength":    t2_bowl_str,
            "t1_strike_rate":      t1_sr,
            "t2_strike_rate":      t2_sr,
            "t1_economy":          t1_eco,
            "t2_economy":          t2_eco,

            # Label
            "target":              label,
        })

    return pd.DataFrame(feature_rows)


FEATURE_COLS = [
    "t1_overall_win_pct", "t2_overall_win_pct",
    "t1_recent_form", "t2_recent_form",
    "t1_bat_first_pct", "t2_chasing_pct",
    "t2_bat_first_pct", "t1_chasing_pct",
    "t1_toss_win_pct", "t2_toss_win_pct",
    "toss_is_t1", "toss_bat", "toss_impact_venue",
    "t1_h2h_wins", "t2_h2h_wins", "h2h_total", "h2h_ratio",
    "t1_venue_win_pct", "t2_venue_win_pct",
    "avg_venue_score", "bat_first_adv", "chasing_success",
    "t1_momentum", "t2_momentum",
    "t1_nrr_proxy", "t2_nrr_proxy",
    "t1_bat_strength", "t2_bat_strength",
    "t1_bowl_strength", "t2_bowl_strength",
    "t1_strike_rate", "t2_strike_rate",
    "t1_economy", "t2_economy",
]
