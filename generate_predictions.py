#!/usr/bin/env python3
"""
Run once from repo root to regenerate frontend/src/data/results.json.

    python generate_predictions.py

Re-run whenever you want to refresh predictions (e.g. after retraining).
"""
import json
import sys
from pathlib import Path

import pandas as pd

# Make backend modules importable without installing them
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from train import get_predictions_df, load_data, load_model, train_and_save_model

MODEL_PATH = Path("backend/model.pkl")
OUTPUT_PATH = Path("frontend/src/data/results.json")


def _compute_stats(df: pd.DataFrame) -> dict:
    df_sorted = df.sort_values("churn_probability", ascending=False)
    top_n = max(1, int(len(df_sorted) * 0.20))
    top = df_sorted.head(top_n).copy()
    top["annual_value"] = top["MonthlyCharges"] * 12

    breakdown = [
        {
            "risk_tier": str(t),
            "count": int(len(grp)),
            "revenue": round(float(grp["annual_value"].sum()), 2),
        }
        for t, grp in top.groupby("risk_tier")
    ]

    churners = df[df["churn_probability"] >= 0.5].copy()
    churners["annual_value"] = churners["MonthlyCharges"] * 12
    tier_counts = {str(k): int(v) for k, v in df["risk_tier"].value_counts().items()}

    return {
        "total_customers": int(len(df)),
        "predicted_churners": int(len(churners)),
        "at_risk_revenue": round(float(churners["annual_value"].sum()), 2),
        "top_20_pct_count": top_n,
        "total_annual_savings": round(float(top["annual_value"].sum()), 2),
        "tier_counts": tier_counts,
        "breakdown": breakdown,
    }


def _compute_insight() -> str:
    raw = load_data()
    raw["Churn"] = (raw["Churn"] == "Yes").astype(int)
    rates = raw.groupby("Contract")["Churn"].mean()
    mtm = round(float(rates.get("Month-to-month", 0)) * 100, 1)
    one_yr = round(float(rates.get("One year", 0)) * 100, 1)
    two_yr = round(float(rates.get("Two year", 0)) * 100, 1)
    mult = round(mtm / one_yr, 1) if one_yr > 0 else "N/A"
    return (
        f"Month-to-month customers churn at {mtm}% vs {one_yr}% for annual contracts "
        f"({mult}× higher risk). Two-year contracts are the most loyal at {two_yr}% churn."
    )


def _top_customers(df: pd.DataFrame, n: int = 50) -> list:
    top = df.sort_values("churn_probability", ascending=False).head(n).copy()
    top["annual_value"] = top["MonthlyCharges"] * 12
    return [
        {
            "customerID": str(row["customerID"]),
            "churn_probability": round(float(row["churn_probability"]), 4),
            "risk_tier": str(row["risk_tier"]),
            "MonthlyCharges": round(float(row["MonthlyCharges"]), 2),
            "annual_value": round(float(row["annual_value"]), 2),
        }
        for _, row in top.iterrows()
    ]


def main() -> None:
    print("=== Churn Prediction Data Generator ===\n")

    if not MODEL_PATH.exists():
        print("No model.pkl found — training (this takes ~60 s)…")
        train_and_save_model(MODEL_PATH)
    else:
        print(f"Loading model from {MODEL_PATH}…")

    payload = load_model(MODEL_PATH)
    df = get_predictions_df(payload)
    print(f"  {len(df)} customers scored  |  model: {payload['model_name']}  |  AUC: {payload['auc']:.4f}")

    stats = _compute_stats(df)
    insight = _compute_insight()
    customers = _top_customers(df, n=50)

    output = {
        "generated_at": pd.Timestamp.now().isoformat(timespec="seconds"),
        "model_name": payload["model_name"],
        "auc": round(float(payload["auc"]), 4),
        "stats": stats,
        "insight": insight,
        "customers": customers,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2))

    print(f"\n✓  Written → {OUTPUT_PATH}")
    print(f"   total_customers      : {stats['total_customers']:,}")
    print(f"   predicted_churners   : {stats['predicted_churners']:,}")
    print(f"   at_risk_revenue      : ₹{stats['at_risk_revenue']:>12,.0f}")
    print(f"   total_annual_savings : ₹{stats['total_annual_savings']:>12,.0f}")
    print(f"\nInsight: {insight}")


if __name__ == "__main__":
    main()
