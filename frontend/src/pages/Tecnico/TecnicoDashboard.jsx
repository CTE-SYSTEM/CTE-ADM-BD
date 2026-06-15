import React, { useContext, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import TecnicoHeader from '../../components/Tecnico/TecnicoHeader';
import { useTecnicoDashboard } from '../../hooks/useTecnicoDashboard';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { filterItems } from '../../utils/textFilters';
import { TecnicoDashboardModals } from '../../components/Tecnico/sections/TecnicoDashboardModals';
import { TecnicoIntro, TecnicoStatsGrid, TecnicoTimeFilter } from '../../components/Tecnico/sections/TecnicoOverview';
import { TecnicoTabContent } from '../../components/Tecnico/sections/TecnicoTabContent';
import { TecnicoTabs } from '../../components/Tecnico/sections/TecnicoTabs';

const TecnicoDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('diagnosticos');
  const [modalRepuesto, setModalRepuesto] = useState(null);
  const [modalDiagnostico, setModalDiagnostico] = useState(null);
  const [modalCierre, setModalCierre] = useState(null);
  const [showHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [timeFilter, setTimeFilter] = useState('todos');
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

  const {
    notifications,
    connected: socketConnected,
    clearNotifications,
  } = useRealtimeNotifications({
    enabled: Boolean(user?.username),
    onNotification: () => setShowNotifications(true),
    onRefresh: () => actions.loadTecnicoData(),
    refreshIntervalMs: 0,
  });

  const getDateForItem = (item) => {
    const candidates = [
      'fecha_hora',
      'fecha_ingreso',
      'fecha_finalizacion',
      'fecha_cierre',
      'createdAt',
      'updatedAt',
      'fecha',
    ];

    for (const key of candidates) {
      const value = item[key];
      if (!value) continue;
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }

    return null;
  };

  const filterByTime = (items) => {
    if (timeFilter === 'todos') return items;

    const ahora = new Date();
    return items.filter((item) => {
      const fechaItem = getDateForItem(item);
      if (!fechaItem) return false;

      if (timeFilter === 'hoy') {
        return (
          fechaItem.getDate() === ahora.getDate() &&
          fechaItem.getMonth() === ahora.getMonth() &&
          fechaItem.getFullYear() === ahora.getFullYear()
        );
      }

      if (timeFilter === 'mes') {
        return fechaItem.getMonth() === ahora.getMonth() && fechaItem.getFullYear() === ahora.getFullYear();
      }

      if (timeFilter === 'anio') {
        return fechaItem.getFullYear() === ahora.getFullYear();
      }

      return true;
    });
  };

  const statsCalculadas = useMemo(() => {
    const diagnosticosActivosPeriodo = filterByTime(diagnosticosEnRevision);
    const diagnosticosCompletadosPeriodo = filterByTime(diagnosticosCompletados);
    const ordenesActivasPeriodo = filterByTime(ordenesActivas);
    const ordenesCompletadasPeriodo = filterByTime(ordenesCompletadas);
    const piezasPeriodo = filterByTime(solicitudesRepuestos);
    const diagnosticosTotales = diagnosticosActivosPeriodo.length + diagnosticosCompletadosPeriodo.length;
    const tasaDiagnosticos = diagnosticosTotales
      ? Math.round((diagnosticosCompletadosPeriodo.length / diagnosticosTotales) * 100)
      : 0;

    return {
      enRevisionCount: diagnosticosActivosPeriodo.length,
      completadosCount: diagnosticosCompletadosPeriodo.length,
      ordenesActivasCount: ordenesActivasPeriodo.length,
      ordenesCompletadasCount: ordenesCompletadasPeriodo.length,
      piezasCount: piezasPeriodo.length,
      piezasPendientesCount: piezasPeriodo.filter((pieza) => String(pieza.estado || '').toUpperCase() === 'PENDIENTE').length,
      tasaDiagnosticos,
    };
  }, [timeFilter, diagnosticosEnRevision, diagnosticosCompletados, ordenesActivas, ordenesCompletadas, solicitudesRepuestos]);

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
      item.id,
      item.cliente,
      item.equipo,
      item.falla,
      item.estado,
      item.prioridad,
      item.diagnostico,
      item.resultado_final,
      item.observacion_final,
      ...(item.repuestos_usados || []).flatMap((repuesto) => [
        repuesto.repuesto?.nombre,
        repuesto.pieza_solicitada,
        repuesto.estado_aprobacion,
      ]),
    ]),
    [ordenesCompletadas, searches.ordenesCompletadas],
  );

  const solicitudesRepuestosFiltradas = useMemo(
    () => filterItems(solicitudesRepuestos, searches.repuestos, (item) => [
      item.id,
      item.ordenId,
      item.repuesto,
      item.cantidad,
      item.estado,
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
      <TecnicoHeader
        user={user}
        onLogout={logout}
        socketConnected={socketConnected}
        notificationsCount={notifications.length}
        notifications={notifications}
        showNotifications={showNotifications}
        onToggleNotifications={() => setShowNotifications((value) => !value)}
        onClearNotifications={() => {
          clearNotifications();
          setShowNotifications(false);
        }}
        onCloseNotifications={() => setShowNotifications(false)}
      />

      <main className="mx-auto max-w-[1840px] px-6 py-10">
        <TecnicoIntro showHelp={showHelp} />
        <TecnicoTimeFilter timeFilter={timeFilter} onChange={setTimeFilter} />
        <TecnicoStatsGrid stats={statsCalculadas} />

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div>}

        <TecnicoTabs
          activeTab={activeTab}
          diagnosticosEnRevision={diagnosticosEnRevision}
          diagnosticosCompletados={diagnosticosCompletados}
          ordenesActivas={ordenesActivas}
          ordenesCompletadas={ordenesCompletadas}
          solicitudesRepuestos={solicitudesRepuestos}
          onChange={setActiveTab}
        />

        <TecnicoTabContent
          activeTab={activeTab}
          searches={searches}
          loading={loading}
          diagnosticosEnRevision={diagnosticosEnRevisionFiltrados}
          diagnosticosCompletados={diagnosticosCompletadosFiltrados}
          ordenesActivas={ordenesActivasFiltradas}
          ordenesCompletadas={ordenesCompletadasFiltradas}
          solicitudesRepuestos={solicitudesRepuestosFiltradas}
          onSearch={updateSearch}
          onOpenDiagnostico={setModalDiagnostico}
          onEstadoChange={handleEstadoChange}
          onSolicitarPieza={setModalRepuesto}
        />

        <TecnicoDashboardModals
          modalRepuesto={modalRepuesto}
          modalDiagnostico={modalDiagnostico}
          modalCierre={modalCierre}
          repuestosCatalogo={repuestosCatalogo}
          onCloseRepuesto={() => setModalRepuesto(null)}
          onCloseDiagnostico={() => setModalDiagnostico(null)}
          onCloseCierre={() => setModalCierre(null)}
          onSolicitarRepuesto={handleSolicitarRepuesto}
          onGuardarDiagnostico={actions.guardarDiagnostico}
          onCerrarOrden={handleCerrarOrden}
        />
      </main>
    </div>
  );
};

export default TecnicoDashboard;
