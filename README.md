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

## Setup (GitHub Codespaces)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # defaults are fine for local dev
python main.py              # downloads dataset + trains model on first run (~60 s)
```

`backend/.env`:

```
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

`frontend/.env`:

```
VITE_API_URL=http://localhost:8000
# Codespaces: VITE_API_URL=https://CODESPACE-NAME-8000.app.github.dev
```

Open port `5173` in your browser.

---

## Deploy

### Backend → Render

`render.yaml` at the repo root is pre-configured. In Render: **New → Blueprint** → connect repo → set `ALLOWED_ORIGINS` to your Vercel frontend URL.

### Frontend → Vercel

Import the repo in Vercel, set root to `frontend/`, and add:

```
VITE_API_URL=https://your-api.onrender.com
```

`vercel.json` handles SPA routing automatically.

---

## API Reference

| Method | Endpoint          | Description                                                      |
| ------ | ----------------- | ---------------------------------------------------------------- |
| GET    | `/health`         | Liveness check — reports model name + customer count             |
| GET    | `/predictions`    | All customers with churn probability, risk tier, monthly charges |
| GET    | `/revenue-impact` | KPIs: churners, at-risk revenue, top-20% savings, tier breakdown |

All responses include `Cache-Control: no-store` headers.

---

## License

MIT © 2026 [Sumeet Tayde](https://github.com/sumeet7878)
