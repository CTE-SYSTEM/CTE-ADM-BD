import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { Edit, HelpCircle, Plus, Search, Trash2, X } from 'lucide-react';
import { createProveedor, deleteProveedor, getProveedores, updateProveedor } from '../../services/secretaria/proveedoresService';

const normalizeText = (value = '') => String(value).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
const isValidEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const tourSteps = [
  { target: 'create', title: '1. Crear proveedor', text: 'Nuevo Proveedor abre el formulario para registrar tiendas o suplidores.' },
  { target: 'identity', title: '2. Identificacion', text: 'Nombre es obligatorio. Telefono y correo ayudan a evitar compras mal asociadas.' },
  { target: 'details', title: '3. Direccion y notas', text: 'Agrega direccion, web y notas utiles sobre calidad, horarios o condiciones.' },
  { target: 'search', title: '4. Buscar', text: 'Filtra antes de crear para evitar proveedores duplicados.' },
  { target: 'table', title: '5. Revisar proveedores', text: 'La tabla permite comprobar contacto, web, direccion y notas.' },
  { target: 'actions', title: '6. Editar o desactivar', text: 'Edita datos mal escritos o desactiva proveedores que ya no se usan.' },
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

const ProveedorForm = ({ onSubmit, onCancel, initialData = null, activeTourTarget = '' }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    telefono: initialData?.telefono || '',
    direccion: initialData?.direccion || '',
    correo: initialData?.correo || '',
    web: initialData?.web || '',
    notas: initialData?.notas || '',
  });
  const [formError, setFormError] = useState('');

  const handleChange = (event) => {
    setFormError('');
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      nombre: normalizeText(formData.nombre),
      telefono: normalizeText(formData.telefono),
      direccion: normalizeText(formData.direccion),
      correo: normalizeText(formData.correo),
      web: normalizeText(formData.web),
      notas: normalizeText(formData.notas),
    };

    if (!payload.nombre) {
      setFormError('El nombre del proveedor es obligatorio.');
      return;
    }

    if (!isValidEmail(payload.correo)) {
      setFormError('El correo no tiene un formato valido.');
      return;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div data-tour-target="identity" className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${tourHighlightClass(activeTourTarget === 'identity')}`}>
        <Field label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} required maxLength={80} />
        <Field label="Telefono" name="telefono" value={formData.telefono} onChange={handleChange} maxLength={30} />
        <Field label="Correo" name="correo" type="email" value={formData.correo} onChange={handleChange} maxLength={120} />
        <Field label="Web" name="web" value={formData.web} onChange={handleChange} placeholder="proveedor.com" maxLength={160} />
      </div>

      <div data-tour-target="details" className={tourHighlightClass(activeTourTarget === 'details')}>
        <Field label="Direccion" name="direccion" value={formData.direccion} onChange={handleChange} maxLength={180} />
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea name="notas" value={formData.notas} onChange={handleChange} rows={3} maxLength={300} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{formError}</div>}

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">{initialData ? 'Actualizar' : 'Guardar'}</button>
      </div>
    </form>
  );
};

const Field = ({ label, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
  </div>
);

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const loadProveedores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProveedores();
      setProveedores(response.data.data || []);
    } catch {
      setError('No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProveedores(); }, []);

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
    setEditingProveedor(null);
    setShowForm(true);
    setTourStep(0);
    setShowHelp(true);
  };

  const closeTour = () => {
    setShowHelp(false);
    setTourStep(0);
    setShowForm(false);
    setEditingProveedor(null);
  };

  const handleTourNext = () => {
    if (tourStep === tourSteps.length - 1) {
      closeTour();
      return;
    }
    if (tourSteps[tourStep + 1]?.target === 'search') {
      setShowForm(false);
      setEditingProveedor(null);
    }
    setTourStep((step) => step + 1);
  };

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      if (editingProveedor) await updateProveedor(editingProveedor.id_proveedor, data);
      else await createProveedor(data);
      setShowForm(false);
      setEditingProveedor(null);
      await loadProveedores();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al guardar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que quieres desactivar este proveedor?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteProveedor(id);
      await loadProveedores();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al desactivar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  const columnas = [
    { header: 'ID', accessor: 'id_proveedor' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Telefono', accessor: 'telefono', render: (row) => row.telefono || '-' },
    { header: 'Correo', accessor: 'correo', render: (row) => row.correo || '-' },
    {
      header: 'Web',
      accessor: 'web',
      render: (row) => row.web ? (
        <a href={row.web} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block max-w-[150px]">
          {row.web}
        </a>
      ) : '-',
    },
    {
      header: 'Direccion',
      accessor: 'direccion',
      render: (row) => <p className="min-w-[200px] whitespace-normal break-words">{row.direccion || '-'}</p>,
    },
    {
      header: 'Notas',
      accessor: 'notas',
      render: (row) => <p className="italic text-gray-500 min-w-[150px] whitespace-normal">{row.notas || '-'}</p>,
    },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <div data-tour-target="actions" className={`flex gap-2 whitespace-nowrap ${tourHighlightClass(activeTourTarget === 'actions')}`}>
          <button onClick={() => { setEditingProveedor(row); setShowForm(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(row.id_proveedor)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Desactivar"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const filteredProveedores = proveedores.filter((proveedor) => {
    const term = searchTerm.toLowerCase();
    return [proveedor.nombre, proveedor.telefono, proveedor.correo, proveedor.web, proveedor.direccion, proveedor.notas].some((value) =>
      String(value || '').toLowerCase().includes(term)
    );
  });

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
          <h2 className="text-2xl font-bold mb-1">Gestion de Proveedores</h2>
          <p className="text-gray-500">Campos reales: nombre, telefono, direccion, correo, web y notas.</p>
        </div>
        <div data-tour-target="create" className={`flex flex-wrap gap-3 ${tourHighlightClass(activeTourTarget === 'create')}`}>
          <button type="button" onClick={startTour} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50">
            <HelpCircle className="w-4 h-4" /> Ayuda
          </button>
          <button onClick={() => { setEditingProveedor(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Nuevo Proveedor
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
          <ProveedorForm onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingProveedor(null); }} initialData={editingProveedor} activeTourTarget={activeTourTarget} />
        </div>
      )}

      <div data-tour-target="search" className={`flex flex-col sm:flex-row gap-4 mb-6 ${tourHighlightClass(activeTourTarget === 'search')}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar proveedores..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div data-tour-target="table" className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${tourHighlightClass(activeTourTarget === 'table')}`}>
        {loading ? <div className="p-8 text-center text-gray-500">Cargando...</div> : <Table columns={columnas} data={filteredProveedores} />}
      </div>
    </div>
  );
};

export default Proveedores;
