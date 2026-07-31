import React from 'react';

const cardColors = {
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  violet: 'bg-violet-100 text-violet-700',
};

export const TecnicoStatCard = ({ icon, label, value, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${cardColors[color] || cardColors.blue}`}>
      {icon}
    </div>
    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
    <span className="text-3xl font-black tracking-tighter text-slate-950">{value}</span>
  </div>
);

export const TecnicoTabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 rounded-2xl px-6 py-4 text-[10px] font-black uppercase transition-all ${
      active
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-700/20'
        : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);
