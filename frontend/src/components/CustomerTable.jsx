import { useState } from "react";

const TIER_PILL = {
  High:   "bg-red-500/20 text-red-300 ring-1 ring-red-500/40",
  Medium: "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40",
  Low:    "bg-green-500/20 text-green-300 ring-1 ring-green-500/40",
};

const COLS = [
  { key: "rank",              label: "#",               sortable: false },
  { key: "customerID",        label: "Customer ID",     sortable: true  },
  { key: "churn_probability", label: "Churn Prob.",     sortable: true  },
  { key: "risk_tier",         label: "Risk Tier",       sortable: true  },
  { key: "MonthlyCharges",    label: "Monthly",      sortable: true  },
  { key: "annual_value",      label: "Annual Value", sortable: true  },
];

function SortIcon({ active, dir }) {
  if (!active) return <span className="ml-1 text-gray-600">↕</span>;
  return <span className="ml-1 text-indigo-400">{dir === "asc" ? "↑" : "↓"}</span>;
}

export default function CustomerTable({ customers, fmtMoney }) {
  const [sortKey, setSortKey] = useState("churn_probability");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (key) => {
    if (!key || key === "rank") return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const withAnnual = customers.map((c) => ({
    ...c,
    annual_value: c.MonthlyCharges * 12,
  }));

  const sorted = [...withAnnual].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (!sorted.length) {
    return <p className="text-gray-500 text-sm py-4">No customers to display.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700/80">
            {COLS.map((col) => (
              <th
                key={col.key}
                className={`text-left py-3 px-3 font-medium select-none ${
                  col.sortable ? "cursor-pointer hover:text-gray-200" : ""
                }`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                {col.label}
                {col.sortable && (
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => {
            const pct = (c.churn_probability * 100).toFixed(1);
            return (
              <tr
                key={c.customerID}
                className="border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors"
              >
                <td className="py-3 px-3 text-gray-500 tabular-nums">{i + 1}</td>
                <td className="py-3 px-3 font-mono text-indigo-300 text-xs">{c.customerID}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 bg-gray-700 rounded-full h-1.5 shrink-0">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-white tabular-nums">{pct}%</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      TIER_PILL[c.risk_tier] ?? ""
                    }`}
                  >
                    {c.risk_tier}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-300 tabular-nums">
                  {fmtMoney(c.MonthlyCharges, 2)}
                </td>
                <td className="py-3 px-3 text-green-400 font-semibold tabular-nums">
                  {fmtMoney(c.annual_value)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
