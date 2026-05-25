import React from 'react';
import { LogOut, UserRound } from 'lucide-react';
import BrandLogo from './BrandLogo';

const TecnicoHeader = ({ user, onLogout }) => (
  <header className="bg-[#0f172a] text-white px-6 py-8 shadow-xl">
    <div className="mx-auto flex max-w-[1840px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-5">
        <BrandLogo className="h-14 w-20 shadow-lg shadow-indigo-500/20" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300">Area tecnica</p>
          <h1 className="m-0 text-xl font-black italic uppercase tracking-tight text-white">
            Panel <span className="text-indigo-400">Tecnico</span>
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/50 text-slate-200">
          <UserRound size={22} />
        </div>
        <div className="text-left sm:text-right">
          <p className="mb-1 text-[10px] font-black uppercase leading-none tracking-[0.2em] text-indigo-400">
            Usuario conectado
          </p>
          <div className="flex items-center gap-2 sm:justify-end">
            <span className="text-sm font-bold uppercase tracking-tight text-white">
              {user?.username || 'Tecnico'}
            </span>
            <span className="rounded border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-indigo-300">
              {user?.rol || 'Tecnico'}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="group flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-2 pr-4 transition-all hover:border-red-500/50 hover:bg-red-500/10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 transition-colors group-hover:text-red-500">
            <LogOut size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-500">
            Salir
          </span>
        </button>
      </div>
    </div>
  </header>
);

export default TecnicoHeader;
