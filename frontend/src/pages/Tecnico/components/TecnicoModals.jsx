import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EstadoBadge } from './TecnicoBadges';

export const SolicitarRepuestoModal = ({ orden, repuestos, onClose, onSubmit }) => {
  const [repuesto, setRepuesto] = useState('');
  const [repuestoId, setRepuestoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const repuestoSeleccionado = repuestos.find((item) => String(item.id_repuesto) === String(repuestoId));
      await onSubmit(orden.id, {
        repuesto_id: repuestoId ? Number(repuestoId) : undefined,
        repuesto: repuestoSeleccionado?.nombre || repuesto,
        cantidad,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'No se pudo solicitar la pieza.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-slate-900">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Solicitar Pieza</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs mb-4">
            <span className="font-black text-indigo-700">ORDEN #{orden.id}</span>
            <p className="font-bold text-slate-800">{orden.equipo}</p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Pieza existente</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
              value={repuestoId}
              onChange={(event) => {
                setRepuestoId(event.target.value);
                if (event.target.value) setRepuesto('');
              }}
            >
              <option value="">No esta en inventario / escribir manualmente</option>
              {repuestos.map((item) => (
                <option key={item.id_repuesto} value={item.id_repuesto}>
                  {item.nombre || 'Sin nombre'} - {item.proveedor?.nombre || 'Sin proveedor'} - C$ {Number(item.costo_individual || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          {!repuestoId && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Pieza solicitada</label>
              <input
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                value={repuesto}
                onChange={(event) => setRepuesto(event.target.value)}
                placeholder="Escriba la pieza si aun no existe"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              value={cantidad}
              onChange={(event) => setCantidad(event.target.value)}
            />
          </div>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            Si la pieza aun no existe en inventario, quedara pedida por nombre. Cuando se compre y se registre, se puede regularizar con el repuesto ya creado.
          </p>
          {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{error}</div>}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-slate-600">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase">
              {loading ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DiagnosticoModal = ({ orden, readOnly = false, onClose, onSubmit }) => {
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico || '');
  const [solucion, setSolucion] = useState(orden.solucion || '');
  const [presupuesto, setPresupuesto] = useState(orden.presupuesto || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(orden.id, { diagnostico, solucion, presupuesto });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo guardar el diagnostico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-slate-900">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              {readOnly ? 'Detalle Diagnostico' : 'Completar Diagnostico'}
            </h3>
            <EstadoBadge estado={orden.estado} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InfoBlock label="Equipo">#{orden.id} - {orden.equipo}</InfoBlock>
          <InfoBlock label="Falla reportada">{orden.falla}</InfoBlock>
          <FormTextarea label="Hallazgos" readOnly={readOnly} required rows="3" value={diagnostico} onChange={setDiagnostico} />
          <FormTextarea label="Accion / Solucion" readOnly={readOnly} required={!readOnly} rows="2" value={solucion} onChange={setSolucion} />
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Presupuesto estimado</label>
            <input
              readOnly={readOnly}
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 read-only:bg-slate-50"
              value={presupuesto}
              onChange={(event) => setPresupuesto(event.target.value)}
            />
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div>}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-slate-600">Cerrar</button>
            {!readOnly && (
              <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold uppercase">
                {loading ? 'Guardando...' : 'Marcar Completado'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export const CierreOrdenModal = ({ orden, estado, onClose, onSubmit }) => {
  const esIrreparable = estado === 'IRREPARABLE';
  const [form, setForm] = useState({
    resultado_final: esIrreparable ? 'IRREPARABLE' : 'REPARADO',
    enciende_salida: !esIrreparable,
    usa_corriente_ac_salida: !esIrreparable,
    observacion_final: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(orden.id, { estado, ...form });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo cerrar la orden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-slate-900">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              {esIrreparable ? 'Marcar Irreparable' : 'Finalizar Orden'}
            </h3>
            <p className="text-xs font-semibold text-slate-500">Orden #{orden.id} - {orden.equipo}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Este cierre no cambia los datos de recepcion. Guarda el estado real del equipo al salir del taller.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckField name="enciende_salida" checked={form.enciende_salida} onChange={handleChange} label="Enciende al finalizar" />
            <CheckField name="usa_corriente_ac_salida" checked={form.usa_corriente_ac_salida} onChange={handleChange} label="Probado con corriente AC" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Observacion final</label>
            <textarea
              required
              rows="4"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              name="observacion_final"
              value={form.observacion_final}
              onChange={handleChange}
              placeholder={esIrreparable ? 'Explique por que no se puede reparar y que se reviso.' : 'Explique pruebas realizadas y condicion de entrega.'}
            />
          </div>
          {esIrreparable && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              En facturacion se podra cobrar solo revision/mano de obra. No se sumaran repuestos a esta orden.
            </div>
          )}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div>}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-slate-600">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase">
              {loading ? 'Guardando...' : esIrreparable ? 'Guardar Irreparable' : 'Guardar Finalizacion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InfoBlock = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{label}</label>
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">{children}</div>
  </div>
);

const FormTextarea = ({ label, value, onChange, ...props }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{label}</label>
    <textarea
      {...props}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 read-only:bg-slate-50"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

const CheckField = ({ name, checked, onChange, label }) => (
  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} />
    {label}
  </label>
);
