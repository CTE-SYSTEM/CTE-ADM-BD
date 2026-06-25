import React from 'react';
import { AlertTriangle, Bell, History, Package, Search, Settings, ShieldCheck, X } from 'lucide-react';
import PageHelp from '../../PageHelp';
import Table from '../../Table';
import { TAB_ALERTAS, TAB_CORRECCIONES, TAB_DIAGNOSTICOS, TAB_ORDENES, TAB_REPUESTOS } from '../../../utils/jefeTecnicoConstants';
import { StatCard, TabButton } from '../components';

export const JefeTecnicoIntro = ({ showHelp }) => (
  <>
    <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Centro de control tecnico</h2>
        <p className="mt-1 text-sm font-semibold text-slate-400">Asignaciones, aprobaciones, alertas y correcciones del taller.</p>
      </div>
      <PageHelp compact />
    </div>

    {showHelp && (
      <section className="mb-8 rounded-2xl bg-slate-950 p-6 text-white shadow-sm space-y-4 animate-fade-in">
        <div>
          <h2 className="text-lg font-bold">Mini tutorial del jefe tecnico</h2>
          <p className="mt-1 text-sm text-slate-300">
            Usa este panel para repartir trabajo, aprobar repuestos y corregir avances antes de que se acumulen retrasos.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['1. Revisa pendientes', 'Las tarjetas muestran diagnosticos, ordenes, repuestos y alertas abiertas.', 'text-blue-400'],
            ['2. Asigna tecnicos', 'En diagnosticos y ordenes selecciona tecnico y guarda la asignacion.', 'text-indigo-400'],
            ['3. Aprueba repuestos', 'Valida solicitudes de piezas antes de que pasen a facturacion.', 'text-emerald-400'],
            ['4. Corrige a tiempo', 'La pestana de correcciones permite ajustar tecnico, estado, prioridad o pieza.', 'text-amber-400'],
          ].map(([title, text, color]) => (
            <div key={title} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className={`text-sm font-semibold ${color}`}>{title}</p>
              <p className="mt-1 text-xs text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>
    )}
  </>
);

export const JefeTecnicoStats = ({ diagnosticosPendientes, ordenesAprobadas, repuestosPendientes, alertasRetraso }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
    <StatCard icon={<Search size={22} />} label="Diagnosticos en bandeja" value={diagnosticosPendientes.length} color="blue" />
    <StatCard icon={<Package size={22} />} label="Ordenes en bandeja" value={ordenesAprobadas.length} color="amber" />
    <StatCard icon={<ShieldCheck size={22} />} label="Repuestos por aprobar" value={repuestosPendientes.length} color="emerald" />
    <StatCard icon={<AlertTriangle size={22} />} label="Alertas +72h" value={alertasRetraso.length} color="red" />
  </div>
);

export const AsignacionesRecientes = ({ asignacionesRecientes, asignacionColumns }) => {
  if (asignacionesRecientes.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4 px-4">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
          <History size={20} />
        </div>
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
          Asignaciones recientes (Margen de edicion)
        </h2>
      </div>
      <div className="bg-white rounded-[2rem] shadow-xl border-2 border-amber-50 overflow-hidden">
        <Table columns={asignacionColumns} data={asignacionesRecientes} />
      </div>
    </section>
  );
};

export const JefeTecnicoTabs = ({ activeTab, alertasRetraso, correccionesFiltradas, onChange }) => (
  <div className="flex flex-wrap gap-3 mb-8">
    <TabButton active={activeTab === TAB_DIAGNOSTICOS} onClick={() => onChange(TAB_DIAGNOSTICOS)} icon={<Search size={16} />} label="Asignar Diagnosticos" />
    <TabButton active={activeTab === TAB_ORDENES} onClick={() => onChange(TAB_ORDENES)} icon={<Package size={16} />} label="Ordenes por aprobar" />
    <TabButton active={activeTab === TAB_REPUESTOS} onClick={() => onChange(TAB_REPUESTOS)} icon={<ShieldCheck size={16} />} label="Aprobacion de Repuestos" />
    <TabButton active={activeTab === TAB_ALERTAS} onClick={() => onChange(TAB_ALERTAS)} icon={<Bell size={16} />} label={`Alertas (${alertasRetraso.length})`} />
    <TabButton active={activeTab === TAB_CORRECCIONES} onClick={() => onChange(TAB_CORRECCIONES)} icon={<Settings size={16} />} label={`Correcciones (${correccionesFiltradas.length})`} />
  </div>
);

const DismissibleMessage = ({ tone, children, onDismiss }) => (
  <div className={`mb-6 flex items-start justify-between gap-4 rounded-2xl border p-4 text-xs font-bold uppercase ${
    tone === 'error'
      ? 'border-red-100 bg-red-50 text-red-600'
      : 'border-emerald-100 bg-emerald-50 text-emerald-700'
  }`}>
    <span className="leading-relaxed">{children}</span>
    <button type="button" onClick={onDismiss} className="rounded-lg p-1 hover:bg-white/80" title="Cerrar mensaje">
      <X size={14} />
    </button>
  </div>
);

export const JefeTecnicoMessages = ({
  asignacionError,
  asignacionOk,
  repuestoDecisionError,
  repuestoDecisionOk,
  irreparableDecisionError,
  irreparableDecisionOk,
  onDismissAsignacion,
  onDismissRepuesto,
  onDismissIrreparable,
}) => (
  <>
    {(asignacionError || asignacionOk) && (
      <DismissibleMessage tone={asignacionError ? 'error' : 'success'} onDismiss={onDismissAsignacion}>
        {asignacionError || asignacionOk}
      </DismissibleMessage>
    )}

    {(repuestoDecisionError || repuestoDecisionOk) && (
      <DismissibleMessage tone={repuestoDecisionError ? 'error' : 'success'} onDismiss={onDismissRepuesto}>
        {repuestoDecisionError || repuestoDecisionOk}
      </DismissibleMessage>
    )}

    {(irreparableDecisionError || irreparableDecisionOk) && (
      <DismissibleMessage tone={irreparableDecisionError ? 'error' : 'success'} onDismiss={onDismissIrreparable}>
        {irreparableDecisionError || irreparableDecisionOk}
      </DismissibleMessage>
    )}
  </>
);

export const CorreccionesSearch = ({ activeTab, searchTerm, onSearch }) => {
  if (activeTab !== TAB_CORRECCIONES) return null;

  return (
    <div className="mb-6 px-4">
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar correccion por ID, tipo, tecnico o equipo..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all placeholder:font-medium shadow-sm"
        />
      </div>
    </div>
  );
};

export const JefeTecnicoTablePanel = ({ loading, columns, data }) => (
  <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
    {loading ? (
      <div className="p-40 text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="font-black text-slate-300 uppercase text-xs tracking-widest">Cargando...</span>
      </div>
    ) : (
      <Table columns={columns} data={data} />
    )}
  </div>
);
