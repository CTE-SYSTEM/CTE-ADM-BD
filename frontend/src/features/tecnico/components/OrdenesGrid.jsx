import React, { useState } from 'react';
import { ChevronDown, Package } from 'lucide-react';
import { EstadoBadge, PrioridadBadge } from './TecnicoBadges';

const formatBoolean = (value) => {
  if (value === true) return 'Si';
  if (value === false) return 'No';
  return 'No registrado';
};

const CompletedOrderDetails = ({ orden, solicitudesPiezas }) => (
  <div className="mb-4 space-y-4">
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left sm:grid-cols-2">
      <div>
        <span className="text-[9px] font-black uppercase text-slate-500">Cliente</span>
        <p className="text-xs font-bold text-slate-800">{orden.cliente || 'Sin cliente'}</p>
      </div>
      <div>
        <span className="text-[9px] font-black uppercase text-slate-500">Resultado final</span>
        <p className="text-xs font-bold text-slate-800">{orden.resultado_final || orden.estado || 'Sin resultado'}</p>
      </div>
      <div>
        <span className="text-[9px] font-black uppercase text-slate-500">Piezas requeridas</span>
        <p className="text-xs font-bold text-slate-800">{orden.requiere_piezas ? 'Si' : 'No'}</p>
      </div>
      <div>
        <span className="text-[9px] font-black uppercase text-slate-500">Enciende al salir</span>
        <p className="text-xs font-bold text-slate-800">{formatBoolean(orden.enciende_salida)}</p>
      </div>
      <div>
        <span className="text-[9px] font-black uppercase text-slate-500">Usa corriente AC</span>
        <p className="text-xs font-bold text-slate-800">{formatBoolean(orden.usa_corriente_ac_salida)}</p>
      </div>
    </div>

    <div className="rounded-xl border border-slate-200 bg-white p-4 text-left">
      <span className="text-[9px] font-black uppercase text-slate-500">Diagnostico / trabajo realizado</span>
      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">
        {orden.diagnostico || 'Sin diagnostico registrado.'}
      </p>
    </div>

    <div className="rounded-xl border border-slate-200 bg-white p-4 text-left">
      <span className="text-[9px] font-black uppercase text-slate-500">Observacion final</span>
      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">
        {orden.observacion_final || 'Sin observaciones finales.'}
      </p>
    </div>

    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-left">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[9px] font-black uppercase text-indigo-700">Piezas vinculadas</span>
        <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase text-indigo-700">
          {solicitudesPiezas.length}
        </span>
      </div>

      {solicitudesPiezas.length > 0 ? (
        <div className="space-y-2">
          {solicitudesPiezas.map((pieza) => (
            <div key={pieza.id_detalle_repuesto || `${pieza.repuesto_id}-${pieza.pieza_solicitada}`} className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black uppercase text-slate-800">
                  {pieza.repuesto?.nombre || pieza.pieza_solicitada || 'Pieza pendiente de registrar'}
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-600">
                    {pieza.estado_aprobacion || 'Sin estado'}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase text-emerald-700">
                    {pieza.estado_entrega || 'PENDIENTE'}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                Cantidad: {pieza.cantidad_usada || 1}
                {pieza.repuesto?.descripcion ? ` · ${pieza.repuesto.descripcion}` : ''}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs font-semibold text-slate-500">Esta orden no tiene piezas vinculadas.</p>
      )}
    </div>
  </div>
);

const OrdenCard = ({ orden, completed, onEstadoChange, onSolicitarPieza }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const solicitudesPiezas = orden.repuestos_usados || [];
  const tienePiezasSinAprobar = orden.requiere_piezas !== false
    && solicitudesPiezas.some((item) => item.estado_aprobacion !== 'APROBADO' || item.estado_entrega !== 'ENTREGADO');
  const puedeFinalizar = orden.requiere_piezas === false || solicitudesPiezas.length === 0 || !tienePiezasSinAprobar;
  const puedeEditar = !completed || orden.puedeEditarCompletada;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
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
      {!orden.requiere_piezas && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
          Servicio sin piezas. La orden puede finalizarse sin solicitudes de repuestos.
        </div>
      )}
      {completed && (
        <>
          <button
            type="button"
            onClick={() => setDetailsOpen((value) => !value)}
            className="mb-4 flex w-full items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-left text-xs font-black uppercase text-indigo-700 transition hover:bg-indigo-100"
          >
            <span>Ver detalle de cierre y piezas</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
          </button>
          {detailsOpen && (
            <CompletedOrderDetails orden={orden} solicitudesPiezas={solicitudesPiezas} />
          )}
        </>
      )}
      {tienePiezasSinAprobar && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          Todas las piezas solicitadas deben estar aprobadas y entregadas para finalizar.
        </div>
      )}
      {completed ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
          Orden cerrada. Solo lectura.
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            disabled={!puedeEditar}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[10px] font-black uppercase text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
            value={orden.estado}
            onChange={(event) => onEstadoChange(orden.id, event.target.value)}
          >
            <option value="EN_REPARACION">EN REPARACION</option>
            <option value="FINALIZADO" disabled={!puedeFinalizar}>FINALIZADO</option>
            <option value="IRREPARABLE">IRREPARABLE</option>
          </select>
          <button
            onClick={() => onSolicitarPieza(orden)}
            disabled={!puedeEditar || orden.requiere_piezas === false}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Package size={14} /> Pieza
          </button>
        </div>
      )}
    </div>
  );
};

const OrdenesGrid = ({ items, loading, completed = false, onEstadoChange, onSolicitarPieza }) => (
  <div className="grid gap-6 md:grid-cols-2">
    {items.map((orden) => (
      <OrdenCard
        key={orden.id}
        orden={orden}
        completed={completed}
        onEstadoChange={onEstadoChange}
        onSolicitarPieza={onSolicitarPieza}
      />
    ))}
    {!loading && items.length === 0 && (
      <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 italic">
        {completed ? 'No tienes ordenes completadas.' : 'No tienes ordenes de reparacion activas.'}
      </div>
    )}
  </div>
);

export default OrdenesGrid;
