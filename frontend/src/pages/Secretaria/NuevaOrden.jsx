// frontend/src/pages/Secretaria/Nuevaorden.jsx
import React, { useEffect, useState } from 'react';
import { Loader2, Search, CheckCircle, XCircle, User, Monitor, HelpCircle, X } from 'lucide-react';
import { getDiagnosticos, updateEstadoDiagnostico } from '../../services/secretaria/diagnosticoService';
import { createOrden, getOrdenes } from '../../services/secretaria/ordenesService';

const tourSteps = [
  { target: 'header', title: '1. Ordenes pendientes', text: 'Aqui aparecen diagnosticos listos que todavia no tienen una orden asociada.' },
  { target: 'search', title: '2. Buscar rapido', text: 'Filtra por cliente, equipo, falla, informe o ID antes de aprobar.' },
  { target: 'cards', title: '3. Revisar datos', text: 'Confirma equipo, cliente, informe tecnico y presupuesto antes de crear la orden.' },
  { target: 'actions', title: '4. Aprobar o rechazar', text: 'Aprobar crea la orden de reparacion. Rechazar solo cambia el estado del diagnostico.' },
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

const NuevaOrden = () => {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const estadosListos = ['COMPLETADO'];

  const loadDiagnosticos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [diagnosticosResponse, ordenesResponse] = await Promise.all([getDiagnosticos(), getOrdenes()]);
      const diagnosticosConOrden = new Set((ordenesResponse.data.data || []).map((orden) => Number(orden.diagnostico_id)));
      const pendientes = (diagnosticosResponse.data.data || []).filter((diagnostico) => (
        estadosListos.includes(String(diagnostico.estado_del_diagnostico || diagnostico.estado || '').toUpperCase())
        && !diagnostico.ordenes?.length
        && !diagnosticosConOrden.has(Number(diagnostico.id_diagnostico))
      ));
      setDiagnosticos(pendientes);
    } catch (err) {
      console.error('Error al cargar diagnosticos', err);
      setError('No se pudieron cargar los diagnosticos pendientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDiagnosticos(); }, []);

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

  const diagnosticosFiltrados = diagnosticos.filter((diag) => {
    const term = filter.toLowerCase();
    return [
      diag.equipo?.cliente?.nombre,
      diag.equipo?.marca,
      diag.equipo?.modelo,
      diag.equipo?.tipo,
      diag.diagnostico_real,
      diag.falla_reportada,
      String(diag.id_diagnostico),
    ].some((value) => String(value || '').toLowerCase().includes(term));
  });

  const handleAprobar = async (diagnostico) => {
    if (!diagnostico?.id_diagnostico) {
      setError('No se puede crear la orden: diagnostico invalido.');
      return;
    }

    if (!diagnostico.equipo?.cliente?.id_cliente || !diagnostico.equipo?.id_equipo) {
      setError('No se puede crear la orden: faltan datos del cliente o del equipo.');
      return;
    }

    if (!diagnostico.diagnostico_real || !Number(diagnostico.presupuesto_estimado || 0)) {
      setError('Revise el informe tecnico y el presupuesto antes de aprobar.');
      return;
    }

    if (!window.confirm('El cliente aprobo el presupuesto? Se generara la orden de reparacion.')) return;

    try {
      setLoading(true);
      setError(null);
      await createOrden({
        diagnostico_id: diagnostico.id_diagnostico,
        monto_acordado: diagnostico.presupuesto_estimado,
        estado: 'EN_REPARACION',
      });
      await updateEstadoDiagnostico(diagnostico.id_diagnostico, 'APROBADO');
      await loadDiagnosticos();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al generar la orden');
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async (id) => {
    if (!id) {
      setError('No se puede rechazar: diagnostico invalido.');
      return;
    }

    if (!window.confirm('El cliente rechazo el presupuesto?')) return;
    try {
      setError(null);
      await updateEstadoDiagnostico(id, 'RECHAZADO');
      await loadDiagnosticos();
    } catch {
      setError('Error al actualizar estado');
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

      <div data-tour-target="header" className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${tourHighlightClass(activeTourTarget === 'header')}`}>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Generar Ordenes</h2>
          <p className="text-gray-500 font-medium">Diagnosticos completados esperando respuesta del cliente.</p>
        </div>
        <button
          type="button"
          onClick={startTour}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2 text-gray-700 shadow-sm hover:bg-gray-50"
          title="Iniciar tutorial guiado"
        >
          <HelpCircle className="w-4 h-4" /> Ayuda
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}

      <div data-tour-target="search" className={`mb-6 ${tourHighlightClass(activeTourTarget === 'search')}`}>
        <div className="relative max-w-xl">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente, equipo o diagnostico..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>
      ) : (
        <div data-tour-target="cards" className={`grid grid-cols-1 gap-4 ${tourHighlightClass(activeTourTarget === 'cards')}`}>
          {diagnosticosFiltrados.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed text-gray-400">
              No hay diagnosticos pendientes de aprobacion por el cliente.
            </div>
          ) : (
            diagnosticosFiltrados.map((diag) => {
              const canApprove = Boolean(diag.equipo?.cliente?.id_cliente && diag.equipo?.id_equipo && diag.diagnostico_real && Number(diag.presupuesto_estimado || 0));

              return (
                <div key={diag.id_diagnostico} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 overflow-hidden">
                  <div className="flex gap-4 items-start w-full min-w-0">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 break-words">{diag.equipo?.marca} {diag.equipo?.modelo}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1 min-w-0"><User className="w-4 h-4 shrink-0" /> <span className="truncate">{diag.equipo?.cliente?.nombre}</span></span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${Number(diag.presupuesto_estimado || 0) ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'}`}>
                          Presupuesto: {diag.presupuesto_estimado ? `C$ ${Number(diag.presupuesto_estimado).toFixed(2)}` : 'Sin monto'}
                        </span>
                        {!canApprove && (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                            Requiere revision
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2 italic break-words">
                        Informe Tecnico: {diag.diagnostico_real || 'Sin informe detallado'}
                      </p>
                    </div>
                  </div>

                  <div data-tour-target="actions" className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto shrink-0 ${tourHighlightClass(activeTourTarget === 'actions')}`}>
                    <button
                      onClick={() => handleRechazar(diag.id_diagnostico)}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold whitespace-nowrap"
                    >
                      <XCircle className="w-5 h-5" /> Rechazar
                    </button>
                    <button
                      onClick={() => handleAprobar(diag)}
                      disabled={!canApprove}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                      title={canApprove ? 'Crear orden' : 'Complete informe y presupuesto antes de aprobar'}
                    >
                      <CheckCircle className="w-5 h-5" /> Aprobar y Crear Orden
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NuevaOrden;
