import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Loader2, Search, CheckCircle, XCircle, User, Monitor, HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { NotificationTray } from '../../components/TecnicoJefe/components';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { updateEstadoDiagnostico } from '../../services/secretaria/diagnosticoService';
import { createOrden, getDiagnosticosListosParaOrden } from '../../services/secretaria/ordenesService';

const tourSteps = [
  { target: 'header', title: '1. Órdenes pendientes', text: 'Aquí aparecen diagnósticos listos que todavía no tienen una orden asociada.' },
  { target: 'search', title: '2. Buscar rápido', text: 'Filtra por cliente, equipo, falla, informe o ID antes de aprobar.' },
  { target: 'cards', title: '3. Revisar datos', text: 'Confirma equipo, cliente, informe técnico y presupuesto antes de crear la orden.' },
  { target: 'actions', title: '4. Aprobar o rechazar', text: 'Aprobar crea la orden de reparación. Rechazar solo cambia el estado del diagnóstico.' },
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
            Atrás
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
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [requierePiezasPorDiagnostico, setRequierePiezasPorDiagnostico] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const loadDiagnosticos = async () => {
    setLoading(true);
    setError(null);
    try {
      const diagnosticosResponse = await getDiagnosticosListosParaOrden();
      const diagnosticosData = diagnosticosResponse.data?.data || diagnosticosResponse.data || [];
      setSummary(diagnosticosResponse.data?.meta || null);

      const diagnosticosConOrden = new Set();

      const pendientes = diagnosticosData.filter((diagnostico) => {
        const estado = String(diagnostico.estado_del_diagnostico || diagnostico.estado || '').toUpperCase();
        const cumpleEstado = ['COMPLETADO', 'DIAGNOSTICADO'].includes(estado);
        const tieneOrdenRelacionada = diagnostico.ordenes && diagnostico.ordenes.length > 0;
        const yaRegistrada = diagnosticosConOrden.has(Number(diagnostico.id_diagnostico));

        return cumpleEstado && !tieneOrdenRelacionada && !yaRegistrada;
      });

      setDiagnosticos(pendientes);
    } catch (err) {
      console.error('Error al cargar diagnosticos en el frontend:', err);
      setError('No se pudieron cargar los diagnósticos pendientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDiagnosticos(); }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const {
    notifications,
    connected: socketConnected,
    clearNotifications,
  } = useRealtimeNotifications({
    onNotification: (notification) => {
      setShowNotifications(true);
      if (notification?.type === 'orden_creada_secretaria') {
        setMessage(notification.message || 'Orden generada correctamente');
      }
    },
    onRefresh: (notification) => {
      if (!notification || notification.type === 'orden_creada_secretaria' || notification.type === 'diagnostico_completado') {
        loadDiagnosticos();
      }
    },
    refreshIntervalMs: 0,
  });

  const activeTourTarget = showHelp ? tourSteps[tourStep].target : '';

  useEffect(() => {
    if (!showHelp || !activeTourTarget) return;
    const scrollTimer = window.setTimeout(() => {
      document
        ?.querySelector(`[data-tour-target="${activeTourTarget}"]`)
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

  const diagnosticosFiltrados = useMemo(() => diagnosticos.filter((diag) => {
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
  }), [diagnosticos, filter]);

  const getRequierePiezas = (diagnosticoId) => {
    const value = requierePiezasPorDiagnostico[diagnosticoId];
    return value === undefined ? true : value;
  };

  const setRequierePiezas = (diagnosticoId, value) => {
    setRequierePiezasPorDiagnostico((prev) => ({
      ...prev,
      [diagnosticoId]: value,
    }));
  };

  const handleAprobar = async (diagnostico) => {
    if (!diagnostico?.id_diagnostico) {
      setError('No se puede crear la orden: diagnóstico inválido.');
      return;
    }

    if (!diagnostico.equipo?.cliente?.id_cliente || !diagnostico.equipo?.id_equipo) {
      setError('No se puede crear la orden: faltan datos del cliente o del equipo.');
      return;
    }

    if (!diagnostico.diagnostico_real || Number(diagnostico.presupuesto_estimado || 0) <= 0) {
      setError('Revise el informe técnico y el presupuesto antes de aprobar.');
      return;
    }

    const requierePiezas = getRequierePiezas(diagnostico.id_diagnostico);
    const confirmacion = requierePiezas
      ? '¿El cliente aprobó el presupuesto? Se generará la orden de reparación.'
      : '¿Confirmas que esta orden no requiere repuestos? Se generará como servicio solo de mano de obra.';

    if (!window.confirm(confirmacion)) return;

    try {
      setLoading(true);
      setError(null);
      await createOrden({
        diagnostico_id: diagnostico.id_diagnostico,
        monto_acordado: diagnostico.presupuesto_estimado,
        estado: 'EN_REPARACION',
        requiere_piezas: requierePiezas,
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
      setError('No se puede rechazar: diagnóstico inválido.');
      return;
    }

    if (!window.confirm('¿El cliente rechazó el presupuesto?')) return;
    try {
      setError(null);
      await updateEstadoDiagnostico(id, 'RECHAZADO');
      await loadDiagnosticos();
    } catch {
      setError('Error al actualizar estado');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatPresupuesto = (monto) => {
    if (!monto || isNaN(Number(monto))) return 'Sin monto';
    const [entero, decimal] = Number(monto).toFixed(2).split('.');
    const enteroConEspacios = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `C$ ${enteroConEspacios}.${decimal}`;
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
        <div className="text-left">
          <h2 className="text-2xl font-bold text-gray-800">Generar Órdenes</h2>
          <p className="text-gray-500 font-medium">Diagnósticos completados esperando respuesta del cliente.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((value) => !value)}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm hover:border-indigo-200 hover:text-indigo-600"
              title={socketConnected ? 'Notificaciones conectadas' : 'Notificaciones desconectadas'}
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {notifications.length}
                </span>
              )}
              <span className={`absolute bottom-1 right-1 h-2 w-2 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            </button>
            {showNotifications && (
              <NotificationTray
                notifications={notifications}
                connected={socketConnected}
                onClear={() => {
                  clearNotifications();
                  setShowNotifications(false);
                }}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>
          <button
            type="button"
            onClick={startTour}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2 text-gray-700 shadow-sm hover:bg-gray-50 font-semibold"
            title="Iniciar tutorial guiado"
          >
            <HelpCircle className="w-4 h-4" /> Ayuda
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 text-left">{error}</div>}
      {message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 text-left">{message}</div>}

      <div data-tour-target="search" className={`mb-6 ${tourHighlightClass(activeTourTarget === 'search')}`}>
        <div className="relative max-w-xl">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente, equipo o diagnóstico..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white text-sm outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>
      ) : (
        <div data-tour-target="cards" className={`grid grid-cols-1 gap-4 text-left ${tourHighlightClass(activeTourTarget === 'cards')}`}>
          {diagnosticosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 px-6 py-16 text-center">
              <p className="text-base font-bold text-gray-500">No hay diagnósticos pendientes de aprobación por el cliente.</p>
              {summary && (
                <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-6 text-gray-400">
                  Listos para nueva orden: {summary.listosParaOrden || 0}. En revisión o pendientes: {summary.enRevision || 0}.
                </p>
              )}
            </div>
          ) : (
            diagnosticosFiltrados.map((diag) => {
              const canApprove = Boolean(diag.equipo?.cliente?.id_cliente && diag.equipo?.id_equipo && diag.diagnostico_real && Number(diag.presupuesto_estimado || 0) > 0);
              
              const isExpanded = expandedId === diag.id_diagnostico;
              const textoInforme = diag.diagnostico_real || 'Sin informe detallado';
              const limiteCaracteres = 90;
              // REPARADO: Línea restablecida correctamente
              const esLargo = textoInforme.length > limiteCaracteres;

              return (
                <div key={diag.id_diagnostico} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex gap-4 items-start w-full min-w-0">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-800 break-words text-lg">{diag.equipo?.marca} {diag.equipo?.modelo}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1 min-w-0"><User className="w-4 h-4 shrink-0 text-gray-400" /> <span className="truncate font-semibold text-gray-600">{diag.equipo?.cliente?.nombre}</span></span>
                        
                        <span className={`px-2 py-0.5 rounded text-xs font-black whitespace-nowrap ${Number(diag.presupuesto_estimado || 0) > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700'}`}>
                          Presupuesto: {formatPresupuesto(diag.presupuesto_estimado)}
                        </span>
                        
                        {!canApprove && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                            Requiere revisión
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Detalles del diagnóstico</span>
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                            {getRequierePiezas(diag.id_diagnostico) ? 'Con repuestos' : 'Sin repuestos'}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-white p-3">
                            <span className="block text-[9px] font-black uppercase text-slate-400">Falla reportada</span>
                            <p className="mt-1 text-xs leading-5 text-slate-700">{diag.falla_reportada || 'Sin detalle de falla'}</p>
                          </div>
                          <div className="rounded-lg bg-white p-3">
                            <span className="block text-[9px] font-black uppercase text-slate-400">Diagnóstico técnico</span>
                            <p className="mt-1 text-xs leading-5 text-slate-700">
                              {isExpanded || !esLargo
                                ? textoInforme
                                : `${textoInforme.substring(0, limiteCaracteres)}...`
                              }
                            </p>
                            {esLargo && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(diag.id_diagnostico)}
                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Ver menos</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>Ver diagnóstico completo</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 rounded-lg border border-dashed border-indigo-200 bg-white p-3">
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={!getRequierePiezas(diag.id_diagnostico)}
                              onChange={(event) => setRequierePiezas(diag.id_diagnostico, !event.target.checked)}
                            />
                            <span>
                              <span className="block text-sm font-bold text-gray-800">Orden sin repuestos</span>
                              <span className="block text-xs font-medium leading-5 text-gray-500">
                                Úsalo solo si este servicio se factura únicamente por mano de obra.
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div data-tour-target="actions" className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto shrink-0 ${tourHighlightClass(activeTourTarget === 'actions')}`}>
                    <button
                      onClick={() => handleRechazar(diag.id_diagnostico)}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold text-sm whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                    <button
                      onClick={() => handleAprobar(diag)}
                      disabled={!canApprove}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 shadow-md transition-all font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                      title={canApprove ? 'Crear orden' : 'Complete informe y presupuesto antes de aprobar'}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {getRequierePiezas(diag.id_diagnostico) ? 'Aprobar y Crear Orden' : 'Aprobar y Crear Orden sin repuestos'}
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