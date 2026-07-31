import React, { useMemo, useState } from 'react';
import { PackagePlus, X } from 'lucide-react';
import { EstadoBadge } from './TecnicoBadges';

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const electronicAliases = {
  celular: ['celular', 'telefono', 'movil', 'smartphone'],
  telefono: ['celular', 'telefono', 'movil', 'smartphone'],
  movil: ['celular', 'telefono', 'movil', 'smartphone'],
  laptop: ['laptop', 'notebook', 'portatil'],
  notebook: ['laptop', 'notebook', 'portatil'],
  pc: ['pc', 'computadora', 'desktop', 'escritorio'],
  computadora: ['pc', 'computadora', 'desktop', 'escritorio'],
  tablet: ['tablet'],
  monitor: ['monitor'],
  consola: ['consola', 'playstation', 'xbox', 'nintendo'],
  impresora: ['impresora', 'printer'],
  proyector: ['proyector'],
};

const getCompatibleRepuestos = (repuestos, equipoTipo) => {
  const tipo = normalizeText(equipoTipo);
  if (!tipo) return repuestos;

  const aliases = electronicAliases[tipo] || [tipo];
  return repuestos.filter((item) => {
    const electronico = normalizeText(item.categoria?.electronico);
    if (!electronico) return true;
    return aliases.some((alias) => electronico.includes(alias));
  });
};

const cleanCurrencyInput = (value = '') => String(value).replace(/[^\d.]/g, '');

const formatCurrencyInput = (value = '') => {
  const cleanValue = cleanCurrencyInput(value);
  if (!cleanValue) return '';

  const [integerPart, ...decimalParts] = cleanValue.split('.');
  const formattedInteger = integerPart.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';
  const decimalPart = decimalParts.join('').slice(0, 2);

  if (cleanValue.includes('.')) {
    return `${formattedInteger}.${decimalPart}`;
  }

  return formattedInteger;
};

const parseCurrencyInput = (value = '') => cleanCurrencyInput(value).replace(/(\..*)\./g, '$1');

const formatCurrencyDisplay = (value = '') => {
  const numeric = Number(String(value).replace(/[^\d.-]/g, ''));
  if (Number.isNaN(numeric)) return String(value || '');
  const [integerPart, decimalPart] = numeric.toFixed(2).split('.');
  return `${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${decimalPart}`;
};

export const SolicitarRepuestoModal = ({ orden, repuestos, onClose, onSubmit }) => {
  const [repuesto, setRepuesto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const repuestosCompatibles = useMemo(
    () => getCompatibleRepuestos(repuestos, orden.equipoTipo),
    [orden.equipoTipo, repuestos],
  );
  const repuestoOptions = useMemo(
    () => repuestosCompatibles.map((item) => ({
      ...item,
      autocompleteLabel: `${item.nombre || 'Sin nombre'} - ${item.proveedor?.nombre || 'Sin proveedor'} - C$ ${Number(item.costo_individual || 0).toFixed(2)}`,
    })),
    [repuestosCompatibles],
  );

  const repuestoSeleccionado = useMemo(
    () => repuestoOptions.find((item) => {
      const texto = normalizeText(repuesto);
      return normalizeText(item.autocompleteLabel) === texto || normalizeText(item.nombre) === texto;
    }),
    [repuesto, repuestoOptions],
  );
  const piezaSolicitada = repuestoSeleccionado?.nombre || repuesto.trim();
  const piezaNoRegistrada = Boolean(piezaSolicitada) && !repuestoSeleccionado;

  const enviarSolicitud = async ({ solicitarSinRegistro = false } = {}) => {
    setError('');
    setLoading(true);
    try {
      if (!piezaSolicitada) {
        setError('Indique que pieza necesita solicitar.');
        setLoading(false);
        return;
      }

      if (!repuestoSeleccionado && !solicitarSinRegistro) {
        setError('esta pieza no existe');
        setLoading(false);
        return;
      }

      await onSubmit(orden.id, {
        repuesto_id: repuestoSeleccionado ? Number(repuestoSeleccionado.id_repuesto) : undefined,
        repuesto: piezaSolicitada,
        cantidad,
        solicitar_sin_registro: solicitarSinRegistro,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'No se pudo solicitar la pieza.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await enviarSolicitud();
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
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Pieza solicitada</label>
            <input
              required
              list={`repuestos-compatibles-${orden.id}`}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
              value={repuesto}
              onChange={(event) => setRepuesto(event.target.value)}
              placeholder="Escriba y seleccione una pieza compatible"
              autoComplete="off"
            />
            <datalist id={`repuestos-compatibles-${orden.id}`}>
              {repuestoOptions.map((item) => (
                <option key={item.id_repuesto} value={item.autocompleteLabel} />
              ))}
            </datalist>
            {repuestoOptions.length === 0 && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                No hay repuestos compatibles disponibles para {orden.equipoTipo || 'este equipo'}.
              </p>
            )}
          </div>
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
          {piezaNoRegistrada && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-bold text-amber-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>esta pieza no existe</span>
                <button
                  type="button"
                  onClick={() => enviarSolicitud({ solicitarSinRegistro: true })}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-[11px] font-black uppercase text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  <PackagePlus size={14} />
                  Solicitar pieza
                </button>
              </div>
            </div>
          )}
          {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{error}</div>}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-slate-600">Cancelar</button>
            <button type="submit" disabled={loading || piezaNoRegistrada} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase disabled:opacity-60">
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
  const [presupuesto, setPresupuesto] = useState(formatCurrencyInput(orden.presupuesto || ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePresupuestoChange = (event) => {
    setPresupuesto(formatCurrencyInput(event.target.value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const presupuestoValue = parseCurrencyInput(presupuesto);
      await onSubmit(orden.id, {
        diagnostico,
        solucion,
        presupuesto: presupuestoValue === '' ? undefined : presupuestoValue,
      });
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
              type="text"
              inputMode="decimal"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 read-only:bg-slate-50"
              value={presupuesto}
              onChange={handlePresupuestoChange}
              placeholder="0.00"
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
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
              {esIrreparable ? 'Justificacion de irreparabilidad' : 'Observacion final'}
            </label>
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
              La orden quedara pendiente de revision del Jefe Tecnico antes de cerrar el flujo.
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
