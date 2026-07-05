import logging
import os
from pathlib import Path

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from train import get_predictions_df, load_model, train_and_save_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Churn Prediction API", version="1.0.0")

# ── CORS ────────────────────────────────────────────────────────────────────
# Default to wildcard so Codespaces / local dev works out of the box.
# Override via ALLOWED_ORIGINS="https://foo.vercel.app,http://localhost:5173"
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # must be False when origins contains "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = Path("model.pkl")
PREDICTIONS_CACHE: pd.DataFrame | None = None

NO_CACHE = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


# ── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event() -> None:
    global PREDICTIONS_CACHE
    if not MODEL_PATH.exists():
        logger.info("No model found — training from scratch…")
        train_and_save_model(MODEL_PATH)
    else:
        logger.info("model.pkl found — loading…")

    payload = load_model(MODEL_PATH)
    PREDICTIONS_CACHE = get_predictions_df(payload)
    logger.info(
        "Ready. %d customers loaded. Best model: %s (AUC=%.4f)",
        len(PREDICTIONS_CACHE),
        payload["model_name"],
        payload["auc"],
    )


# ── Helpers ──────────────────────────────────────────────────────────────────
def _resp(data: dict) -> JSONResponse:
    return JSONResponse(content=data, headers=NO_CACHE)


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return _resp(
        {
            "status": "ok",
            "model_loaded": MODEL_PATH.exists(),
            "customers_cached": len(PREDICTIONS_CACHE) if PREDICTIONS_CACHE is not None else 0,
        }
    )


@app.get("/predictions")
async def predictions():
    df = PREDICTIONS_CACHE
    if df is None:
        return _resp({"total": 0, "customers": []})

    records = [
        {
            "customerID": str(row["customerID"]),
            "churn_probability": float(row["churn_probability"]),
            "risk_tier": str(row["risk_tier"]),
            "MonthlyCharges": float(row["MonthlyCharges"]),
        }
        for _, row in df.iterrows()
    ]
    return _resp({"total": len(records), "customers": records})


@app.get("/revenue-impact")
async def revenue_impact():
    df = PREDICTIONS_CACHE
    if df is None:
        return _resp({})

    # Top 20 % by churn probability → potential savings
    df_sorted = df.sort_values("churn_probability", ascending=False)
    top_n = max(1, int(len(df_sorted) * 0.20))
    top = df_sorted.head(top_n).copy()
    top["annual_value"] = top["MonthlyCharges"] * 12

    total_savings = round(float(top["annual_value"].sum()), 2)

    # Breakdown by risk tier inside top-20 %
    breakdown = []
    for t, grp in top.groupby("risk_tier"):
        breakdown.append(
            {
                "risk_tier": str(t),
                "count": int(len(grp)),
                "revenue": round(float(grp["annual_value"].sum()), 2),
            }
        )

    # Predicted churners (prob ≥ 0.5) — all customers
    churners = df[df["churn_probability"] >= 0.5].copy()
    churners["annual_value"] = churners["MonthlyCharges"] * 12
    at_risk_revenue = round(float(churners["annual_value"].sum()), 2)

    tier_counts = {
        str(k): int(v) for k, v in df["risk_tier"].value_counts().items()
    }

    return _resp(
        {
            "total_customers": int(len(df)),
            "predicted_churners": int(len(churners)),
            "at_risk_revenue": at_risk_revenue,
            "top_20_pct_count": top_n,
            "total_annual_savings": total_savings,
            "breakdown": breakdown,
            "tier_counts": tier_counts,
        }
    )


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
