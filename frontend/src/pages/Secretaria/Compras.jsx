import React, { useEffect, useMemo, useState } from 'react';
import Table from '../../components/Table';
import { HelpCircle, Loader2, Plus, Search, X } from 'lucide-react';
import { createCompra, getCompras } from '../../services/secretaria/comprasService';
import { getProveedores } from '../../services/secretaria/proveedoresService';
import { getRepuestos } from '../../services/secretaria/repuestosService';

const normalizeText = (value = '') => String(value).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
const money = (value) => `C$ ${Number(value || 0).toFixed(2)}`;

const tourSteps = [
  { target: 'create', title: '1. Registrar compra', text: 'Nueva Compra abre el formulario para registrar entradas de repuestos.' },
  { target: 'form', title: '2. Datos principales', text: 'Seleccione proveedor y repuesto base. Si proveedor o costo cambian, la entrada se registra en otra variante.' },
  { target: 'numbers', title: '3. Cantidad y costo', text: 'La cantidad se registra como entrada de inventario; no decide si el repuesto es igual o diferente.' },
  { target: 'search', title: '4. Buscar compras', text: 'Filtra por proveedor, repuesto o documento para revisar entradas previas.' },
  { target: 'table', title: '5. Revisar historial', text: 'La tabla muestra fecha, cantidad, costo unitario y total para detectar errores de captura.' },
];

const tourHighlightClass = (isActive) =>
  isActive
    ? 'relative z-[60] rounded-xl bg-white ring-4 ring-indigo-400 ring-offset-4 ring-offset-white shadow-2xl transition-all'
    : '';

const GuidedTour = ({ stepIndex, onBack, onClose, onNext }) => {
  const step = tourSteps[stepIndex];
  const isLast = stepIndex === tourSteps.length - 1;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-gray-900/55" />
      <div className="fixed bottom-6 right-6 z-[70] w-[min(92vw,390px)] rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Paso {stepIndex + 1} de {tourSteps.length}</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{step.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700" title="Cerrar tutorial">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm leading-6 text-gray-600">{step.text}</p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((stepIndex + 1) / tourSteps.length) * 100}%` }} />
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} disabled={stepIndex === 0} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
            Atras
          </button>
          <button type="button" onClick={onNext} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            {isLast ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  );
};

const CompraForm = ({ onSubmit, onCancel, proveedores = [], repuestos = [], activeTourTarget = '' }) => {
  const [formData, setFormData] = useState({
    proveedor_id: '',
    repuesto_id: '',
    documento: '',
    fecha_obtencion: new Date().toISOString().slice(0, 10),
    cantidad: '1',
    costo_unitario: '',
    metodo_pago: '',
  });
  const [formError, setFormError] = useState('');

  const selectedRepuesto = repuestos.find((repuesto) => String(repuesto.id_repuesto) === String(formData.repuesto_id));
  const subtotal = Number(formData.cantidad || 0) * Number(formData.costo_unitario || 0);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormError('');

    if (name === 'repuesto_id') {
      const repuestoSel = repuestos.find((repuesto) => String(repuesto.id_repuesto) === String(value));
      setFormData((prev) => ({
        ...prev,
        repuesto_id: value,
        costo_unitario: repuestoSel?.costo_individual ? String(repuestoSel.costo_individual) : prev.costo_unitario,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const cantidad = Number(formData.cantidad);
    const costo = Number(formData.costo_unitario);

    if (!formData.proveedor_id || !formData.repuesto_id) {
      setFormError('Seleccione proveedor y repuesto antes de guardar.');
      return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setFormError('La cantidad debe ser un entero mayor que cero.');
      return;
    }

    if (!costo || costo <= 0) {
      setFormError('El costo unitario debe ser mayor que cero.');
      return;
    }

    if (!formData.metodo_pago) {
      setFormError('Seleccione un metodo de pago antes de guardar la compra.');
      return;
    }

    onSubmit({
      ...formData,
      documento: normalizeText(formData.documento),
      cantidad,
      costo_unitario: costo,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div data-tour-target="form" className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${tourHighlightClass(activeTourTarget === 'form')}`}>
        <Select label="Proveedor" name="proveedor_id" value={formData.proveedor_id} onChange={handleChange} required>
          <option value="">Seleccione un proveedor</option>
          {proveedores.map((proveedor) => <option key={proveedor.id_proveedor} value={String(proveedor.id_proveedor)}>{proveedor.nombre}</option>)}
        </Select>

        <Select label="Repuesto" name="repuesto_id" value={formData.repuesto_id} onChange={handleChange} required>
          <option value="">Seleccione un repuesto</option>
          {repuestos.map((repuesto) => (
            <option key={repuesto.id_repuesto} value={String(repuesto.id_repuesto)}>
              {repuesto.nombre} - {repuesto.categoria?.nombre_tipo} - {repuesto.proveedor?.nombre || 'Sin proveedor'} - {money(repuesto.costo_individual)}
            </option>
          ))}
        </Select>

        <Field label="Numero de factura o recibo" name="documento" value={formData.documento} onChange={handleChange} placeholder="Factura o recibo" maxLength={80} />
        <Field label="Fecha de obtencion" name="fecha_obtencion" type="date" value={formData.fecha_obtencion} onChange={handleChange} />
      </div>

      <div data-tour-target="numbers" className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${tourHighlightClass(activeTourTarget === 'numbers')}`}>
        <Field label="Cantidad" name="cantidad" type="number" min="1" step="1" value={formData.cantidad} onChange={handleChange} required />
        <Field label="Costo unitario" name="costo_unitario" type="number" min="0.01" step="0.01" value={formData.costo_unitario} onChange={handleChange} required />
        <Select label="Metodo de pago" name="metodo_pago" value={formData.metodo_pago} onChange={handleChange} required>
          <option value="">Seleccione metodo</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Tarjeta">Tarjeta</option>
        </Select>
      </div>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
        <span className="font-bold">Total estimado:</span> {money(subtotal)}
        {selectedRepuesto?.costo_individual && (
          <span className="ml-2 text-xs">
            Variante actual: {selectedRepuesto.proveedor?.nombre || 'Sin proveedor'} | {money(selectedRepuesto.costo_individual)}
          </span>
        )}
      </div>

      {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{formError}</div>}

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Guardar Compra</button>
      </div>
    </form>
  );
};

const Field = ({ label, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
  </div>
);

const Select = ({ label, children, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all">
      {children}
    </select>
  </div>
);

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resC, resP, resR] = await Promise.all([getCompras(), getProveedores(), getRepuestos()]);
      setCompras(resC.data.data || []);
      setProveedores(resP.data.data || []);
      setRepuestos(resR.data.data || []);
    } catch (err) {
      setError('Error al sincronizar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const activeTourTarget = showHelp ? tourSteps[tourStep].target : '';

  useEffect(() => {
    if (!showHelp || !activeTourTarget) return;
    const scrollTimer = window.setTimeout(() => {
      document
        .querySelector(`[data-tour-target="${activeTourTarget}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [activeTourTarget, showHelp]);

  const startTour = () => {
    setShowForm(true);
    setTourStep(0);
    setShowHelp(true);
  };

  const closeTour = () => {
    setShowHelp(false);
    setTourStep(0);
    setShowForm(false);
  };

  const handleTourNext = () => {
    if (tourStep === tourSteps.length - 1) {
      closeTour();
      return;
    }
    if (tourSteps[tourStep + 1]?.target === 'search') setShowForm(false);
    setTourStep((step) => step + 1);
  };

  const columnas = [
    { header: 'ID', accessor: 'id_compra' },
    { header: 'Proveedor', accessor: 'proveedor', render: (row) => row.proveedor?.nombre },
    { header: 'Repuesto', accessor: 'repuesto', render: (row) => (
      <div className="flex flex-col">
        <span>{row.repuesto?.nombre}</span>
        <span className="text-[10px] text-gray-400">{row.repuesto?.proveedor?.nombre || row.proveedor?.nombre || 'Sin proveedor'}</span>
      </div>
    ) },
    { header: 'Documento', accessor: 'documento', render: (row) => row.documento || '-' },
    { header: 'Fecha', accessor: 'fecha_obtencion', render: (row) => row.fecha_obtencion ? new Date(row.fecha_obtencion).toLocaleDateString() : '-' },
    { header: 'Cantidad', accessor: 'cantidad' },
    { header: 'Costo', accessor: 'costo_unitario', render: (row) => money(row.costo_unitario) },
    { header: 'Total', render: (row) => money(Number(row.cantidad || 0) * Number(row.costo_unitario || 0)) },
    { header: 'Pago', accessor: 'metodo_pago', render: (row) => row.metodo_pago || '-' },
  ];

  const filteredCompras = compras.filter((compra) => {
    const term = searchTerm.toLowerCase();
    return [compra.proveedor?.nombre, compra.repuesto?.nombre, compra.documento, compra.metodo_pago].some((value) =>
      String(value || '').toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await createCompra(data);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo procesar la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showHelp && (
        <GuidedTour
          stepIndex={tourStep}
          onBack={() => setTourStep((step) => Math.max(step - 1, 0))}
          onClose={closeTour}
          onNext={handleTourNext}
        />
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Modulo de Compras</h2>
          <p className="text-gray-500 text-sm">Registro de adquisicion de repuestos para inventario del CTE.</p>
        </div>
        <div data-tour-target="create" className={`flex flex-wrap gap-3 ${tourHighlightClass(activeTourTarget === 'create')}`}>
          <button type="button" onClick={startTour} className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2 text-gray-700 shadow-sm hover:bg-gray-50">
            <HelpCircle className="w-4 h-4" /> Ayuda
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center justify-center gap-2 px-5 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> {showForm ? 'Cerrar Formulario' : 'Nueva Compra'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}

      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Registrar Entrada de Mercancia</h3>
          <CompraForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} proveedores={proveedores} repuestos={repuestos} activeTourTarget={activeTourTarget} />
        </div>
      )}

      <div data-tour-target="search" className={`flex flex-col sm:flex-row gap-4 mb-6 ${tourHighlightClass(activeTourTarget === 'search')}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por proveedor, repuesto, documento o pago..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div data-tour-target="table" className={`bg-white rounded-xl shadow-sm border border-gray-100 ${tourHighlightClass(activeTourTarget === 'table')}`}>
        {loading && !compras.length ? (
          <div className="p-12 text-center text-gray-400">Actualizando registros...</div>
        ) : (
          <Table columns={columnas} data={filteredCompras} />
        )}
      </div>
    </div>
  );
};

export default Compras;
