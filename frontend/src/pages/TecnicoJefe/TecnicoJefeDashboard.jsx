import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { diagnosticoService } from '../../services/JefeTecnico/DiagnosticoService';
import { ordenesService } from '../../services/secretaria/ordenesService';
import { repuestoService } from '../../services/secretaria/repuestosService';
import { createNotificationsSocket } from '../../services/notificationsSocket';
import { buildAsignacionColumns, buildCorreccionesColumns, buildRepuestosColumns } from '../../components/TecnicoJefe/columns';
import { DashboardHeader, NotificationTray } from '../../components/TecnicoJefe/components';
import { TAB_ALERTAS, TAB_CORRECCIONES, TAB_DIAGNOSTICOS, TAB_ORDENES, TAB_REPUESTOS } from '../../utils/jefeTecnicoConstants';
import {
  getCorreccionId,
  getCorreccionTipo,
  getData,
  getEquipo,
  getMinutosDesdeUltimoAvance,
  getRowKey,
  getTecnicoId,
} from '../../utils/jefeTecnicoUtils';
import {
  AsignacionesRecientes,
  CorreccionesSearch,
  JefeTecnicoIntro,
  JefeTecnicoMessages,
  JefeTecnicoStats,
  JefeTecnicoTablePanel,
  JefeTecnicoTabs,
} from './sections/JefeTecnicoSections';
import { JefeTecnicoDashboardModals } from './sections/JefeTecnicoDashboardModals';

const JefeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [diagnosticosPendientes, setDiagnosticosPendientes] = useState([]);
  const [ordenesAprobadas, setOrdenesAprobadas] = useState([]);
  const [repuestosPendientes, setRepuestosPendientes] = useState([]);
  const [correcciones, setCorrecciones] = useState({ diagnosticos: [], ordenes: [], repuestos: [] });
  const [repuestosCatalogo, setRepuestosCatalogo] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [activeTab, setActiveTab] = useState(TAB_DIAGNOSTICOS);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState({});
  const [asignacionError, setAsignacionError] = useState('');
  const [asignacionOk, setAsignacionOk] = useState('');
  const [repuestoDecisionError, setRepuestoDecisionError] = useState('');
  const [repuestoDecisionOk, setRepuestoDecisionOk] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [detalles, setDetalles] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showHelp] = useState(false);
  const [searchTermCorrecciones, setSearchTermCorrecciones] = useState('');

  const rolNormalizado = String(user?.rol || '').toLowerCase();
  const esJefeTecnico = rolNormalizado.includes('jefe');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [diagRes, ordenesRes, repuestosRes, tecRes, correccionesRes, repuestosCatalogoRes] = await Promise.all([
        diagnosticoService.getPendientes(),
        ordenesService.getAprobadas(),
        repuestoService.getPendientesAprobacion(),
        diagnosticoService.getTecnicos(),
        diagnosticoService.getCorrecciones(),
        diagnosticoService.getRepuestos(),
      ]);

      setDiagnosticosPendientes(getData(diagRes));
      setOrdenesAprobadas(getData(ordenesRes));
      setRepuestosPendientes(getData(repuestosRes));
      setTecnicos(getData(tecRes));
      setCorrecciones(correccionesRes?.data?.data || { diagnosticos: [], ordenes: [], repuestos: [] });
      setRepuestosCatalogo(getData(repuestosCatalogoRes));
    } catch (error) {
      console.error('Error en la carga de datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetalles = async (item) => {
    setLoadingDetalles(true);
    try {
      const response = item.id_orden
        ? await diagnosticoService.getOrdenById(item.id_orden)
        : await diagnosticoService.getById(item.id_diagnostico);

      setDetalles(response.data?.data);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      setLoadingDetalles(false);
    }
  };

  useEffect(() => {
    if (user && !esJefeTecnico) {
      navigate('/');
    }
  }, [user, esJefeTecnico, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!esJefeTecnico) return undefined;

    const socket = createNotificationsSocket();
    if (!socket) return undefined;

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('notificacion', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 25));
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, [esJefeTecnico]);

  useEffect(() => {
    if (!selectedItem || selectedItem.id_detalle_repuesto) return;

    const id = selectedItem.id_diagnostico || selectedItem.id_orden;
    if (id) fetchDetalles(selectedItem);
  }, [selectedItem]);

  const correccionesData = useMemo(() => [
    ...(correcciones.diagnosticos || []).map((item) => ({ ...item, __tipo: 'diagnostico' })),
    ...(correcciones.ordenes || []).map((item) => ({ ...item, __tipo: 'orden' })),
    ...(correcciones.repuestos || []).map((item) => ({ ...item, __tipo: 'repuesto' })),
  ], [correcciones]);

  const correccionesFiltradas = useMemo(() => {
    const limiteMinutos = 60;

    return correccionesData.filter((row) => {
      if (!getTecnicoId(row)) return false;

      const minutosTranscurridos = getMinutosDesdeUltimoAvance(row);
      if (minutosTranscurridos !== null && minutosTranscurridos >= limiteMinutos) return false;
      if (!searchTermCorrecciones) return true;

      const term = searchTermCorrecciones.toLowerCase();
      const tipo = getCorreccionTipo(row);
      const id = String(getCorreccionId(row));
      const tecnicoNombre = (row.tecnico?.nombre || row.orden?.tecnico?.nombre || row.diagnostico?.tecnico?.nombre || '').toLowerCase();
      const infoEquipo = getEquipo(row);
      const equipoNombre = (infoEquipo?.descripcion || infoEquipo?.marca || '').toLowerCase();

      return id.includes(term) || tipo.toLowerCase().includes(term) || tecnicoNombre.includes(term) || equipoNombre.includes(term);
    });
  }, [correccionesData, searchTermCorrecciones]);

  const puedeEditar = (row) => {
    if (!getTecnicoId(row)) return true;
    const minutos = getMinutosDesdeUltimoAvance(row);
    return minutos === null || minutos < 60;
  };

  const getTecnicoDisplay = (id) => {
    const tecnico = tecnicos.find((t) => String(t.id_tecnico) === String(id));
    if (!tecnico) return 'Seleccionar tecnico...';
    return `${tecnico.nombre} - ${tecnico.especialidad || 'GENERAL'}`;
  };

  const getTecnicoNombre = (id) => {
    const tecnico = tecnicos.find((t) => String(t.id_tecnico) === String(id));
    return tecnico?.nombre || 'el tecnico seleccionado';
  };

  const handleTecnicoChange = (row, value) => {
    setAsignacionError('');
    setAsignacionOk('');
    setTecnicosSeleccionados((prev) => ({
      ...prev,
      [getRowKey(row)]: value,
    }));
  };

  const handleSaveAsignacion = async (row) => {
    const id = row.id_diagnostico || row.id_orden;
    const idTecnico = tecnicosSeleccionados[getRowKey(row)] || getTecnicoId(row);
    if (!id || !idTecnico || savingId) return;

    const tipo = row.id_orden ? 'orden' : 'diagnostico';
    const tecnicoNombre = getTecnicoNombre(idTecnico);
    const yaAsignado = Boolean(getTecnicoId(row));
    const mensaje = yaAsignado
      ? `Esta ${tipo} ya tiene un tecnico asignado. Deseas cambiarla a ${tecnicoNombre}?`
      : `Deseas asignar esta ${tipo} a ${tecnicoNombre}?`;

    if (!window.confirm(mensaje)) return;

    setSavingId(getRowKey(row));
    setAsignacionError('');
    setAsignacionOk('');
    try {
      if (row.id_diagnostico) {
        await diagnosticoService.asignar(row.id_diagnostico, idTecnico);
      } else {
        await ordenesService.asignarOrden(row.id_orden, idTecnico);
      }

      await fetchData();
      setTecnicosSeleccionados((prev) => {
        const siguiente = { ...prev };
        delete siguiente[getRowKey(row)];
        return siguiente;
      });
      setAsignacionOk(`${tipo === 'orden' ? 'Orden' : 'Diagnostico'} #${id} asignado a ${tecnicoNombre}.`);
    } catch (error) {
      console.error('Error al guardar asignacion:', error);
      setAsignacionError(error?.response?.data?.error || error?.response?.data?.details || 'No se pudo guardar la asignacion.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDecisionRepuesto = async (solicitud, accion) => {
    const id = solicitud.id_detalle_repuesto;
    if (!id || savingId) return;

    const texto = accion === 'aprobar' ? 'aprobar' : 'rechazar';
    const repuesto = solicitud.repuesto?.nombre || solicitud.pieza_solicitada || 'pieza solicitada';
    const cantidad = solicitud.cantidad_usada || 1;
    if (!window.confirm(`Deseas ${texto} ${cantidad} unidad(es) de ${repuesto} para la solicitud #${id}?`)) return;

    setSavingId(`repuesto-${id}`);
    setRepuestoDecisionError('');
    setRepuestoDecisionOk('');
    try {
      if (accion === 'aprobar') {
        await repuestoService.aprobar(id);
      } else {
        await repuestoService.rechazar(id);
      }
      await fetchData();
      setRepuestoDecisionOk(`Solicitud #${id} ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente.`);
    } catch (error) {
      console.error(`Error al ${texto} repuesto:`, error);
      setRepuestoDecisionError(error?.response?.data?.error || error?.response?.data?.details || `No se pudo ${texto} el repuesto.`);
    } finally {
      setSavingId(null);
    }
  };

  const openEditModal = (row) => {
    const tipo = getCorreccionTipo(row);
    setEditItem(row);
    setEditError('');

    if (tipo === 'diagnostico') {
      setEditForm({
        tecnico_id: getTecnicoId(row) || '',
        prioridad: row.prioridad || 'Normal',
        estado_del_diagnostico: row.estado_del_diagnostico || 'EN_REVISION',
        Estado_aprobacion: row.Estado_aprobacion || 'Pendiente',
      });
    } else if (tipo === 'orden') {
      setEditForm({
        tecnico_id: getTecnicoId(row) || '',
        prioridad: row.prioridad || row.diagnostico?.prioridad || 'Normal',
        estado: row.estado || 'PENDIENTE',
      });
    } else {
      setEditForm({
        repuesto_id: row.repuesto_id || '',
        pieza_solicitada: row.pieza_solicitada || '',
        cantidad_usada: row.cantidad_usada || 1,
        estado_aprobacion: row.estado_aprobacion || 'APROBADO',
      });
    }

    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditItem(null);
    setEditForm({});
    setEditError('');
  };

  const handleSaveCorreccion = async () => {
    if (!editItem || savingId) return;

    const tipo = getCorreccionTipo(editItem);
    const id = getCorreccionId(editItem);
    setSavingId(`correccion-${tipo}-${id}`);
    setEditError('');

    try {
      if (tipo === 'diagnostico') {
        await diagnosticoService.corregirDiagnostico(id, editForm);
      } else if (tipo === 'orden') {
        await diagnosticoService.corregirOrden(id, editForm);
      } else {
        await diagnosticoService.corregirRepuesto(id, editForm);
      }

      await fetchData();
      closeEditModal();
    } catch (error) {
      setEditError(error?.response?.data?.error || 'No se pudo guardar la correccion.');
    } finally {
      setSavingId(null);
    }
  };

  const alertasRetraso = useMemo(() => {
    const items = [...diagnosticosPendientes, ...ordenesAprobadas];
    return items.filter((item) => {
      const estado = String(item.estado_del_diagnostico || item.estado || '').toUpperCase();
      const minutos = getMinutosDesdeUltimoAvance(item);
      return minutos !== null && minutos > 4320 && !['COMPLETADO', 'FINALIZADO', 'RECHAZADO'].includes(estado);
    });
  }, [diagnosticosPendientes, ordenesAprobadas]);

  const asignacionesRecientes = useMemo(() => {
    const diagnosticos = diagnosticosPendientes.filter((d) => getTecnicoId(d) && puedeEditar(d));
    const ordenes = ordenesAprobadas.filter((o) => getTecnicoId(o) && puedeEditar(o));
    return [...diagnosticos, ...ordenes];
  }, [diagnosticosPendientes, ordenesAprobadas]);

  const asignacionColumns = buildAsignacionColumns({
    tecnicos,
    savingId,
    tecnicosSeleccionados,
    puedeEditar,
    getTecnicoDisplay,
    onTecnicoChange: handleTecnicoChange,
    onSaveAsignacion: handleSaveAsignacion,
    onEdit: openEditModal,
    onView: (row) => {
      setSelectedItem(row);
      setShowModal(true);
    },
  });

  const repuestosColumns = buildRepuestosColumns({
    savingId,
    onDecisionRepuesto: handleDecisionRepuesto,
    onViewDetalle: (row) => {
      setSelectedItem(row);
      setDetalles(row);
      setShowModal(true);
    },
  });

  const correccionesColumns = buildCorreccionesColumns({
    onEdit: openEditModal,
  });

  const mainData =
    activeTab === TAB_DIAGNOSTICOS
      ? diagnosticosPendientes.filter((item) => !getTecnicoId(item))
      : activeTab === TAB_ORDENES
        ? ordenesAprobadas.filter((item) => !getTecnicoId(item))
        : activeTab === TAB_REPUESTOS
          ? repuestosPendientes
          : activeTab === TAB_CORRECCIONES
            ? correccionesFiltradas
            : alertasRetraso;

  const mainColumns = activeTab === TAB_REPUESTOS
    ? repuestosColumns
    : activeTab === TAB_CORRECCIONES
      ? correccionesColumns
      : asignacionColumns;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
      <DashboardHeader
        user={user}
        logout={logout}
        socketConnected={socketConnected}
        notificationsCount={notifications.length}
        onToggleNotifications={() => setShowNotifications((value) => !value)}
      />

      {showNotifications && (
        <NotificationTray
          notifications={notifications}
          connected={socketConnected}
          onClear={() => setNotifications([])}
        />
      )}

      <main className="flex-1 container mx-auto p-8">
        <JefeTecnicoIntro showHelp={showHelp} />

        <JefeTecnicoStats
          diagnosticosPendientes={diagnosticosPendientes}
          ordenesAprobadas={ordenesAprobadas}
          repuestosPendientes={repuestosPendientes}
          alertasRetraso={alertasRetraso}
        />

        <AsignacionesRecientes
          asignacionesRecientes={asignacionesRecientes}
          asignacionColumns={asignacionColumns}
        />

        <JefeTecnicoTabs
          activeTab={activeTab}
          alertasRetraso={alertasRetraso}
          correccionesFiltradas={correccionesFiltradas}
          onChange={setActiveTab}
        />

        <JefeTecnicoMessages
          asignacionError={asignacionError}
          asignacionOk={asignacionOk}
          repuestoDecisionError={repuestoDecisionError}
          repuestoDecisionOk={repuestoDecisionOk}
        />

        <CorreccionesSearch
          activeTab={activeTab}
          searchTerm={searchTermCorrecciones}
          onSearch={setSearchTermCorrecciones}
        />

        <JefeTecnicoTablePanel
          loading={loading}
          columns={mainColumns}
          data={mainData}
        />
      </main>

      <JefeTecnicoDashboardModals
        showModal={showModal}
        detalles={detalles}
        loadingDetalles={loadingDetalles}
        onCloseDetail={() => {
          setShowModal(false);
          setDetalles(null);
          setSelectedItem(null);
        }}
        showEditModal={showEditModal}
        editItem={editItem}
        editForm={editForm}
        editError={editError}
        tecnicos={tecnicos}
        repuestosCatalogo={repuestosCatalogo}
        savingId={savingId}
        onCloseEdit={closeEditModal}
        onFieldChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
        onSave={handleSaveCorreccion}
      />
    </div>
  );
};

export default JefeDashboard;
