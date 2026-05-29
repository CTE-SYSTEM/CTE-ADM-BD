// frontend/src/pages/TecnicoJefe/TecnicoJefeDashboard.jsx

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  History,
  Package,
  Search,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import PageHelp from '../../components/PageHelp';
import { diagnosticoService } from '../../services/JefeTecnico/DiagnosticoService';
import { ordenesService } from '../../services/secretaria/ordenesService';
import { repuestoService } from '../../services/secretaria/repuestosService';
import { createNotificationsSocket } from '../../services/notificationsSocket';
import Table from '../../components/Table';
import { buildAsignacionColumns, buildCorreccionesColumns, buildRepuestosColumns } from './columns';
import { CorrectionModal, DashboardHeader, DetailModal, NotificationTray, StatCard, TabButton } from './components';
import { TAB_ALERTAS, TAB_CORRECCIONES, TAB_DIAGNOSTICOS, TAB_ORDENES, TAB_REPUESTOS } from './constants';
import { 
  getCorreccionId, 
  getCorreccionTipo, 
  getData, 
  getMinutosDesdeUltimoAvance, 
  getRowKey, 
  getTecnicoId,
  getEquipo 
} from './utils';

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
  const [showHelp, setShowHelp] = useState(false);
  
  // Buscador de la pestaña de correcciones
  const [searchTermCorrecciones, setSearchTermCorrecciones] = useState('');

  const rolNormalizado = String(user?.rol || '').toLowerCase();
  const esJefeTecnico = rolNormalizado.includes('jefe');

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

  const correccionesData = useMemo(() => [
    ...(correcciones.diagnosticos || []).map((item) => ({ ...item, __tipo: 'diagnostico' })),
    ...(correcciones.ordenes || []).map((item) => ({ ...item, __tipo: 'orden' })),
    ...(correcciones.repuestos || []).map((item) => ({ ...item, __tipo: 'repuesto' })),
  ], [correcciones]);

  // 👉 LÓGICA DE FILTRADO COMPLETA (Filtra "Sin Técnico", controla el trigger de 1 hora y busca)
  const correccionesFiltradas = useMemo(() => {
    const LIMITE_MINUTOS = 60; // 1 Hora exacta de gracia

    return correccionesData.filter((row) => {
      // REGLA 1: Excluir estrictamente si no tiene técnico asignado (Evita falsos positivos en la lista)
      if (!getTecnicoId(row)) return false; 

      // REGLA 2: Trigger de tiempo límite (Máximo 60 minutos)
      const minutosTranscurridos = getMinutosDesdeUltimoAvance(row);
      if (minutosTranscurridos !== null && minutosTranscurridos >= LIMITE_MINUTOS) {
        return false; 
      }

      // REGLA 3: Buscador de texto
      if (!searchTermCorrecciones) return true;

      const term = searchTermCorrecciones.toLowerCase();
      const tipo = getCorreccionTipo(row);
      const id = String(getCorreccionId(row));
      const tecnicoNombre = (row.tecnico?.nombre || row.orden?.tecnico?.nombre || row.diagnostico?.tecnico?.nombre || '').toLowerCase();
      
      // Obtener la descripción del equipo usando tu helper getEquipo
      const infoEquipo = getEquipo(row);
      const equipoNombre = (infoEquipo?.descripcion || infoEquipo?.marca || '').toLowerCase();
      
      return (
        id.includes(term) || 
        tipo.toLowerCase().includes(term) || 
        tecnicoNombre.includes(term) || 
        equipoNombre.includes(term)
      );
    });
  }, [correccionesData, searchTermCorrecciones]);

  // Modificada para usar los minutos actuales de margen
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
    } catch (error) {
      console.error('Error al guardar asignacion:', error);
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
    try {
      if (accion === 'aprobar') {
        await repuestoService.aprobar(id);
      } else {
        await repuestoService.rechazar(id);
      }
      await fetchData();
    } catch (error) {
      console.error(`Error al ${texto} repuesto:`, error);
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

  const handleEditField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
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

  // Mantenemos la lógica de alertas viejas (+72 horas = 4320 minutos)
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
    onView: (row) => {
      setSelectedItem(row);
      setShowModal(true);
    },
  });

  const repuestosColumns = buildRepuestosColumns({
    savingId,
    onDecisionRepuesto: handleDecisionRepuesto,
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
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Centro de control tecnico</h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">Asignaciones, aprobaciones, alertas y correcciones del taller.</p>
          </div>
        </div>
        <PageHelp />

        {showHelp && (
          <section className="mb-8 rounded-2xl bg-slate-950 p-6 text-white shadow-sm space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold">Mini tutorial del jefe tecnico</h2>
              <p className="mt-1 text-sm text-slate-300">
                Usa este panel para repartir trabajo, aprobar repuestos y corregir avances antes de que se acumulen retrasos.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm font-semibold text-blue-400">1. Revisa pendientes</p>
                <p className="mt-1 text-xs text-slate-400">Las tarjetas muestran diagnosticos, ordenes, repuestos y alertas abiertas.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm font-semibold text-indigo-400">2. Asigna tecnicos</p>
                <p className="mt-1 text-xs text-slate-400">En diagnosticos y ordenes selecciona tecnico y guarda la asignacion.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm font-semibold text-emerald-400">3. Aprueba repuestos</p>
                <p className="mt-1 text-xs text-slate-400">Valida solicitudes de piezas antes de que pasen a facturacion.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm font-semibold text-amber-400">4. Corrige a tiempo</p>
                <p className="mt-1 text-xs text-slate-400">La pestana de correcciones permite ajustar tecnico, estado, prioridad o pieza.</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<Search size={22} />} label="Diag. sin asignar" value={diagnosticosPendientes.filter((d) => !getTecnicoId(d)).length} color="blue" />
          <StatCard icon={<Package size={22} />} label="Ordenes por aprobar" value={ordenesAprobadas.filter((o) => !getTecnicoId(o)).length} color="amber" />
          <StatCard icon={<ShieldCheck size={22} />} label="Repuestos por aprobar" value={repuestosPendientes.length} color="emerald" />
          <StatCard icon={<AlertTriangle size={22} />} label="Alertas +72h" value={alertasRetraso.length} color="red" />
        </div>

        {asignacionesRecientes.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 px-4">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <History size={20} />
              </div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Asignaciones recientes (Margen de edición)
              </h2>
            </div>
            <div className="bg-white rounded-[2rem] shadow-xl border-2 border-amber-50 overflow-hidden">
              <Table columns={asignacionColumns} data={asignacionesRecientes} />
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3 mb-8">
          <TabButton active={activeTab === TAB_DIAGNOSTICOS} onClick={() => setActiveTab(TAB_DIAGNOSTICOS)} icon={<Search size={16} />} label="Asignar Diagnosticos" />
          <TabButton active={activeTab === TAB_ORDENES} onClick={() => setActiveTab(TAB_ORDENES)} icon={<Package size={16} />} label="Ordenes por aprobar" />
          <TabButton active={activeTab === TAB_REPUESTOS} onClick={() => setActiveTab(TAB_REPUESTOS)} icon={<ShieldCheck size={16} />} label="Aprobacion de Repuestos" />
          <TabButton active={activeTab === TAB_ALERTAS} onClick={() => setActiveTab(TAB_ALERTAS)} icon={<Bell size={16} />} label={`Alertas (${alertasRetraso.length})`} />
          <TabButton active={activeTab === TAB_CORRECCIONES} onClick={() => setActiveTab(TAB_CORRECCIONES)} icon={<Settings size={16} />} label={`Correcciones (${correccionesFiltradas.length})`} />
        </div>

        {activeTab === TAB_CORRECCIONES && (
          <div className="mb-6 px-4">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar corrección por ID, tipo, técnico o equipo..."
                value={searchTermCorrecciones}
                onChange={(e) => setSearchTermCorrecciones(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all placeholder:font-medium shadow-sm"
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-40 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-black text-slate-300 uppercase text-xs tracking-widest">Cargando...</span>
            </div>
          ) : (
            <Table columns={mainColumns} data={mainData} />
          )}
        </div>
      </main>

      {showModal && (
        <DetailModal
          detalles={detalles}
          loadingDetalles={loadingDetalles}
          onClose={() => {
            setShowModal(false);
            setDetalles(null);
            setSelectedItem(null);
          }}
        />
      )}

      {showEditModal && editItem && (
        <CorrectionModal
          editItem={editItem}
          editForm={editForm}
          editError={editError}
          tecnicos={tecnicos}
          repuestosCatalogo={repuestosCatalogo}
          savingId={savingId}
          onClose={closeEditModal}
          onFieldChange={handleEditField}
          onSave={handleSaveCorreccion}
        />
      )}
    </div>
  );
};
export default JefeDashboard;
