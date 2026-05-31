import React from 'react';
import { CheckCircle2, Eye, Save, Settings, XCircle } from 'lucide-react';
import { PrioridadBadge } from '../../pages/Secretaria/Diagnostico';
import { getCorreccionId, getCorreccionTipo, getEquipo, getRowKey, getTecnicoId } from '../../utils/jefeTecnicoUtils';

export const buildAsignacionColumns = ({
  tecnicos,
  savingId,
  tecnicosSeleccionados,
  puedeEditar,
  getTecnicoDisplay,
  onTecnicoChange,
  onSaveAsignacion,
  onEdit,
  onView,
}) => [
  {
    header: 'Referencia',
    accessor: 'id',
    render: (row) => (
      <div className="py-2">
        <span className="font-black text-indigo-600 block text-base leading-none">#{row.id_diagnostico || row.id_orden}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
          {row.id_orden ? 'Orden aprobada' : 'Diagnostico'}
        </span>
      </div>
    ),
  },
  {
    header: 'Equipo / Cliente',
    accessor: 'equipo',
    render: (row) => {
      const equipo = getEquipo(row);
      return (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 uppercase text-xs">{equipo?.marca || 'S/M'} {equipo?.modelo || 'S/M'}</span>
          <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-tighter">{equipo?.cliente?.nombre || 'Particular'}</span>
        </div>
      );
    },
  },
  {
    header: 'Tecnico y Especialidad',
    accessor: 'asignar',
    contentClassName: 'min-w-[300px] max-w-none pr-8',
    cellClassName: 'pr-8',
    render: (row) => {
      const isSaving = savingId === getRowKey(row);
      const tecnicoId = tecnicosSeleccionados[getRowKey(row)] ?? getTecnicoId(row);
      const edicionPermitida = puedeEditar(row);

      return (
        <div className="relative flex items-center gap-3">
          <select
            value={tecnicoId}
            disabled={!edicionPermitida || isSaving}
            title={tecnicoId ? getTecnicoDisplay(tecnicoId) : 'Seleccionar tecnico'}
            className={`flex-1 px-3 py-2.5 bg-white border-2 ${isSaving ? 'border-amber-400' : 'border-slate-100'} rounded-xl text-[10px] font-bold uppercase outline-none focus:border-indigo-500 transition-all ${edicionPermitida ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
            onChange={(event) => onTecnicoChange(row, event.target.value)}
          >
            <option value="">Seleccionar tecnico...</option>
            {tecnicos.map((tecnico) => (
              <option key={tecnico.id_tecnico} value={tecnico.id_tecnico}>{tecnico.nombre} - {tecnico.especialidad || 'GENERAL'}</option>
            ))}
          </select>
          <div className="w-6 flex justify-center">
            {getTecnicoId(row) && !isSaving && <CheckCircle2 size={20} className="text-emerald-500" />}
          </div>
        </div>
      );
    },
  },
  {
    header: 'Prioridad',
    accessor: 'prioridad',
    contentClassName: 'min-w-[120px] max-w-none pl-4',
    cellClassName: 'pl-6',
    render: (row) => (
      <div className="flex justify-start">
        <PrioridadBadge prioridad={row.prioridad || 'NORMAL'} />
      </div>
    ),
  },
  {
    header: 'Acciones',
    accessor: 'acciones',
    render: (row) => {
      const isSaving = savingId === getRowKey(row);
      const tecnicoId = tecnicosSeleccionados[getRowKey(row)] ?? getTecnicoId(row);
      const edicionPermitida = puedeEditar(row);

      return (
        <div className="flex items-center gap-2">
          <button onClick={() => onView(row)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-black text-[10px] uppercase">
            <Eye size={14} /> Ver
          </button>
          {edicionPermitida && (
            <button
              onClick={() => onEdit(row)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-500 hover:text-white transition-all font-black text-[10px] uppercase"
              title="Editar datos de la orden o diagnostico"
            >
              <Settings size={14} /> Editar
            </button>
          )}
          {edicionPermitida && (
            <button
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm border border-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed font-black text-[10px] uppercase"
              disabled={!tecnicoId || isSaving}
              onClick={() => onSaveAsignacion(row)}
              title="Guardar asignacion"
            >
              {isSaving ? <Settings size={14} className="animate-spin" /> : <Save size={14} />} Guardar
            </button>
          )}
        </div>
      );
    },
  },
];

export const buildRepuestosColumns = ({ savingId, onDecisionRepuesto, onViewDetalle }) => [
  {
    header: 'Referencia de Orden',
    accessor: 'orden',
    render: (row) => (
      <div className="py-2">
        <span className="font-black text-indigo-600 block text-base leading-none">#{row.orden_id || row.orden?.id_orden}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Solicitud #{row.id_detalle_repuesto}</span>
      </div>
    ),
  },
  {
    header: 'Repuesto Solicitado',
    accessor: 'repuesto',
    render: (row) => (
      <div className="flex flex-col">
        <span className="font-bold text-slate-800 uppercase text-xs">{row.repuesto?.nombre || row.pieza_solicitada || 'Pieza pendiente de registrar'}</span>
        <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-tighter">
          {row.repuesto?.descripcion || (row.repuesto_id ? 'Sin descripcion' : 'No registrada en inventario')}
        </span>
      </div>
    ),
  },
  {
    header: 'Cantidad',
    accessor: 'cantidad_usada',
    render: (row) => <span className="font-black text-slate-700">{row.cantidad_usada || 1}</span>,
  },
  {
    header: 'Tecnico que solicita',
    accessor: 'tecnico',
    render: (row) => {
      const tecnico = row.orden?.tecnico || row.orden?.diagnostico?.tecnico;
      return (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 uppercase text-xs">{tecnico?.nombre || 'Sin tecnico'}</span>
          <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-tighter">{tecnico?.especialidad || 'GENERAL'}</span>
        </div>
      );
    },
  },
  {
    header: 'Acciones',
    accessor: 'acciones',
    render: (row) => {
      const isSaving = savingId === `repuesto-${row.id_detalle_repuesto}`;
      return (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => onViewDetalle(row)} disabled={isSaving} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-black text-[10px] uppercase disabled:opacity-50">
            <Eye size={14} /> Detalle
          </button>
          <button onClick={() => onDecisionRepuesto(row, 'aprobar')} disabled={isSaving} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-black text-[10px] uppercase disabled:opacity-50">
            {isSaving ? <Settings size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Aprobar
          </button>
          <button onClick={() => onDecisionRepuesto(row, 'rechazar')} disabled={isSaving} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase disabled:opacity-50">
            <XCircle size={14} /> Rechazar
          </button>
        </div>
      );
    },
  },
];

export const buildCorreccionesColumns = ({ onEdit }) => [
  {
    header: 'Referencia',
    accessor: 'referencia',
    render: (row) => (
      <div className="py-2">
        <span className="font-black text-indigo-600 block text-base leading-none">#{getCorreccionId(row)}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{getCorreccionTipo(row)}</span>
      </div>
    ),
  },
  {
    header: 'Equipo / Cliente',
    accessor: 'equipo',
    render: (row) => {
      const equipo = getEquipo(row);
      return (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 uppercase text-xs">{equipo?.marca || 'S/M'} {equipo?.modelo || 'S/M'}</span>
          <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-tighter">{equipo?.cliente?.nombre || 'Particular'}</span>
        </div>
      );
    },
  },
  {
    header: 'Tecnico',
    accessor: 'tecnico',
    render: (row) => {
      const tecnico = row.tecnico || row.orden?.tecnico || row.diagnostico?.tecnico;
      return <span className="font-bold text-slate-700 uppercase text-xs">{tecnico?.nombre || 'Sin tecnico'}</span>;
    },
  },
  {
    header: 'Acciones',
    accessor: 'acciones',
    render: (row) => (
      <button onClick={() => onEdit(row)} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-black text-[10px] uppercase">
        <Settings size={14} /> Corregir
      </button>
    ),
  },
];
