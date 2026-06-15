import React from 'react';
import { Eye, FileText } from 'lucide-react';
import { EstadoBadge } from './TecnicoBadges';

const formatPresupuesto = (value) => {
  const amount = Number(String(value).replace(/[^\d.-]/g, ''));
  if (Number.isNaN(amount) || amount === 0) return null;
  const [integerPart, decimalPart] = amount.toFixed(2).split('.');
  return `${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${decimalPart}`;
};

const DiagnosticosTable = ({ items, loading, readOnly, correctionMode = false, onOpenDiagnostico }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
    <table className="min-w-full divide-y divide-slate-200">
      <thead className="bg-slate-100">
        <tr className="text-left text-[10px] font-black uppercase text-slate-500">
          <th className="px-6 py-4">Diagnostico</th>
          <th className="px-6 py-4">Equipo</th>
          <th className="px-6 py-4">Estado</th>
          <th className="px-6 py-4">Presupuesto</th>
          <th className="px-6 py-4">Informe</th>
          <th className="px-6 py-4 text-right">Accion</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((item) => (
          <tr key={item.id} className="text-sm">
            <td className="px-6 py-4 font-black text-purple-700">#{item.id}</td>
            <td className="px-6 py-4 font-bold text-slate-900">{item.equipo}</td>
            <td className="px-6 py-4"><EstadoBadge estado={item.estado} /></td>
            <td className="px-6 py-4 font-bold text-emerald-700">
              {item.presupuesto ? `C$ ${formatPresupuesto(item.presupuesto)}` : 'Sin presupuesto'}
            </td>
            <td className="px-6 py-4 text-slate-600 italic">{item.diagnostico || 'Sin diagnostico registrado...'}</td>
            <td className="px-6 py-4 text-right">
              <button
                onClick={() => onOpenDiagnostico({ ...item, readOnly: readOnly && !correctionMode, correctionMode })}
                className={`p-2 rounded-lg transition-all ${readOnly && !correctionMode ? 'bg-slate-100 text-slate-700 hover:bg-slate-700 hover:text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-700 hover:text-white'}`}
                title={readOnly && !correctionMode ? 'Ver detalle' : correctionMode ? 'Corregir diagnostico' : 'Completar diagnostico'}
              >
                {readOnly && !correctionMode ? <Eye size={18} /> : <FileText size={18} />}
              </button>
            </td>
          </tr>
        ))}
        {!loading && items.length === 0 && (
          <tr>
            <td colSpan="6" className="px-6 py-12 text-center text-slate-500 italic">
              {readOnly ? 'No tienes diagnosticos completados.' : 'No tienes diagnosticos en revision.'}
            </td>
          </tr>
        )}
        {loading && (
          <tr>
            <td colSpan="6" className="px-6 py-12 text-center font-bold text-purple-700">Cargando diagnosticos...</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default DiagnosticosTable;
