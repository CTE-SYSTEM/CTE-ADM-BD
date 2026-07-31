import React from 'react';
import { EstadoSolicitudBadge } from './TecnicoBadges';

const RepuestosTable = ({ solicitudes, loading }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
    <table className="min-w-full divide-y divide-slate-200">
      <thead className="bg-slate-100">
        <tr className="text-left text-[10px] font-black uppercase text-slate-500">
          <th className="px-6 py-4">Orden</th>
          <th className="px-6 py-4">Pieza</th>
          <th className="px-6 py-4">Cantidad</th>
          <th className="px-6 py-4">Inventario</th>
          <th className="px-6 py-4 text-center">Estado</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {solicitudes.map((item) => (
          <tr key={item.id} className="text-sm">
            <td className="px-6 py-4 font-black text-indigo-700">#{item.ordenId}</td>
            <td className="px-6 py-4 font-bold text-slate-900">{item.repuesto}</td>
            <td className="px-6 py-4 font-bold text-slate-700">{item.cantidad}</td>
            <td className="px-6 py-4">
              <span className={`rounded px-2 py-1 text-[10px] font-black uppercase ${item.pendienteInventario ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {item.pendienteInventario ? 'Por registrar' : 'Registrada'}
              </span>
            </td>
            <td className="px-6 py-4 text-center"><EstadoSolicitudBadge estado={item.estado} /></td>
          </tr>
        ))}
        {!loading && solicitudes.length === 0 && (
          <tr>
            <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">No has solicitado piezas todavia.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default RepuestosTable;
