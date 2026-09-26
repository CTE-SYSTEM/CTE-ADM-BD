// frontend/src/features/secretaria/pages/Diagnostico.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, HelpCircle, LayoutList, Plus } from 'lucide-react';
import { DiagnosticoForm } from '../components/Diagnostico/DiagnosticoForm';
import { DiagnosticosTable } from '../components/Diagnostico/DiagnosticosTable';
import { GuidedTour, initialFormState, tourHighlightClass, tourSteps } from '../components/Diagnostico/constants';
import { normalizeDiagnosticos, sortClientesByName } from '../components/Diagnostico/helpers';
import { EstadoBadge, PrioridadBadge } from '../components/Diagnostico/badges';
import { getClientes } from '../services/clientesService';
import { getEquipos } from '../services/equiposService';
import { createDiagnostico, getDiagnosticos, updateDiagnostico } from '../services/diagnosticoService';
import { useInfiniteSecretariaList } from '../hooks/useInfiniteSecretariaList';

export { EstadoBadge, PrioridadBadge };

const Diagnostico = () => {
  const location = useLocation();
  const formRef = useRef(null);
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTecnico, setFilterTecnico] = useState('TODOS');
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  // Mantener el formulario oculto al entrar; se abre automáticamente
  // cuando la navegación trae un cliente o equipo preseleccionado.
  const [isFormOpen, setIsFormOpen] = useState(Boolean(location.state?.clienteId || location.state?.equipoId));

  const preselectedClienteId = location.state?.clienteId ? String(location.state.clienteId) : '';
  const preselectedEquipoId = location.state?.equipoId ? String(location.state.equipoId) : '';
  const activeTourTarget = showHelp ? tourSteps[tourStep].target : '';
  const diagnosticosQuery = useInfiniteSecretariaList({
    queryKey: ['secretaria', 'diagnosticos'],
    queryFn: getDiagnosticos,
    search: searchTerm,
    extraParams: { filterTecnico },
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resC, resE] = await Promise.all([
        getClientes({ page: 1, pageSize: 100 }),
        getEquipos({ page: 1, pageSize: 100 }),
      ]);
      const clientesData = sortClientesByName(resC.data.data || []);
      const equiposData = resE.data.data || [];

      setClientes(clientesData);
      setEquipos(equiposData);
    } catch {
      setError('Error al sincronizar datos con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!showHelp || !activeTourTarget) return;
    const scrollTimer = window.setTimeout(() => {
      document.querySelector(`[data-tour-target="${activeTourTarget}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [activeTourTarget, showHelp]);

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
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const clienteSeleccionado = clientes.find((cliente) => String(cliente.id_cliente) === String(formData.cliente_id));
  const equiposDelCliente = formData.cliente_id ? equipos.filter((equipo) => Number(equipo.cliente_id) === Number(formData.cliente_id)) : [];
  const equipoSeleccionado = equipos.find((equipo) => String(equipo.id_equipo) === String(formData.equipo_id));
  const diagnosticos = useMemo(
    () => normalizeDiagnosticos(diagnosticosQuery.rows, equipos, clientes),
    [diagnosticosQuery.rows, equipos, clientes],
  );
  const filteredDiagnosticos = diagnosticos;

  const closeTour = () => {
    setShowHelp(false);
    setTourStep(0);
  };

  const startTour = () => {
    setTourStep(0);
    setShowHelp(true);
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      ...initialFormState,
      cliente_id: preselectedClienteId,
      equipo_id: preselectedEquipoId,
    });
    setIsFormOpen(true);
  };

  const handleChange = ({ target }) => {
    const { name, value, type, checked } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'cliente_id' ? { equipo_id: '' } : {}),
    }));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData(initialFormState);
    setIsFormOpen(false);
  };

  const handleEdit = (diag) => {
    if (diag.tecnico_id || diag.id_tecnico) {
      window.alert('No se puede editar este registro porque ya cuenta con un tecnico asignado.');
      return;
    }

    setIsEditing(true);
    setIsFormOpen(true);
    setCurrentId(diag.id_diagnostico);
    setFormData({
      cliente_id: String(diag.equipo?.cliente_id || diag.equipo?.cliente?.id_cliente || ''),
      equipo_id: String(diag.equipo_id || diag.equipo?.id_equipo || ''),
      falla_reportada: diag.falla_reportada || '',
      prioridad: diag.prioridad || 'Normal',
      estado: diag.estado_del_diagnostico || diag.estado || 'INGRESADO',
      deja_cargador: Boolean(diag.deja_cargador),
      enciende: Boolean(diag.enciende),
      usa_corriente_ac: Boolean(diag.usa_corriente_ac),
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
        setMessage('Diagnostico actualizado correctamente');
      } else {
        await createDiagnostico(formData);
        setMessage('Diagnostico de ingreso generado con exito');
        setIsFormOpen(false);
      }

      cancelEdit();
      await Promise.all([loadData(), diagnosticosQuery.refetch()]);
    } catch (err) {
      setError(err?.response?.data?.error || 'Ocurrio un error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="p-4 bg-gray-50 min-h-screen space-y-4">
    {showHelp && (
      <GuidedTour
        stepIndex={tourStep}
        onBack={() => setTourStep((step) => Math.max(step - 1, 0))}
        onClose={closeTour}
        onNext={() => (tourStep === tourSteps.length - 1 ? closeTour() : setTourStep((step) => step + 1))}
      />
    )}

    {/* Encabezado Principal */}
    <div data-tour-target="header" className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${tourHighlightClass(activeTourTarget === 'header')}`}>
      <div className="text-left">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Diagnóstico de Ingreso</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">Gestión de recepción y revisión técnica inicial.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={startTour}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition-all"
          title="Iniciar tutorial guiado"
        >
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>Ayuda</span>
        </button>
        <button
          type="button"
          onClick={openNewForm}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo diagnóstico</span>
        </button>
        <LayoutList className="w-6 h-6 text-indigo-300" />
      </div>
    </div>

    {error && (
      <div className="p-2.5 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 text-xs font-semibold border border-red-200 text-left">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    )}

    {message && (
      <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 text-left">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>{message}</span>
      </div>
    )}

    {/* Formulario de Diagnóstico */}
    {isFormOpen && (
      <DiagnosticoForm
        activeTourTarget={activeTourTarget}
        clienteSeleccionado={clienteSeleccionado}
        clientes={clientes}
        currentId={currentId}
        equipoSeleccionado={equipoSeleccionado}
        equiposDelCliente={equiposDelCliente}
        formData={formData}
        formRef={formRef}
        isEditing={isEditing}
        loading={loading || diagnosticosQuery.isLoading}
        onCancelEdit={cancelEdit}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    )}

    {/* Tabla de Diagnósticos */}
    <DiagnosticosTable
      activeTourTarget={activeTourTarget}
      diagnosticos={filteredDiagnosticos}
      filterTecnico={filterTecnico}
      loading={loading}
      onEdit={handleEdit}
      onFilterChange={setFilterTecnico}
      onSearchChange={setSearchTerm}
      searchTerm={searchTerm}
      onLoadMore={() => diagnosticosQuery.fetchNextPage()}
      hasMore={diagnosticosQuery.hasNextPage}
      isLoadingMore={diagnosticosQuery.isFetchingNextPage}
    />
  </div>
);
};

export default Diagnostico;
