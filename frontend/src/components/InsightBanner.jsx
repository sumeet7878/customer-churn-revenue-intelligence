export default function InsightBanner({ savings, topCount, fmtMoney }) {
  return (
    <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
      <span className="text-2xl shrink-0 select-none">💡</span>
      <p className="text-indigo-100 font-medium text-sm sm:text-base leading-relaxed">
        Targeting the top 20% high-risk customers&nbsp;
        <span className="text-white font-semibold">
          ({(topCount ?? 0).toLocaleString()} customers)
        </span>{" "}
        can save{" "}
        <span className="text-green-400 font-bold text-base sm:text-lg">
          {fmtMoney(savings ?? 0)}
        </span>{" "}
        annually through proactive retention campaigns.
      </p>
    </div>
  );
}
