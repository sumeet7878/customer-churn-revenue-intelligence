# Customer Churn Prediction + Revenue Impact Dashboard

> End-to-end ML web app that predicts telecom customer churn and quantifies the annual revenue at stake — with multi-currency support.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## Live Demo

|          | Link                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Frontend | [your-app.vercel.app](https://your-app.vercel.app)                                                                             |
| API      | [customer-churn-revenue-intelligence-1.onrender.com](https://customer-churn-revenue-intelligence-1.onrender.com)               |
| Source   | [github.com/sumeet7878/customer-churn-revenue-intelligence](https://github.com/sumeet7878/customer-churn-revenue-intelligence) |

> **Note:** Backend runs on Render's free tier — first request after inactivity may take ~40 seconds to wake up. Subsequent requests are fast.

![Dashboard Preview](screenshot.png)


---

## Problem Statement

Telecom companies lose **15–25% of their customer base annually to churn**, translating to millions in lost recurring revenue. Identifying at-risk customers before they leave is critical — reactive win-back campaigns cost 5× more than proactive retention.

---

## Business Impact

> **The model identifies the top 20% highest-risk customers. Targeting this cohort with proactive retention campaigns can save ₹3,00,000+ annually — without spending budget on the 80% unlikely to churn.**

The dashboard surfaces:

- **At-risk annual revenue** broken down across High / Medium / Low risk segments
- **Top 20 individual customers** ranked by churn probability with sortable revenue impact
- **Live currency toggle** (INR · USD · AED · GBP · EUR) for global stakeholders — no API calls, instant conversion

---

## Key Insight

**Month-to-month contract customers churn 3× more than those on annual plans** — making contract type the single strongest retention lever available to the business.

---

## Tech Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| ML / API   | Python · FastAPI · scikit-learn · pandas  |
| Frontend   | React 18 · Vite · Tailwind CSS · Recharts |
| Deployment | Render (backend) · Vercel (frontend)      |

---

## How It Works

- **Train once, serve fast** — Logistic Regression and Random Forest are both trained on the [IBM Telco Churn dataset](https://github.com/IBM/telco-customer-churn-on-icp4d); the winner by ROC-AUC is persisted as `model.pkl` and loaded at startup. Zero retraining per request.
- **Risk tiering** — all 7,000+ customers are scored and bucketed: High (≥ 70%), Medium (40–70%), Low (< 40%).
- **Revenue impact** — annual value = `MonthlyCharges × 12`; the top 20% at-risk cohort is isolated to compute realistic retention savings.
- **Currency toggle** — all monetary KPIs convert instantly across 5 currencies using fixed rates; no external API calls.

---

## Model Performance

| Model               | ROC-AUC |
| ------------------- | ------- |
| Logistic Regression | ~0.85   |
| Random Forest       | ~0.83   |

Winner is selected automatically at training time and logged to console on startup. LR typically edges out RF on this dataset due to its linear decision boundary aligning well with the churn signal.

---

## Setup

### 1. Generate prediction data (run once)

```bash
# From repo root — installs backend deps if needed
pip install -r backend/requirements.txt
python generate_predictions.py
```

This trains the model (if `backend/model.pkl` is absent), scores all 7 000+ customers, and writes `frontend/src/data/results.json`. Re-run whenever you want fresh predictions.

### 2. Run the frontend locally

```bash
cd frontend
npm install
npm run dev        # opens http://localhost:5173
```

No backend server needed — the frontend reads `results.json` at build time.

---

## Deploy to Vercel (frontend-only, free)

1. Push repo to GitHub.
2. [vercel.com](https://vercel.com) → **New Project** → import repo.
3. Leave **Root Directory** as `/` (root-level `vercel.json` handles everything).
4. No environment variables needed.
5. Click **Deploy**.

`vercel.json` at the repo root builds `frontend/` and serves `frontend/dist/`.

> **No backend required in production.** All prediction data is pre-computed and bundled with the frontend at build time.

---

## Refreshing predictions

```bash
# Retrain + regenerate (if you want updated data)
python generate_predictions.py
git add frontend/src/data/results.json
git commit -m "chore: refresh prediction data"
git push
```

Vercel auto-deploys on push.

---

## Backend (reference only)

The `backend/` folder contains the original FastAPI server and is kept for reference. It is **not** used in the Vercel deployment.

| File | Purpose |
|---|---|
| `backend/train.py` | ML pipeline — LR vs RF, picks best by ROC-AUC |
| `backend/main.py` | FastAPI endpoints (`/health`, `/predictions`, `/revenue-impact`) |
| `generate_predictions.py` | One-time script that uses the backend ML code to produce `results.json` |

All responses include `Cache-Control: no-store` headers.

---

## License

MIT © 2026 [Sumeet Tayde](https://github.com/sumeet7878)
