// frontend/src/pages/Secretaria/Equipos.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Table from '../../components/Table';
import { Plus, Search, Edit, Phone, User, HelpCircle, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { getClientes } from '../../services/secretaria/clientesService';
import { createEquipo, getEquipos, updateEquipo } from '../../services/secretaria/equiposService';

const BASE_TIPOS_EQUIPO = ['Laptop', 'Celular', 'Impresora', 'Monitor', 'Tablet', 'Pc Escritorio', 'Consola'];

const toPascalCase = (value) => (
  value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
);

const getTiposSugeridos = (equipos) => {
  const tipos = [...BASE_TIPOS_EQUIPO, ...equipos.map((equipo) => equipo.tipo).filter(Boolean)]
    .map(toPascalCase);

  return [...new Set(tipos)].sort((a, b) => a.localeCompare(b));
};

const tourSteps = [
  { target: 'create', title: '1. Registrar equipo', text: 'Nuevo Equipo abre el formulario. Si vienes desde Clientes, el cliente ya queda seleccionado para evitar capturar el equipo a otra persona.' },
  { target: 'client', title: '2. Confirmar cliente', text: 'Primero confirma el cliente correcto. La verificacion muestra telefono e ID para reducir errores antes de guardar.' },
  { target: 'details', title: '3. Datos seguros', text: 'Tipo, marca y modelo son obligatorios. El tipo se normaliza y las sugerencias ayudan a mantener nombres consistentes.' },
  { target: 'actions', title: '4. Guardar o seguir', text: 'Guardar Equipo registra el aparato y vuelve a la lista. Guardar y Seguir registra el aparato y abre Diagnostico con cliente y equipo seleccionados.' },
  { target: 'search', title: '5. Buscar por cliente', text: 'El buscador filtra por nombre del cliente para encontrar rapidamente sus equipos.' },
  { target: 'table', title: '6. Revisar y editar', text: 'La tabla permite revisar y editar equipos. No se elimina desde secretaria para evitar perdida accidental de registros.' },
];

const tourHighlightClass = (isActive) =>
  isActive
    ? 'relative z-[60] rounded-xl bg-white ring-4 ring-indigo-400 ring-offset-4 ring-offset-white shadow-2xl transition-all'
    : '';

const sanitizeEquipmentText = (value = '') => String(value).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();

const sortClientesByName = (clientes = []) =>
  [...clientes].sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' }));

const EquipoForm = ({ onSubmit, onCancel, initialData = null, clientes = [], preSelectedClient = null, tiposSugeridos = [], activeTourTarget = '' }) => {
  const [formData, setFormData] = useState({
    cliente_id: initialData?.cliente_id || preSelectedClient?.id || '',
    tipo: initialData?.tipo || '',
    marca: initialData?.marca || '',
    modelo: initialData?.modelo || '',
    numero_serie: initialData?.numero_serie || '',
  });
  const [formError, setFormError] = useState('');

  const clienteInfo = clientes.find(c => String(c.id_cliente) === String(formData.cliente_id));
  const handleChange = (e) => {
    setFormError('');
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      tipo: toPascalCase(sanitizeEquipmentText(formData.tipo)),
      marca: sanitizeEquipmentText(formData.marca),
      modelo: sanitizeEquipmentText(formData.modelo),
      numero_serie: sanitizeEquipmentText(formData.numero_serie),
    };

    if (!payload.cliente_id || !payload.tipo || !payload.marca || !payload.modelo) {
      setFormError('Seleccione un cliente y complete tipo, marca y modelo antes de guardar.');
      return;
    }

    onSubmit(payload, e.nativeEvent.submitter?.value || 'save');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        {/* Selector de Cliente */}
        <div
          data-tour-target="client"
          className={`${clienteInfo ? "md:col-span-1" : "md:col-span-2"} ${tourHighlightClass(activeTourTarget === 'client')}`}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select 
            name="cliente_id" 
            value={formData.cliente_id} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* Verificación visual en Formulario */}
        {clienteInfo && (
          <div className="animate-in fade-in zoom-in duration-200">
            <label className="block text-sm font-medium text-indigo-600 mb-1 font-bold">Verificación de Usuario</label>
            <div className="flex items-center justify-between w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm h-[42px]">
              <div className="flex items-center gap-2 text-indigo-700">
                <Phone className="w-4 h-4" />
                <span className="text-sm font-semibold">{clienteInfo.telefono || 'Sin número'}</span>
              </div>
              <span className="text-[10px] font-mono bg-indigo-200 px-2 py-0.5 rounded text-indigo-800">
                ID: {clienteInfo.id_cliente}
              </span>
            </div>
          </div>
        )}

        <div
          data-tour-target="details"
          className={`md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 ${tourHighlightClass(activeTourTarget === 'details')}`}
        >
          <TipoField value={formData.tipo} onChange={handleChange} tiposSugeridos={tiposSugeridos} />
          <Field label="Marca" name="marca" value={formData.marca} onChange={handleChange} placeholder="Ej: HP" maxLength={40} required />
          <Field label="Modelo" name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej: Victus 15" maxLength={60} required />
          <Field label="Número de Serie" name="numero_serie" value={formData.numero_serie} onChange={handleChange} placeholder="S/N" maxLength={80} />
        </div>
      </div>

      {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{formError}</div>}

      <div
        data-tour-target="actions"
        className={`flex flex-wrap justify-end gap-3 pt-4 border-t mt-2 ${tourHighlightClass(activeTourTarget === 'actions')}`}
      >
        <button type="button" onClick={onCancel} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">
          Cancelar
        </button>
        <button type="submit" value="save" className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md transition-all font-bold">
          {initialData ? 'Actualizar Equipo' : 'Guardar Equipo'}
        </button>
        {!initialData && (
          <button type="submit" value="next" className="flex items-center gap-2 px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md transition-all font-bold">
            Guardar y Seguir <ArrowRight className="w-4 h-4" />
          </button>
        )}
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

const TipoField = ({ value, onChange, tiposSugeridos }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
    <input
      name="tipo"
      value={value}
      onChange={onChange}
      list="tipos-equipo"
      placeholder="Ej: Laptop"
      required
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
    />
    <datalist id="tipos-equipo">
      {tiposSugeridos.map((tipo) => (
        <option key={tipo} value={tipo} />
      ))}
    </datalist>
    <div className="mt-2 flex flex-wrap gap-2">
      {tiposSugeridos.slice(0, 8).map((tipo) => (
        <button
          key={tipo}
          type="button"
          onClick={() => onChange({ target: { name: 'tipo', value: tipo } })}
          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 transition-colors"
        >
          {tipo}
        </button>
      ))}
    </div>
  </div>
);

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

const Equipos = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [showForm, setShowForm] = useState(!!location.state?.clienteId);
  const [editingEquipo, setEditingEquipo] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tiposSugeridos = getTiposSugeridos(equipos);

  const preSelectedClient = location.state?.clienteId ? {
    id: location.state.clienteId,
    nombre: location.state.nombreCliente
  } : null;

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.all([getClientes(), getEquipos()]);
      setClientes(sortClientesByName(cRes.data.data || []));
      setEquipos(eRes.data.data || []);
    } catch (err) { console.error("Error al cargar datos"); }
    finally { setLoading(false); }
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
    setEditingEquipo(null);
    setShowForm(true);
    setTourStep(0);
    setShowHelp(true);
  };

  const closeTour = () => {
    setShowHelp(false);
    setTourStep(0);
  };

  const handleTourNext = () => {
    if (tourStep === tourSteps.length - 1) {
      closeTour();
      return;
    }
    setTourStep((step) => step + 1);
  };

  const handleSubmit = async (data, action = 'save') => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (editingEquipo) response = await updateEquipo(editingEquipo.id_equipo, data);
      else response = await createEquipo(data);

      const equipoGuardado = response?.data?.data || response?.data?.equipo || response?.data;

      if (action === 'next' && !editingEquipo) {
        navigate('/secretaria/diagnostico', {
          state: {
            clienteId: data.cliente_id,
            equipoId: equipoGuardado?.id_equipo,
          },
        });
        return;
      }

      setShowForm(false);
      setEditingEquipo(null);
      window.history.replaceState({}, document.title);
      await loadData();
    } catch {
      setError('Error al guardar. Revise que el cliente exista y que tipo, marca y modelo esten completos.');
    }
    finally { setLoading(false); }
  };

  // COLUMNAS: Ahora el ID del cliente es visible junto al nombre
  const columnas = [
    { header: 'ID', accessor: 'id_equipo' },
    { 
      header: 'Cliente', 
      accessor: 'cliente', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{row.cliente?.nombre || 'N/A'}</span>
          <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase tracking-tighter">
            ID Cliente: {row.cliente?.id_cliente || 'N/A'}
          </span>
        </div>
      )
    },
    { header: 'Tipo', accessor: 'tipo' },
    { header: 'Marca', accessor: 'marca' },
    { header: 'Modelo', accessor: 'modelo' },
    { header: 'No. Serie', accessor: 'numero_serie' },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => { setEditingEquipo(row); setShowForm(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const filteredEquipos = equipos.filter(e => {
    const term = searchTerm.toLowerCase();
    return e.cliente?.nombre?.toLowerCase().includes(term);
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
          <h2 className="text-2xl font-bold text-gray-800 italic">Equipos</h2>
          <p className="text-sm text-gray-500">Listado general de dispositivos recibidos.</p>
        </div>

        <div data-tour-target="create" className={`flex flex-wrap gap-3 ${tourHighlightClass(activeTourTarget === 'create')}`}>
          <button
            type="button"
            onClick={startTour}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2 text-gray-700 shadow-sm hover:bg-gray-50"
            title="Iniciar tutorial guiado"
          >
            <HelpCircle className="w-4 h-4" /> Ayuda
          </button>
          <button
            onClick={() => { setEditingEquipo(null); setShowForm(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}

      {showForm && (
        <div className="mb-8 bg-white rounded-xl shadow-md p-6 border border-indigo-100 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
             <User className="w-5 h-5 text-indigo-600" />
             {editingEquipo ? 'Editar Equipo' : 'Registro de Nuevo Equipo'}
          </h3>
          <EquipoForm 
            onSubmit={handleSubmit} 
            onCancel={() => { setShowForm(false); setEditingEquipo(null); }} 
            initialData={editingEquipo} 
            clientes={clientes}
            preSelectedClient={preSelectedClient}
            tiposSugeridos={tiposSugeridos}
            activeTourTarget={activeTourTarget}
          />
        </div>
      )}

      <div
        data-tour-target="search"
        className={`flex flex-col sm:flex-row gap-4 mb-6 ${tourHighlightClass(activeTourTarget === 'search')}`}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre del cliente..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>
      </div>

      <div
        data-tour-target="table"
        className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${tourHighlightClass(activeTourTarget === 'table')}`}
      >
        {loading && !equipos.length ? (
          <div className="p-10 text-center text-gray-500 italic">Consultando servidor...</div>
        ) : (
          <Table columns={columnas} data={filteredEquipos} />
        )}
      </div>
    </div>
  );
};

export default Equipos;
