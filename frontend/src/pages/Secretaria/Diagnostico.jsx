// frontend/src/pages/Secretaria/Diagnostico.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, HelpCircle, LayoutList } from 'lucide-react';
import { DiagnosticoForm } from '../../components/Secretaria/Diagnostico/DiagnosticoForm';
import { DiagnosticosTable } from '../../components/Secretaria/Diagnostico/DiagnosticosTable';
import { GuidedTour, initialFormState, tourHighlightClass, tourSteps } from '../../components/Secretaria/Diagnostico/constants';
import { filterDiagnosticos, normalizeDiagnosticos, sortClientesByName } from '../../components/Secretaria/Diagnostico/helpers';
import { EstadoBadge, PrioridadBadge } from '../../components/Secretaria/Diagnostico/badges';
import { getClientes } from '../../services/secretaria/clientesService';
import { getEquipos } from '../../services/secretaria/equiposService';
import { createDiagnostico, getDiagnosticos, updateDiagnostico } from '../../services/secretaria/diagnosticoService';

export { EstadoBadge, PrioridadBadge };

const Diagnostico = () => {
  const location = useLocation();
  const formRef = useRef(null);
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [diagnosticos, setDiagnosticos] = useState([]);
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
  const [isFormOpen, setIsFormOpen] = useState(true);

  const preselectedClienteId = location.state?.clienteId ? String(location.state.clienteId) : '';
  const preselectedEquipoId = location.state?.equipoId ? String(location.state.equipoId) : '';
  const activeTourTarget = showHelp ? tourSteps[tourStep].target : '';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resC, resE, resD] = await Promise.all([getClientes(), getEquipos(), getDiagnosticos()]);
      const clientesData = sortClientesByName(resC.data.data || []);
      const equiposData = resE.data.data || [];

      setClientes(clientesData);
      setEquipos(equiposData);
      setDiagnosticos(normalizeDiagnosticos(resD.data.data || [], equiposData, clientesData));
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
  const filteredDiagnosticos = useMemo(
    () => filterDiagnosticos(diagnosticos, searchTerm, filterTecnico),
    [diagnosticos, filterTecnico, searchTerm],
  );

  const closeTour = () => {
    setShowHelp(false);
    setTourStep(0);
  };

  const startTour = () => {
    setTourStep(0);
    setShowHelp(true);
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
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Ocurrio un error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      {showHelp && (
        <GuidedTour
          stepIndex={tourStep}
          onBack={() => setTourStep((step) => Math.max(step - 1, 0))}
          onClose={closeTour}
          onNext={() => (tourStep === tourSteps.length - 1 ? closeTour() : setTourStep((step) => step + 1))}
        />
      )}

      <div data-tour-target="header" className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${tourHighlightClass(activeTourTarget === 'header')}`}>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Diagnostico de Ingreso</h2>
          <p className="text-gray-500 font-medium">Gestion de recepcion y revision tecnica inicial.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={startTour} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50" title="Iniciar tutorial guiado">
            <HelpCircle className="w-4 h-4" /> Ayuda
          </button>
          <LayoutList className="w-8 h-8 text-indigo-200" />
        </div>
      </div>

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
        isFormOpen={isFormOpen}
        loading={loading}
        onCancelEdit={cancelEdit}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onToggle={() => setIsFormOpen((open) => !open)}
      />

      <DiagnosticosTable
        activeTourTarget={activeTourTarget}
        diagnosticos={filteredDiagnosticos}
        filterTecnico={filterTecnico}
        loading={loading}
        onEdit={handleEdit}
        onFilterChange={setFilterTecnico}
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default Diagnostico;
