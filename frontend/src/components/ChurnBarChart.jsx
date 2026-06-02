import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TIER_ORDER = ["High", "Medium", "Low"];
const TIER_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-gray-300 text-sm font-medium">{label} Risk</p>
      <p className="text-white font-bold">{payload[0].value.toLocaleString()} customers</p>
    </div>
  );
};

export default function ChurnBarChart({ tierCounts }) {
  const data = TIER_ORDER.filter((t) => tierCounts[t] !== undefined).map((t) => ({
    tier: t,
    count: tierCounts[t],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis
          dataKey="tier"
          stroke="#6b7280"
          tick={{ fill: "#9ca3af", fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={80}>
          {data.map((entry) => (
            <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
