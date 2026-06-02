import { useState } from "react";
import data from "./data/results.json";
import ChurnBarChart from "./components/ChurnBarChart.jsx";
import CustomerTable from "./components/CustomerTable.jsx";
import InsightBanner from "./components/InsightBanner.jsx";
import KPICard from "./components/KPICard.jsx";
import { CURRENCIES, CURRENCY_KEYS, formatMoney } from "./utils/currency.js";

// ─── Currency selector ────────────────────────────────────────────────────────
function CurrencySelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-gray-400 text-xs hidden sm:inline select-none">Currency</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-200 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
      >
        {CURRENCY_KEYS.map((code) => (
          <option key={code} value={code}>
            {code} ({CURRENCIES[code].symbol.trim()})
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Revenue breakdown panel ──────────────────────────────────────────────────
const TIER_STYLE = {
  High:   "border-red-500/30 bg-red-500/10 text-red-300",
  Medium: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  Low:    "border-green-500/30 bg-green-500/10 text-green-300",
};
const TIER_ORDER = ["High", "Medium", "Low"];

function RevenueBreakdown({ breakdown, fmtMoney }) {
  if (!breakdown?.length)
    return <p className="text-gray-500 text-sm py-4">No data.</p>;

  const sorted = [...breakdown].sort(
    (a, b) => TIER_ORDER.indexOf(a.risk_tier) - TIER_ORDER.indexOf(b.risk_tier)
  );

  return (
    <div className="space-y-3 mt-1">
      {sorted.map((b) => (
        <div
          key={b.risk_tier}
          className={`flex justify-between items-center px-4 py-3 rounded-lg border ${
            TIER_STYLE[b.risk_tier] ?? "border-gray-700 bg-gray-800 text-gray-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">{b.risk_tier} Risk</span>
            <span className="text-xs opacity-70">({b.count} customers)</span>
          </div>
          <span className="font-bold tabular-nums">{fmtMoney(b.revenue)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [currency, setCurrency] = useState("INR");

  const { stats, insight, customers } = data;

  const fmtMoney = (amountINR, decimals = 0) =>
    formatMoney(Number(amountINR ?? 0), currency, decimals);

  const topCustomers = customers.slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Customer Churn Prediction
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Revenue impact analysis &amp; at-risk customer identification
            </p>
          </div>
          <div className="pt-1">
            <CurrencySelector value={currency} onChange={setCurrency} />
          </div>
        </header>

        {/* Insight banners */}
        <InsightBanner
          savings={stats.total_annual_savings}
          topCount={stats.top_20_pct_count}
          insight={insight}
          fmtMoney={fmtMoney}
        />

        {/* KPI cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Customers"
            value={stats.total_customers.toLocaleString()}
            icon="👥"
            color="indigo"
          />
          <KPICard
            title="Predicted Churners"
            value={stats.predicted_churners.toLocaleString()}
            icon="⚠️"
            color="yellow"
          />
          <KPICard
            title="At-Risk Revenue (Annual)"
            value={fmtMoney(stats.at_risk_revenue)}
            icon="💸"
            color="red"
          />
          <KPICard
            title="Potential Savings"
            value={fmtMoney(stats.total_annual_savings)}
            icon="💰"
            color="green"
          />
        </section>

        {/* Charts row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-100 mb-4">
              Customers by Risk Tier
            </h2>
            <ChurnBarChart tierCounts={stats.tier_counts} />
          </div>

          <div className="bg-gray-900 rounded-xl p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-100">
              Top 20% — Revenue Breakdown
            </h2>
            <p className="text-gray-500 text-xs mt-0.5 mb-4">
              Annual value at stake per risk segment within the top 20% at-risk cohort
            </p>
            <RevenueBreakdown breakdown={stats.breakdown} fmtMoney={fmtMoney} />
          </div>
        </section>

        {/* Top-20 table */}
        <section className="bg-gray-900 rounded-xl p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base font-semibold text-gray-100">
              Top 20 High-Risk Customers
            </h2>
            <span className="text-xs text-gray-500">Click column headers to sort</span>
          </div>
          <CustomerTable customers={topCustomers} fmtMoney={fmtMoney} />
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-600 text-xs">
          Model: {data.model_name} (ROC-AUC {data.auc}) · Dataset: IBM Telco Customer Churn
        </footer>
      </div>
    </div>
  );
}
