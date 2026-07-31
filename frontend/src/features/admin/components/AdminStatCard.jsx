export function AdminStatCard({ label, value, tone = 'text-slate-900', className = '' }) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm border border-gray-100 ${className}`}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}
