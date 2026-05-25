// frontend/src/pages/Secretaria/Diagnostico.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Loader2, Phone, User, Monitor, AlertCircle, 
  CheckCircle2, Search, Edit3, XCircle, LayoutList, HelpCircle, X, ShieldAlert, Filter
} from 'lucide-react';
import Autocomplete from '../../components/Autocomplete';
import { getClientes } from '../../services/secretaria/clientesService';
import { getEquipos } from '../../services/secretaria/equiposService';
import { 
  createDiagnostico, 
  getDiagnosticos, 
  updateDiagnostico 
} from '../../services/secretaria/diagnosticoService';

// --- COMPONENTES DE APOYO ---

export const PrioridadBadge = ({ prioridad }) => {
  const config = {
    Urgente: 'bg-red-100 text-red-800 border-red-200',
    Alta: 'bg-orange-100 text-orange-800 border-orange-200',
    Normal: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${config[prioridad] || 'bg-gray-100 text-gray-800'}`}>
      {prioridad}
    </span>
  );
};

export const EstadoBadge = ({ estado }) => {
  const config = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    REPARACION: 'bg-purple-100 text-purple-800',
    FINALIZADO: 'bg-emerald-100 text-emerald-800',
    INGRESADO: 'bg-blue-100 text-blue-800',
    ENTREGADO: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[estado] || 'bg-gray-100 text-gray-800'}`}>
      {estado || 'PENDIENTE'}
    </span>
  );
};

const tourSteps = [
  {
    target: 'header',
    title: '1. Diagnostico de ingreso',
    text: 'Esta pantalla registra la revision inicial del equipo que trae el cliente. Si vienes desde Equipos, cliente y equipo ya quedan seleccionados.',
  },
  {
    target: 'owner',
    title: '2. Cliente y contacto',
    text: 'Selecciona el cliente y confirma telefono e ID. Esto evita generar un diagnostico para la persona equivocada.',
  },
  {
    target: 'equipment',
    title: '3. Equipo correcto',
    text: 'El selector muestra solo los equipos del cliente elegido. Al seleccionar uno, el tipo se muestra automaticamente como verificacion.',
  },
  {
    target: 'priority',
    title: '4. Prioridad y accesorios',
    text: 'Marca la prioridad de atencion y los datos de recepcion: cargador, si enciende y si usa corriente AC.',
  },
  {
    target: 'failure',
    title: '5. Falla reportada',
    text: 'Este campo es obligatorio. Si intentas guardar sin escribir la falla, el sistema muestra una alerta y bloquea el guardado.',
  },
  {
    target: 'actions',
    title: '6. Guardar diagnostico',
    text: 'Generar Diagnostico de Ingreso crea el registro. En modo edicion, el boton guarda cambios y Cancelar descarta la edicion.',
  },
  {
    target: 'table',
    title: '7. Revisar registros',
    text: 'La tabla tiene scroll interno y encabezado fijo para trabajar mejor con muchas filas o pantallas pequenas.',
  },
  {
    target: 'table',
    title: '8. Editar diagnosticos',
    text: 'Usa el boton de lapiz en una fila para cargar ese diagnostico en el formulario superior. El boton cambia a Guardar Cambios y Cancelar descarta la edicion. Nota: Si ya tiene tecnico asignado, no podra editarse.',
  },
];

const tourHighlightClass = (isActive) =>
  isActive
    ? 'relative z-[60] rounded-xl bg-white ring-4 ring-indigo-400 ring-offset-4 ring-offset-white shadow-2xl transition-all'
    : '';

const sortClientesByName = (clientes = []) =>
  [...clientes].sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' }));

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

// --- COMPONENTE PRINCIPAL ---

const Diagnostico = () => {
  const location = useLocation();
  const formRef = useRef(null);

  // Estados de datos
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [diagnosticos, setDiagnosticos] = useState([]);
  
  // Estados de UI/Control
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el filtro de asignación de técnico: 'TODOS', 'SIN_ASIGNAR', 'ASIGNADOS'
  const [filterTecnico, setFilterTecnico] = useState('TODOS');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const initialFormState = {
    cliente_id: '',
    equipo_id: '',
    falla_reportada: '',
    prioridad: 'Normal',
    estado: 'INGRESADO',
    deja_cargador: false,
    enciende: false,
    usa_corriente_ac: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const preselectedClienteId = location.state?.clienteId ? String(location.state.clienteId) : '';
  const preselectedEquipoId = location.state?.equipoId ? String(location.state.equipoId) : '';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resC, resE, resD] = await Promise.all([
        getClientes(),
        getEquipos(),
        getDiagnosticos()
      ]);
      setClientes(sortClientesByName(resC.data.data || []));
      setEquipos(resE.data.data || []);
      setDiagnosticos(resD.data.data || []);
    } catch (err) {
      setError('Error al sincronizar datos con el servidor');
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

  useEffect(() => {
    if (!preselectedClienteId && !preselectedEquipoId) return;

    setFormData((prev) => ({
      ...prev,
      cliente_id: preselectedClienteId || prev.cliente_id,
      equipo_id: preselectedEquipoId || prev.equipo_id,
    }));
    window.history.replaceState({}, document.title);
  }, [preselectedClienteId, preselectedEquipoId]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Manejadores
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'cliente_id' ? { equipo_id: '' } : {}),
    }));
  };

  const handleEdit = (diag) => {
    if (diag.tecnico_id || diag.id_tecnico) {
      window.alert("No se puede editar este registro porque ya cuenta con un técnico asignado.");
      return;
    }

    setIsEditing(true);
    setCurrentId(diag.id_diagnostico);
    setFormData({
      cliente_id: String(diag.equipo?.cliente_id || ''),
      equipo_id: String(diag.equipo_id || ''),
      falla_reportada: diag.falla_reportada || '',
      prioridad: diag.prioridad || 'Normal',
      estado: diag.estado_del_diagnostico || diag.estado || 'INGRESADO',
      deja_cargador: Boolean(diag.deja_cargador),
      enciende: Boolean(diag.enciende),
      usa_corriente_ac: Boolean(diag.usa_corriente_ac),
    });

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.falla_reportada.trim()) {
      const msg = 'Debe escribir la falla reportada antes de guardar el diagnostico.';
      setError(msg);
      window.alert(msg);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isEditing) {
        await updateDiagnostico(currentId, formData);
        setMessage('Diagnóstico actualizado correctamente');
      } else {
        await createDiagnostico(formData);
        setMessage('Diagnóstico de ingreso generado con éxito');
      }
      
      cancelEdit();
      loadData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Ocurrió un error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de tabla por texto Y por estado del técnico asignado
  const filteredDiagnosticos = diagnosticos
    .filter(d => {
      // 1. Filtrado por texto (Buscador)
      const matchesSearch = 
        d.equipo?.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.equipo?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.equipo?.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(d.id_diagnostico).includes(searchTerm);

      // 2. Filtrado por asignación de Técnico
      const tieneTecnico = Boolean(d.tecnico_id || d.id_tecnico);
      let matchesTecnicoFilter = true;
      
      if (filterTecnico === 'SIN_ASIGNAR') {
        matchesTecnicoFilter = !tieneTecnico;
      } else if (filterTecnico === 'ASIGNADOS') {
        matchesTecnicoFilter = tieneTecnico;
      }

      return matchesSearch && matchesTecnicoFilter;
    })
    .sort((a, b) => Number(b.id_diagnostico || 0) - Number(a.id_diagnostico || 0));

  const clienteSeleccionado = clientes.find(c => String(c.id_cliente) === String(formData.cliente_id));
  const equiposDelCliente = formData.cliente_id
    ? equipos.filter((e) => Number(e.cliente_id) === Number(formData.cliente_id))
    : [];
  const equipoSeleccionado = equipos.find((e) => String(e.id_equipo) === String(formData.equipo_id));

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      {showHelp && (
        <GuidedTour
          stepIndex={tourStep}
          onBack={() => setTourStep((step) => Math.max(step - 1, 0))}
          onClose={closeTour}
          onNext={handleTourNext}
        />
      )}

      {/* CABECERA */}
      <div
        data-tour-target="header"
        className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${tourHighlightClass(activeTourTarget === 'header')}`}
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Diagnóstico de Ingreso</h2>
          <p className="text-gray-500 font-medium">Gestión de recepción y revisión técnica inicial.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={startTour}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50"
            title="Iniciar tutorial guiado"
          >
            <HelpCircle className="w-4 h-4" /> Ayuda
          </button>
          <LayoutList className="w-8 h-8 text-indigo-200" />
        </div>
      </div>

      {/* ALERTAS */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 font-medium border border-red-200">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}
      
      {message && (
        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" /> {message}
        </div>
      )}

      {/* SECCIÓN FORMULARIO */}
      <section ref={formRef} className="bg-white rounded-xl shadow-md border border-indigo-50 p-6 scroll-mt-6">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
            {isEditing ? <><Edit3 className="w-5 h-5"/> Editando Registro #{currentId}</> : '📝 Datos del Ingreso'}
           </h3>
           {isEditing && (
             <button onClick={cancelEdit} className="text-red-500 flex items-center gap-1 text-sm font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">
               <XCircle className="w-4 h-4"/> Cancelar
             </button>
           )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            data-tour-target="owner"
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${tourHighlightClass(activeTourTarget === 'owner')}`}
          >
            <Autocomplete
              label="Cliente (Dueño)"
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleChange}
              options={clientes}
              getOptionValue={(cliente) => cliente.id_cliente}
              getOptionLabel={(cliente) => cliente.nombre || `Cliente #${cliente.id_cliente}`}
              getOptionDescription={(cliente) => `ID: ${cliente.id_cliente}${cliente.telefono ? ` | ${cliente.telefono}` : ''}`}
              placeholder="Buscar cliente por nombre, ID o telefono..."
              emptyMessage="No hay clientes con ese criterio"
              required
            />

            {clienteSeleccionado ? (
              <div className="animate-in fade-in zoom-in duration-200">
                <label className="block text-sm font-bold text-indigo-600 mb-1">Contacto del Dueño</label>
                <div className="flex items-center justify-between w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm h-[42px]">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold">
                    <Phone className="w-4 h-4" />
                    <span>{clienteSeleccionado.telefono || 'Sin teléfono'}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-200 px-2 py-0.5 rounded text-indigo-900">ID: {clienteSeleccionado.id_cliente}</span>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center text-gray-400 text-xs italic pt-6">
                <User className="w-4 h-4 mr-1" /> Seleccione un cliente para validar datos
              </div>
            )}
          </div>

          <div
            data-tour-target="equipment"
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${tourHighlightClass(activeTourTarget === 'equipment')}`}
          >
            <Autocomplete
              label="Equipo Registrado"
              name="equipo_id"
              value={formData.equipo_id}
              onChange={handleChange}
              options={equiposDelCliente}
              getOptionValue={(equipo) => equipo.id_equipo}
              getOptionLabel={(equipo) => [equipo.marca, equipo.modelo].filter(Boolean).join(' ') || `Equipo #${equipo.id_equipo}`}
              getOptionDescription={(equipo) => [equipo.tipo, equipo.numero_serie ? `S/N: ${equipo.numero_serie}` : '', `ID: ${equipo.id_equipo}`].filter(Boolean).join(' | ')}
              placeholder={formData.cliente_id ? 'Buscar equipo por marca, modelo, tipo o serie...' : 'Seleccione un cliente primero'}
              emptyMessage="No hay equipos para ese criterio"
              disabled={!formData.cliente_id}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Electrónico</label>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-semibold min-h-[42px]">
                {equipoSeleccionado?.tipo || 'Seleccione un equipo para ver el tipo'}
              </div>
              <p className="mt-1 text-xs text-gray-400">Este valor viene del equipo registrado.</p>
            </div>
          </div>

          <div
            data-tour-target="priority"
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${tourHighlightClass(activeTourTarget === 'priority')}`}
          >
            <Select label="Prioridad de Atención" name="prioridad" value={formData.prioridad} onChange={handleChange}>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </Select>
            
            <div className="flex flex-col justify-end">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Check name="deja_cargador" checked={formData.deja_cargador} onChange={handleChange} label="Cargador" />
                <Check name="enciende" checked={formData.enciende} onChange={handleChange} label="Enciende" />
                <Check name="usa_corriente_ac" checked={formData.usa_corriente_ac} onChange={handleChange} label="Corriente AC" />
              </div>
            </div>
          </div>

          <div
            data-tour-target="failure"
            className={tourHighlightClass(activeTourTarget === 'failure')}
          >
            <label className="block text-sm font-medium text-gray-700 mb-1 italic">Falla reportada por el cliente</label>
            <textarea 
              name="falla_reportada" 
              value={formData.falla_reportada} 
              onChange={handleChange} 
              required 
              rows={3} 
              placeholder="Ej: No da imagen, se apaga a los 5 minutos..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" 
            />
          </div>

          <div
            data-tour-target="actions"
            className={`flex justify-end pt-4 border-t border-gray-100 ${tourHighlightClass(activeTourTarget === 'actions')}`}
          >
            <button 
              type="submit" 
              disabled={loading} 
              className={`flex items-center gap-2 px-8 py-3 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Monitor className="w-5 h-5" />}
              {isEditing ? 'Guardar Cambios' : 'Generar Diagnóstico de Ingreso'}
            </button>
          </div>
        </form>
      </section>

      {/* SECCIÓN TABLA DE REVISIÓN */}
      <section
        data-tour-target="table"
        className={`space-y-4 ${tourHighlightClass(activeTourTarget === 'table')}`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-700">Registros Recientes</h3>
          
          {/* Contenedor del Buscador y del Filtro alineados lado a lado */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Buscar por ID, cliente o modelo..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Selector de Filtro Técnico */}
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
              <select
                value={filterTecnico}
                onChange={(e) => setFilterTecnico(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium text-gray-700 appearance-none cursor-pointer"
              >
                <option value="TODOS"> Todos los registros</option>
                <option value="SIN_ASIGNAR"> Sin Técnico (Editables)</option>
                <option value="ASIGNADOS"> Ya Asignados</option>
              </select>
              {/* Flecha personalizada del select */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="max-h-[70vh] overflow-auto custom-scrollbar">
            <table className="min-w-max w-full text-sm text-left text-gray-500">
              <thead className="sticky top-0 z-10 text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-bold">ID</th>
                  <th className="px-4 py-3 font-bold">Cliente</th>
                  <th className="px-4 py-3 font-bold">Equipo</th>
                  <th className="px-4 py-3 font-bold">Falla</th>
                  <th className="px-4 py-3 font-bold text-center">Prioridad</th>
                  <th className="px-4 py-3 font-bold text-center">Estado</th>
                  <th className="px-4 py-3 font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDiagnosticos.length > 0 ? (
                  filteredDiagnosticos.map((d) => {
                    const tieneTecnico = Boolean(d.tecnico_id || d.id_tecnico);

                    return (
                      <tr key={d.id_diagnostico} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">#{d.id_diagnostico}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{d.equipo?.cliente?.nombre || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700">{d.equipo?.modelo}</span>
                            <span className="text-[10px] uppercase text-gray-400">{d.equipo?.marca}</span>
                            <span className="text-xs font-bold text-indigo-600">{d.equipo?.tipo || 'Sin tipo'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">{d.falla_reportada}</td>
                        <td className="px-4 py-3 text-center"><PrioridadBadge prioridad={d.prioridad || 'Normal'} /></td>
                        <td className="px-4 py-3 text-center"><EstadoBadge estado={d.estado_del_diagnostico || d.estado} /></td>
                        <td className="px-4 py-3 text-right">
                          {tieneTecnico ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-semibold" title="Asignado a técnico. No editable.">
                              <ShieldAlert className="w-4 h-4" /> Asignado
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleEdit(d)} 
                              className="p-2 text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-indigo-200 transition-all shadow-sm hover:shadow"
                              title="Editar Registro"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-gray-400 italic bg-gray-50/50">
                      {loading ? 'Cargando datos...' : 'No se encontraron diagnósticos que coincidan con los filtros.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- SUB-COMPONENTES DE UI ---

const Select = ({ label, children, ...props }) => (
  <div className="flex flex-col">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 transition-all outline-none">
      {children}
    </select>
  </div>
);

const Check = ({ label, ...props }) => (
  <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-xs text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all shadow-sm">
    <input type="checkbox" {...props} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
    {label}
  </label>
);

export default Diagnostico;