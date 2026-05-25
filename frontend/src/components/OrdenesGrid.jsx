import React from 'react';
import { Package } from 'lucide-react';
import { EstadoBadge, PrioridadBadge } from './TecnicoBadges';

const OrdenesGrid = ({ items, loading, completed = false, onEstadoChange, onSolicitarPieza }) => (
  <div className="grid gap-6 md:grid-cols-2">
    {items.map((orden) => {
      const solicitudesPiezas = orden.repuestos_usados || [];
      const tienePiezasSinAprobar = solicitudesPiezas.some((item) => item.estado_aprobacion !== 'APROBADO');
      const puedeFinalizar = solicitudesPiezas.length === 0 || !tienePiezasSinAprobar;
      const puedeEditar = !completed || orden.puedeEditarCompletada;

      return (
        <div key={orden.id} className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black text-indigo-700">#{orden.id}</span>
                <PrioridadBadge prioridad={orden.prioridad} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{orden.equipo}</h3>
            </div>
            <EstadoBadge estado={orden.estado} />
          </div>
          <div className="bg-slate-100 rounded-xl p-4 mb-4">
            <span className="text-[9px] font-black text-slate-500 uppercase">Falla Reportada</span>
            <p className="text-xs text-slate-700 italic">"{orden.falla}"</p>
          </div>
          {tienePiezasSinAprobar && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              Todas las piezas solicitadas deben estar aprobadas para finalizar.
            </div>
          )}
          {completed && !puedeEditar && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
              Edicion bloqueada: ya paso el dia o no esta entre las ultimas 5 completadas.
            </div>
          )}
          <div className="flex gap-2">
            <select
              disabled={!puedeEditar}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[10px] font-black uppercase text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
              value={orden.estado}
              onChange={(event) => onEstadoChange(orden.id, event.target.value)}
            >
              <option value="EN_REPARACION">EN REPARACION</option>
              <option value="ESPERANDO_PIEZA">ESPERANDO PIEZA</option>
              <option value="FINALIZADO" disabled={!puedeFinalizar}>FINALIZADO</option>
              <option value="IRREPARABLE">IRREPARABLE</option>
            </select>
            <button
              onClick={() => onSolicitarPieza(orden)}
              disabled={!puedeEditar || completed}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Package size={14} /> Pieza
            </button>
          </div>
        </div>
      );
    })}
    {!loading && items.length === 0 && (
      <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 italic">
        {completed ? 'No tienes ordenes completadas.' : 'No tienes ordenes de reparacion activas.'}
      </div>
    )}
  </div>
);

export default OrdenesGrid;
