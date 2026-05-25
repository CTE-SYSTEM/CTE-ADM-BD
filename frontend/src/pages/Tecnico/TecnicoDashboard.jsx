import React, { useContext, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, FileText, Package, Wrench, Calendar } from 'lucide-react';
import { AuthContext } from "../../context/AuthContext";
import TecnicoHeader from "../../components/TecnicoHeader";
import DiagnosticosTable from "../../components/DiagnosticosTable";
import OrdenesGrid from "../../components/OrdenesGrid";
import RepuestosTable from "../../components/RepuestosTable";
import SearchBox from "../../components/SearchBox";
import { CierreOrdenModal, DiagnosticoModal, SolicitarRepuestoModal } from '../../components/TecnicoModals';
import { TecnicoStatCard, TecnicoTabButton } from '../../components/TecnicoStats';
import { useTecnicoDashboard } from './hooks/useTecnicoDashboard';
import { filterItems } from '../../utils/textFilters';

const uniqueSorted = (values, toTitleCase) => [
  ...new Set(values.map(toTitleCase).filter(Boolean))
].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

const TecnicoDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('diagnosticos');
  const [modalRepuesto, setModalRepuesto] = useState(null);
  const [modalDiagnostico, setModalDiagnostico] = useState(null);
  const [modalCierre, setModalCierre] = useState(null);
  
  // Estado para controlar el filtro de tiempo de los recuadros grandes
  const [timeFilter, setTimeFilter] = useState('todos'); // 'hoy', 'mes', 'anio', 'todos'

  const [searches, setSearches] = useState({
    diagnosticosEnRevision: '',
    diagnosticosCompletados: '',
    ordenesActivas: '',
    ordenesCompletadas: '',
    repuestos: '',
  });

  const { data, state, actions } = useTecnicoDashboard(user);
  const {
    diagnosticosEnRevision,
    diagnosticosCompletados,
    ordenes,
    ordenesActivas,
    ordenesCompletadas,
    repuestosCatalogo,
    solicitudesRepuestos,
  } = data;
  const { loading, error } = state;

  // --- LÓGICA DE FILTRADO POR TIEMPO PARA LOS RECUADROS GRANDES ---
  const filterByTime = (items) => {
    if (timeFilter === 'todos') return items;
    
    const ahora = new Date();
    return items.filter((item) => {
      // Intentamos obtener la fecha del registro (createdAt, fecha o updatedAt según devuelva tu backend)
      const fechaItem = new Date(item.createdAt || item.fecha || item.updatedAt);
      if (isNaN(fechaItem.getTime())) return true; // Si no hay fecha válida, lo dejamos por defecto

      if (timeFilter === 'hoy') {
        return (
          fechaItem.getDate() === ahora.getDate() &&
          fechaItem.getMonth() === ahora.getMonth() &&
          fechaItem.getFullYear() === ahora.getFullYear()
        );
      }
      if (timeFilter === 'mes') {
        return (
          fechaItem.getMonth() === ahora.getMonth() &&
          fechaItem.getFullYear() === ahora.getFullYear()
        );
      }
      if (timeFilter === 'anio') {
        return fechaItem.getFullYear() === ahora.getFullYear();
      }
      return true;
    });
  };

  // Totales dinámicos memorizados basados en el filtro de fecha seleccionado
  const statsCalculadas = useMemo(() => {
    return {
      enRevisionCount: filterByTime(diagnosticosEnRevision).length,
      completadosCount: filterByTime(diagnosticosCompletados).length,
      ordenesActivasCount: filterByTime(ordenesActivas).length,
      piezasCount: filterByTime(solicitudesRepuestos).length,
    };
  }, [timeFilter, diagnosticosEnRevision, diagnosticosCompletados, ordenesActivas, solicitudesRepuestos]);


  // --- FILTROS DE BÚSQUEDA POR TEXTO (PAGINACIÓN / TABLAS) ---
  const diagnosticosEnRevisionFiltrados = useMemo(
    () => filterItems(diagnosticosEnRevision, searches.diagnosticosEnRevision, (item) => [
      item.id, item.cliente, item.equipo, item.falla, item.estado,
    ]),
    [diagnosticosEnRevision, searches.diagnosticosEnRevision],
  );

  const diagnosticosCompletadosFiltrados = useMemo(
    () => filterItems(diagnosticosCompletados, searches.diagnosticosCompletados, (item) => [
      item.id, item.cliente, item.equipo, item.falla, item.estado, item.diagnostico, item.presupuesto,
    ]),
    [diagnosticosCompletados, searches.diagnosticosCompletados],
  );

  const ordenesActivasFiltradas = useMemo(
    () => filterItems(ordenesActivas, searches.ordenesActivas, (item) => [
      item.id, item.cliente, item.equipo, item.falla, item.estado, item.prioridad,
    ]),
    [ordenesActivas, searches.ordenesActivas],
  );

  const ordenesCompletadasFiltradas = useMemo(
    () => filterItems(ordenesCompletadas, searches.ordenesCompletadas, (item) => [
      item.id, item.cliente, item.equipo, item.falla, item.estado, item.prioridad, item.diagnostico, item.resultado_final, item.observacion_final,
      ...(item.repuestos_usados || []).flatMap((repuesto) => [
        repuesto.repuesto?.nombre, repuesto.pieza_solicitada, repuesto.estado_aprobacion,
      ]),
    ]),
    [ordenesCompletadas, searches.ordenesCompletadas],
  );

  const solicitudesRepuestosFiltradas = useMemo(
    () => filterItems(solicitudesRepuestos, searches.repuestos, (item) => [
      item.id, item.ordenId, item.repuesto, item.cantidad, item.estado,
      item.pendienteInventario ? 'por registrar pendiente inventario' : 'registrada inventario',
    ]),
    [solicitudesRepuestos, searches.repuestos],
  );

  const updateSearch = (key, value) => {
    setSearches((prev) => ({ ...prev, [key]: value }));
  };

  const handleEstadoChange = async (ordenId, nuevoEstado) => {
    const orden = ordenes.find((item) => item.id === ordenId);
    if (['FINALIZADO', 'IRREPARABLE'].includes(nuevoEstado)) {
      setModalCierre({ orden, estado: nuevoEstado });
      return;
    }

    actions.setOrdenes((prev) => prev.map((item) => (item.id === ordenId ? { ...item, estado: nuevoEstado } : item)));
    try {
      await actions.cambiarEstadoOrden(ordenId, { estado: nuevoEstado });
    } catch (err) {
      console.error('Error al cambiar estado de orden:', err);
      actions.setError(err?.response?.data?.error || 'No se pudo actualizar el estado de la orden.');
      await actions.loadTecnicoData();
    }
  };

  const handleCerrarOrden = async (ordenId, payload) => {
    actions.setOrdenes((prev) => prev.map((item) => (item.id === ordenId ? { ...item, estado: payload.estado } : item)));
    try {
      await actions.cambiarEstadoOrden(ordenId, payload);
    } catch (err) {
      await actions.loadTecnicoData();
      throw err;
    }
  };

  const handleSolicitarRepuesto = async (ordenId, payload) => {
    actions.setOrdenes((prev) => prev.map((item) => (item.id === ordenId ? { ...item, estado: 'ESPERANDO_PIEZA' } : item)));
    try {
      await actions.solicitarRepuesto(ordenId, payload);
    } catch (err) {
      await actions.loadTecnicoData();
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <TecnicoHeader user={user} onLogout={logout} />

      <main className="mx-auto max-w-[1840px] px-6 py-10">
        
        {/* FILTRO DE TIEMPO PARA LOS RECUADROS GRANDES */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-left">
            <Calendar className="text-indigo-500 w-5 h-5" />
            <div>
              <h3 className="font-bold text-slate-800">Filtrar Indicadores de Rendimiento</h3>
              <p className="text-xs text-slate-500">Afecta los números de los 4 recuadros informativos superiores.</p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: 'mes', label: 'Este Mes' },
              { id: 'anio', label: 'Este Año' },
              { id: 'todos', label: 'Histórico' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTimeFilter(btn.id)}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  timeFilter === btn.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* RECUADROS GRANDES DE ESTADÍSTICAS (Valores dinámicos en base al filtro) */}
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          <TecnicoStatCard icon={<ClipboardList size={22} />} label="En revisión" value={statsCalculadas.enRevisionCount} color="violet" />
          <TecnicoStatCard icon={<CheckCircle2 size={22} />} label="Diagnósticos completados" value={statsCalculadas.completadosCount} color="emerald" />
          <TecnicoStatCard icon={<Wrench size={22} />} label="Órdenes activas" value={statsCalculadas.ordenesActivasCount} color="blue" />
          <TecnicoStatCard icon={<Package size={22} />} label="Mis piezas" value={statsCalculadas.piezasCount} color="amber" />
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div>}

        {/* NAVEGACIÓN DE PESTAÑAS */}
        <div className="mb-8">
          <nav className="flex flex-wrap gap-3">
            <TecnicoTabButton active={activeTab === 'diagnosticos'} onClick={() => setActiveTab('diagnosticos')} icon={<ClipboardList size={16} />} label={`En Revision (${diagnosticosEnRevision.length})`} />
            <TecnicoTabButton active={activeTab === 'diagnosticos_completados'} onClick={() => setActiveTab('diagnosticos_completados')} icon={<FileText size={16} />} label={`Completados (${diagnosticosCompletados.length})`} />
            <TecnicoTabButton active={activeTab === 'ordenes'} onClick={() => setActiveTab('ordenes')} icon={<Wrench size={16} />} label={`Ordenes Activas (${ordenesActivas.length})`} />
            <TecnicoTabButton active={activeTab === 'ordenes_completadas'} onClick={() => setActiveTab('ordenes_completadas')} icon={<Wrench size={16} />} label={`Ordenes Completadas (${ordenesCompletadas.length})`} />
            <TecnicoTabButton active={activeTab === 'repuestos'} onClick={() => setActiveTab('repuestos')} icon={<Package size={16} />} label={`Mis Piezas (${solicitudesRepuestos.length})`} />
          </nav>
        </div>

        {/* VISTAS CONDICIONALES */}
        {activeTab === 'diagnosticos' && (
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-600 text-left">Diagnósticos en revisión</h2>
            <SearchBox
              value={searches.diagnosticosEnRevision}
              onChange={(value) => updateSearch('diagnosticosEnRevision', value)}
              placeholder="Buscar por ID, cliente, equipo o falla..."
            />
            <DiagnosticosTable items={diagnosticosEnRevisionFiltrados} loading={loading} readOnly={false} onOpenDiagnostico={setModalDiagnostico} />
          </section>
        )}

        {activeTab === 'diagnosticos_completados' && (
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-600 text-left">Diagnósticos completados</h2>
            <SearchBox
              value={searches.diagnosticosCompletados}
              onChange={(value) => updateSearch('diagnosticosCompletados', value)}
              placeholder="Buscar por ID, cliente, equipo, falla..."
            />
            <DiagnosticosTable items={diagnosticosCompletadosFiltrados} loading={loading} readOnly onOpenDiagnostico={setModalDiagnostico} />
          </section>
        )}

        {activeTab === 'ordenes' && (
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-600 text-left">Órdenes de reparación activas</h2>
            <SearchBox
              value={searches.ordenesActivas}
              onChange={(value) => updateSearch('ordenesActivas', value)}
              placeholder="Buscar por orden, cliente, equipo..."
            />
            <OrdenesGrid items={ordenesActivasFiltradas} loading={loading} onEstadoChange={handleEstadoChange} onSolicitarPieza={setModalRepuesto} />
          </section>
        )}

        {activeTab === 'ordenes_completadas' && (
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-600 text-left">Órdenes de reparación finalizadas</h2>
            <SearchBox
              value={searches.ordenesCompletadas}
              onChange={(value) => updateSearch('ordenesCompletadas', value)}
              placeholder="Buscar por orden, cliente, equipo..."
            />
            <OrdenesGrid items={ordenesCompletadasFiltradas} loading={loading} completed onEstadoChange={handleEstadoChange} onSolicitarPieza={setModalRepuesto} />
          </section>
        )}

        {activeTab === 'repuestos' && (
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-600 text-left">Historial de piezas y repuestos</h2>
            <SearchBox
              value={searches.repuestos}
              onChange={(value) => updateSearch('repuestos', value)}
              placeholder="Buscar por orden o pieza..."
            />
            <RepuestosTable solicitudes={solicitudesRepuestosFiltradas} loading={loading} />
          </section>
        )}

        {/* MODALES */}
        {modalRepuesto && (
          <SolicitarRepuestoModal
            orden={modalRepuesto}
            repuestos={repuestosCatalogo}
            onClose={() => setModalRepuesto(null)}
            onSubmit={handleSolicitarRepuesto}
          />
        )}
        {modalDiagnostico && (
          <DiagnosticoModal
            orden={modalDiagnostico}
            readOnly={modalDiagnostico.readOnly}
            onClose={() => setModalDiagnostico(null)}
            onSubmit={actions.guardarDiagnostico}
          />
        )}
        {modalCierre && (
          <CierreOrdenModal
            orden={modalCierre.orden}
            estado={modalCierre.estado}
            onClose={() => setModalCierre(null)}
            onSubmit={handleCerrarOrden}
          />
        )}
      </main>
    </div>
  );
};

export default TecnicoDashboard;
