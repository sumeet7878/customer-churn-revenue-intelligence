const gradients = {
  indigo: "from-indigo-600/20 to-indigo-900/10 border-indigo-500/30",
  yellow: "from-yellow-600/20 to-yellow-900/10 border-yellow-500/30",
  red:    "from-red-600/20    to-red-900/10    border-red-500/30",
  green:  "from-green-600/20  to-green-900/10  border-green-500/30",
};

export default function KPICard({ title, value, icon, color = "indigo" }) {
  return (
    <div
      className={`bg-gradient-to-br ${gradients[color]} border rounded-xl p-5 flex flex-col gap-3`}
    >
      <div className="flex items-start justify-between">
        <p className="text-gray-400 text-sm font-medium leading-tight">{title}</p>
        <span className="text-2xl select-none">{icon}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-all">
        {value ?? "—"}
      </p>
    </div>
  );
}
