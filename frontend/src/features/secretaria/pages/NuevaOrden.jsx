import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, CheckCircle, XCircle, User, Monitor, HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { GuidedTour, tourHighlightClass } from '../components/shared/GuidedTour';
import { createOrden, getDiagnosticosListosParaOrden } from '../services/ordenesService';
import { updateEstadoDiagnostico } from '../services/diagnosticoService';

const tourSteps = [
  { target: 'header', title: '1. Órdenes pendientes', text: 'Aquí aparecen diagnósticos listos que todavía no tienen una orden asociada.' },
  { target: 'search', title: '2. Buscar rápido', text: 'Filtra por cliente, equipo, falla, informe o ID antes de aprobar.' },
  { target: 'cards', title: '3. Revisar datos', text: 'Confirma equipo, cliente, informe técnico y presupuesto antes de crear la orden.' },
  { target: 'actions', title: '4. Aprobar o rechazar', text: 'Aprobar crea la orden de reparación. Rechazar solo cambia el estado del diagnóstico.' },
];



const NuevaOrden = () => {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [requierePiezasPorDiagnostico, setRequierePiezasPorDiagnostico] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const loadDiagnosticos = useCallback(async () => {
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
  }, []);

  useEffect(() => { loadDiagnosticos(); }, [loadDiagnosticos]);

  useEffect(() => {
    const handleSecretariaNotification = (event) => {
      const type = event.detail?.type;
      if (type === 'diagnostico_completado' || type === 'orden_creada_secretaria') {
        loadDiagnosticos();
      }
    };

    window.addEventListener('secretaria:notificacion', handleSecretariaNotification);
    return () => window.removeEventListener('secretaria:notificacion', handleSecretariaNotification);
  }, [loadDiagnosticos]);

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
  <div className="p-4 bg-gray-50 min-h-screen space-y-4">
    {showHelp && (
      <GuidedTour
        steps={tourSteps}
        stepIndex={tourStep}
        onBack={() => setTourStep((step) => Math.max(step - 1, 0))}
        onClose={closeTour}
        onNext={handleTourNext}
      />
    )}

    {/* Encabezado Principal */}
     <div data-tour-target="header" className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${tourHighlightClass(activeTourTarget === 'header')}`}>
      <div className="text-left">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Generar Órdenes</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">Diagnósticos completados esperando respuesta del cliente.</p>
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
      </div>
    </div>

    {error && (
      <div className="p-2.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 text-left">
        {error}
      </div>
    )}

    {/* Buscador */}
    <div data-tour-target="search" className={`${tourHighlightClass(activeTourTarget === 'search')}`}>
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar cliente, equipo o diagnóstico..."
          className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-xs outline-none transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
    </div>

    {/* Contenido Principal */}
    {loading ? (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    ) : (
      <div data-tour-target="cards" className={`grid grid-cols-1 gap-3 text-left ${tourHighlightClass(activeTourTarget === 'cards')}`}>
        {diagnosticosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <p className="text-xs font-bold text-gray-500">No hay diagnósticos pendientes de aprobación por el cliente.</p>
            {summary && (
              <p className="mx-auto mt-2 max-w-2xl text-[11px] font-medium leading-relaxed text-gray-400">
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
            const esLargo = textoInforme.length > limiteCaracteres;

            return (
              <div key={diag.id_diagnostico} className="bg-white p-3.5 rounded-lg shadow-xs border border-gray-200 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3 overflow-hidden hover:shadow-sm transition-shadow">
                <div className="flex gap-3 items-start w-full min-w-0">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                    <Monitor className="w-5 h-5" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 break-words text-sm">{diag.equipo?.marca} {diag.equipo?.modelo}</h3>
                    
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1 min-w-0">
                        <User className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span className="truncate font-medium text-gray-700">{diag.equipo?.cliente?.nombre}</span>
                      </span>
                      
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${Number(diag.presupuesto_estimado || 0) > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700'}`}>
                        Presupuesto: {formatPresupuesto(diag.presupuesto_estimado)}
                      </span>
                      
                      {!canApprove && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                          Requiere revisión
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Detalles del diagnóstico</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500 border border-slate-100">
                          {getRequierePiezas(diag.id_diagnostico) ? 'Con repuestos' : 'Sin repuestos'}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-md bg-white p-2 border border-slate-100">
                          <span className="block text-[9px] font-bold uppercase text-slate-400">Falla reportada</span>
                          <p className="mt-0.5 text-xs leading-normal text-slate-700">{diag.falla_reportada || 'Sin detalle de falla'}</p>
                        </div>
                        
                        <div className="rounded-md bg-white p-2 border border-slate-100">
                          <span className="block text-[9px] font-bold uppercase text-slate-400">Diagnóstico técnico</span>
                          <p className="mt-0.5 text-xs leading-normal text-slate-700">
                            {isExpanded || !esLargo
                              ? textoInforme
                              : `${textoInforme.substring(0, limiteCaracteres)}...`
                            }
                          </p>
                          {esLargo && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(diag.id_diagnostico)}
                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <span>Ver menos</span>
                                  <ChevronUp className="w-3 h-3" />
                                </>
                              ) : (
                                <>
                                  <span>Ver diagnóstico completo</span>
                                  <ChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 rounded-md border border-dashed border-indigo-200 bg-white p-2">
                        <label className="flex cursor-pointer items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={!getRequierePiezas(diag.id_diagnostico)}
                            onChange={(event) => setRequierePiezas(diag.id_diagnostico, !event.target.checked)}
                          />
                          <span>
                            <span className="block text-xs font-bold text-gray-800">Orden sin repuestos</span>
                            <span className="block text-[10px] font-medium leading-tight text-gray-500">
                              Úsalo solo si este servicio se factura únicamente por mano de obra.
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div data-tour-target="actions" className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto shrink-0 ${tourHighlightClass(activeTourTarget === 'actions')}`}>
                  <button
                    onClick={() => handleRechazar(diag.id_diagnostico)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold text-xs whitespace-nowrap"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rechazar</span>
                  </button>
                  <button
                    onClick={() => handleAprobar(diag)}
                    disabled={!canApprove}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 shadow-xs transition-all font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                    title={canApprove ? 'Crear orden' : 'Complete informe y presupuesto antes de aprobar'}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{getRequierePiezas(diag.id_diagnostico) ? 'Aprobar y Crear Orden' : 'Aprobar (Sin repuestos)'}</span>
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
