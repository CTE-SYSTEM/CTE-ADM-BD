// frontend/src/pages/TecnicoJefe/TecnicoJefeDashboard.jsx

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Eye,
  History,
  LogOut,
  Package,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { diagnosticoService } from '../../services/JefeTecnico/DiagnosticoService';
import { ordenesService } from '../../services/secretaria/ordenesService';
import { repuestoService } from '../../services/secretaria/repuestosService';
import { createNotificationsSocket } from '../../services/notificationsSocket';
import Table from '../../components/Table';
import { PrioridadBadge } from '../Secretaria/Diagnostico';

const TAB_DIAGNOSTICOS = 'asignar_diagnostico';
const TAB_ORDENES = 'asignar_orden';
const TAB_REPUESTOS = 'repuestos';
const TAB_ALERTAS = 'alertas';
const TAB_CORRECCIONES = 'correcciones';

const DIAGNOSTICO_ESTADOS = ['PENDIENTE', 'INGRESADO', 'EN_REVISION', 'DIAGNOSTICADO', 'COMPLETADO', 'APROBADO', 'RECHAZADO'];
const ORDEN_ESTADOS = ['PENDIENTE', 'APROBADO', 'EN_REPARACION', 'ESPERANDO_PIEZA', 'FINALIZADO', 'IRREPARABLE', 'ENTREGADO'];
const REPUESTO_ESTADOS = ['PENDIENTE', 'APROBADO', 'DENEGADO'];
const PRIORIDADES = ['Normal', 'Alta', 'Urgente'];

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

  const getData = (response) => response?.data?.data || response?.data || [];

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

  const getRowKey = (row) => {
    if (row.id_diagnostico) return `diagnostico-${row.id_diagnostico}`;
    if (row.id_orden) return `orden-${row.id_orden}`;
    return `repuesto-${row.id_detalle_repuesto}`;
  };

  const getTecnicoId = (row) => row.tecnico_id ?? row.id_tecnico ?? row.tecnico?.id_tecnico ?? '';

  const getEquipo = (row) => row.equipo || row.diagnostico?.equipo || row.orden?.diagnostico?.equipo;

  const getCorreccionTipo = (row) => row.__tipo || (row.id_detalle_repuesto ? 'repuesto' : row.id_orden ? 'orden' : 'diagnostico');

  const getCorreccionId = (row) => row.id_diagnostico || row.id_orden || row.id_detalle_repuesto;

  const correccionesData = useMemo(() => [
    ...(correcciones.diagnosticos || []).map((item) => ({ ...item, __tipo: 'diagnostico' })),
    ...(correcciones.ordenes || []).map((item) => ({ ...item, __tipo: 'orden' })),
    ...(correcciones.repuestos || []).map((item) => ({ ...item, __tipo: 'repuesto' })),
  ], [correcciones]);

  const getFechaBase = (row) =>
    row.fecha_asignacion ||
    row.updatedAt ||
    row.fecha_ingreso ||
    row.fecha_hora ||
    row.createdAt ||
    row.diagnostico?.fecha_hora;

  const getHorasDesdeUltimoAvance = (row) => {
    const fechaBase = getFechaBase(row);
    if (!fechaBase) return null;

    const fecha = new Date(fechaBase);
    if (Number.isNaN(fecha.getTime())) return null;

    return (new Date() - fecha) / (1000 * 60 * 60);
  };

  const puedeEditar = (row) => {
    const horas = getHorasDesdeUltimoAvance(row);
    return horas === null || horas < 24 || !getTecnicoId(row);
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

  const alertasRetraso = useMemo(() => {
    const items = [...diagnosticosPendientes, ...ordenesAprobadas];
    return items.filter((item) => {
      const estado = String(item.estado_del_diagnostico || item.estado || '').toUpperCase();
      const horas = getHorasDesdeUltimoAvance(item);
      return horas !== null && horas > 72 && !['COMPLETADO', 'FINALIZADO', 'RECHAZADO'].includes(estado);
    });
  }, [diagnosticosPendientes, ordenesAprobadas]);

  const asignacionesRecientes = useMemo(() => {
    const diagnosticos = diagnosticosPendientes.filter((d) => getTecnicoId(d) && puedeEditar(d));
    const ordenes = ordenesAprobadas.filter((o) => getTecnicoId(o) && puedeEditar(o));
    return [...diagnosticos, ...ordenes];
  }, [diagnosticosPendientes, ordenesAprobadas]);

  const asignacionColumns = [
    {
      header: 'Referencia',
      accessor: 'id',
      render: (row) => (
        <div className="py-2">
          <span className="font-black text-indigo-600 block text-base leading-none">
            #{row.id_diagnostico || row.id_orden}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            {row.id_orden ? 'Orden aprobada' : 'Diagnostico'}
          </span>
        </div>
      ),
    },
    {
      header: 'Equipo / Cliente',
      accessor: 'equipo',
      render: (row) => {
        const equipo = getEquipo(row);
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 uppercase text-xs">
              {equipo?.marca || 'S/M'} {equipo?.modelo || 'S/M'}
            </span>
            <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-tighter">
              {equipo?.cliente?.nombre || 'Particular'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Tecnico y Especialidad',
      accessor: 'asignar',
      render: (row) => {
        const isSaving = savingId === getRowKey(row);
        const tecnicoId = tecnicosSeleccionados[getRowKey(row)] ?? getTecnicoId(row);
        const edicionPermitida = puedeEditar(row);

        return (
          <div className="relative flex items-center gap-3 min-w-[280px]">
            <select
              value={tecnicoId}
              disabled={!edicionPermitida || isSaving}
              title={tecnicoId ? getTecnicoDisplay(tecnicoId) : 'Seleccionar tecnico'}
              className={`flex-1 px-3 py-2.5 bg-white border-2 ${isSaving ? 'border-amber-400' : 'border-slate-100'} rounded-xl text-[10px] font-bold uppercase outline-none focus:border-indigo-500 transition-all ${edicionPermitida ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
              onChange={(event) => handleTecnicoChange(row, event.target.value)}
            >
              <option value="">Seleccionar tecnico...</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id_tecnico} value={tecnico.id_tecnico}>
                  {tecnico.nombre} - {tecnico.especialidad || 'GENERAL'}
                </option>
              ))}
            </select>

            <button
              className="group relative p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm border border-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!edicionPermitida || !tecnicoId || isSaving}
              onClick={() => handleSaveAsignacion(row)}
              title="Guardar asignacion"
            >
              {isSaving ? <Settings size={18} className="animate-spin" /> : <Save size={18} />}
            </button>

            <div className="w-6 flex justify-center">
              {getTecnicoId(row) && !isSaving && <CheckCircle2 size={20} className="text-emerald-500" />}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Prioridad',
      accessor: 'prioridad',
      render: (row) => <PrioridadBadge prioridad={row.prioridad || 'NORMAL'} />,
    },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedItem(row);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-black text-[10px] uppercase"
        >
          <Eye size={14} /> Ver
        </button>
      ),
    },
  ];

  const repuestosColumns = [
    {
      header: 'Referencia de Orden',
      accessor: 'orden',
      render: (row) => (
        <div className="py-2">
          <span className="font-black text-indigo-600 block text-base leading-none">
            #{row.orden_id || row.orden?.id_orden}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            Solicitud #{row.id_detalle_repuesto}
          </span>
        </div>
      ),
    },
    {
      header: 'Repuesto Solicitado',
      accessor: 'repuesto',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 uppercase text-xs">
            {row.repuesto?.nombre || row.pieza_solicitada || 'Pieza pendiente de registrar'}
          </span>
          <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-tighter">
            {row.repuesto?.descripcion || (row.repuesto_id ? 'Sin descripcion' : 'No registrada en inventario')}
          </span>
        </div>
      ),
    },
    {
      header: 'Cantidad',
      accessor: 'cantidad_usada',
      render: (row) => <span className="font-black text-slate-700">{row.cantidad_usada || 1}</span>,
    },
    {
      header: 'Tecnico que solicita',
      accessor: 'tecnico',
      render: (row) => {
        const tecnico = row.orden?.tecnico || row.orden?.diagnostico?.tecnico;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 uppercase text-xs">
              {tecnico?.nombre || 'Sin tecnico'}
            </span>
            <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-tighter">
              {tecnico?.especialidad || 'GENERAL'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => {
        const isSaving = savingId === `repuesto-${row.id_detalle_repuesto}`;
        return (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDecisionRepuesto(row, 'aprobar')}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-black text-[10px] uppercase disabled:opacity-50"
            >
              {isSaving ? <Settings size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Aprobar
            </button>
            <button
              onClick={() => handleDecisionRepuesto(row, 'rechazar')}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase disabled:opacity-50"
            >
              <XCircle size={14} /> Rechazar
            </button>
          </div>
        );
      },
    },
  ];

  const correccionesColumns = [
    {
      header: 'Referencia',
      accessor: 'referencia',
      render: (row) => {
        const tipo = getCorreccionTipo(row);
        return (
          <div className="py-2">
            <span className="font-black text-indigo-600 block text-base leading-none">#{getCorreccionId(row)}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              {tipo === 'diagnostico' ? 'Diagnostico asignado' : tipo === 'orden' ? 'Orden asignada' : 'Repuesto aprobado'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Equipo / Cliente',
      accessor: 'equipo',
      render: (row) => {
        const equipo = getEquipo(row);
        const tipo = getCorreccionTipo(row);
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 uppercase text-xs">
              {tipo === 'repuesto'
                ? row.repuesto?.nombre || row.pieza_solicitada || 'Pieza sin nombre'
                : `${equipo?.marca || 'S/M'} ${equipo?.modelo || 'S/M'}`}
            </span>
            <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-tighter">
              {equipo?.cliente?.nombre || 'Particular'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Tecnico / Estado',
      accessor: 'estado',
      render: (row) => {
        const tipo = getCorreccionTipo(row);
        const tecnico = row.tecnico || row.orden?.tecnico || row.diagnostico?.tecnico || row.orden?.diagnostico?.tecnico;
        const estado = tipo === 'diagnostico'
          ? row.estado_del_diagnostico
          : tipo === 'orden'
            ? row.estado
            : row.estado_aprobacion;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 uppercase text-xs">{tecnico?.nombre || 'Sin tecnico'}</span>
            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">{estado || 'Sin estado'}</span>
          </div>
        );
      },
    },
    {
      header: 'Prioridad / Cantidad',
      accessor: 'prioridad',
      render: (row) => (
        getCorreccionTipo(row) === 'repuesto'
          ? <span className="font-black text-slate-700">{row.cantidad_usada || 1}</span>
          : <PrioridadBadge prioridad={row.prioridad || row.diagnostico?.prioridad || 'NORMAL'} />
      ),
    },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <button
          onClick={() => openEditModal(row)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-black text-[10px] uppercase"
        >
          <Settings size={14} /> Modificar
        </button>
      ),
    },
  ];

  const mainData =
    activeTab === TAB_DIAGNOSTICOS
      ? diagnosticosPendientes.filter((item) => !getTecnicoId(item))
      : activeTab === TAB_ORDENES
        ? ordenesAprobadas.filter((item) => !getTecnicoId(item))
        : activeTab === TAB_REPUESTOS
          ? repuestosPendientes
          : activeTab === TAB_CORRECCIONES
            ? correccionesData
            : alertasRetraso;

  const mainColumns = activeTab === TAB_REPUESTOS
    ? repuestosColumns
    : activeTab === TAB_CORRECCIONES
      ? correccionesColumns
      : asignacionColumns;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
      <header className="bg-[#0f172a] text-white p-6 shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-500/20">
              CTE
            </div>
            <div>
              <h1 className="text-xl text-white italic uppercase tracking-tight">
                Panel <span className="text-indigo-400">Jefe Tecnico</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setShowNotifications((value) => !value)}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/50 text-slate-200 hover:border-indigo-400 hover:text-white"
              title={socketConnected ? 'Notificaciones conectadas' : 'Notificaciones desconectadas'}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {notifications.length}
                </span>
              )}
              <span className={`absolute bottom-1 right-1 h-2 w-2 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            </button>

            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">
                Usuario Conectado
              </p>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-white uppercase tracking-tight">
                  {user?.nombre || user?.username || 'Tecnico Jefe'}
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-indigo-500/30">
                  {user?.rol || 'Jefe'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="group flex items-center gap-3 bg-slate-800/50 hover:bg-red-500/10 p-2 pr-4 rounded-2xl transition-all border border-slate-700 hover:border-red-500/50"
            >
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center group-hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-500">
                Salir
              </span>
            </button>
          </div>
        </div>
      </header>

      {showNotifications && (
        <NotificationTray
          notifications={notifications}
          connected={socketConnected}
          onClear={() => setNotifications([])}
        />
      )}

      <main className="flex-1 container mx-auto p-8">
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
                Asignaciones recientes (24h)
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
          <TabButton active={activeTab === TAB_CORRECCIONES} onClick={() => setActiveTab(TAB_CORRECCIONES)} icon={<Settings size={16} />} label={`Correcciones (${correccionesData.length})`} />
        </div>

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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ficha Tecnica</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setDetalles(null);
                  setSelectedItem(null);
                }}
                className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              {loadingDetalles ? (
                <div className="py-20 text-center">Cargando detalles...</div>
              ) : detalles ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailBox label="Equipo" value={`${getEquipo(detalles)?.marca || 'S/M'} ${getEquipo(detalles)?.modelo || 'S/M'}`} />
                    <DetailBox label="Cliente" value={getEquipo(detalles)?.cliente?.nombre} />
                  </div>
                  <DetailBox label="Falla Reportada" value={detalles.falla_reportada || detalles.diagnostico?.falla_reportada} isFull highlight />
                  <DetailBox label="Diagnostico Realizado" value={detalles.diagnostico_real || detalles.diagnostico?.diagnostico_real || 'Aun no se ha realizado diagnostico'} isFull />
                </>
              ) : (
                <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs">
                  No se encontraron detalles.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && editItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                  Correccion #{getCorreccionId(editItem)}
                </p>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                  {getCorreccionTipo(editItem) === 'diagnostico'
                    ? 'Modificar diagnostico'
                    : getCorreccionTipo(editItem) === 'orden'
                      ? 'Modificar orden'
                      : 'Modificar repuesto'}
                </h2>
              </div>
              <button onClick={closeEditModal} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-5">
              {getCorreccionTipo(editItem) !== 'repuesto' ? (
                <>
                  <FormSelect label="Tecnico asignado" value={editForm.tecnico_id || ''} onChange={(value) => handleEditField('tecnico_id', value)}>
                    <option value="">Sin tecnico</option>
                    {tecnicos.map((tecnico) => (
                      <option key={tecnico.id_tecnico} value={tecnico.id_tecnico}>
                        {tecnico.nombre} - {tecnico.especialidad || 'GENERAL'}
                      </option>
                    ))}
                  </FormSelect>
                  <FormSelect label="Prioridad" value={editForm.prioridad || 'Normal'} onChange={(value) => handleEditField('prioridad', value)}>
                    {PRIORIDADES.map((prioridad) => <option key={prioridad} value={prioridad}>{prioridad}</option>)}
                  </FormSelect>
                  {getCorreccionTipo(editItem) === 'diagnostico' ? (
                    <>
                      <FormSelect label="Estado del diagnostico" value={editForm.estado_del_diagnostico || 'EN_REVISION'} onChange={(value) => handleEditField('estado_del_diagnostico', value)}>
                        {DIAGNOSTICO_ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                      </FormSelect>
                      <FormSelect label="Estado de aprobacion" value={editForm.Estado_aprobacion || 'Pendiente'} onChange={(value) => handleEditField('Estado_aprobacion', value)}>
                        {['Pendiente', 'Aprobado', 'Rechazado'].map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                      </FormSelect>
                    </>
                  ) : (
                    <FormSelect label="Estado de la orden" value={editForm.estado || 'PENDIENTE'} onChange={(value) => handleEditField('estado', value)}>
                      {ORDEN_ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                    </FormSelect>
                  )}
                </>
              ) : (
                <>
                  <FormSelect label="Repuesto de inventario" value={editForm.repuesto_id || ''} onChange={(value) => handleEditField('repuesto_id', value)}>
                    <option value="">Sin repuesto asociado</option>
                    {repuestosCatalogo.map((repuesto) => (
                      <option key={repuesto.id_repuesto} value={repuesto.id_repuesto}>
                        {repuesto.nombre || `Repuesto #${repuesto.id_repuesto}`}
                      </option>
                    ))}
                  </FormSelect>
                  <FormInput label="Pieza solicitada" value={editForm.pieza_solicitada || ''} onChange={(value) => handleEditField('pieza_solicitada', value)} />
                  <FormInput label="Cantidad" type="number" min="1" value={editForm.cantidad_usada || 1} onChange={(value) => handleEditField('cantidad_usada', value)} />
                  <FormSelect label="Estado de aprobacion" value={editForm.estado_aprobacion || 'APROBADO'} onChange={(value) => handleEditField('estado_aprobacion', value)}>
                    {REPUESTO_ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                  </FormSelect>
                </>
              )}

              {editError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600">
                  {editError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 p-6">
              <button onClick={closeEditModal} className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase hover:text-slate-800">
                Cancelar
              </button>
              <button
                onClick={handleSaveCorreccion}
                disabled={savingId === `correccion-${getCorreccionTipo(editItem)}-${getCorreccionId(editItem)}`}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingId === `correccion-${getCorreccionTipo(editItem)}-${getCorreccionId(editItem)}` ? <Settings size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const notificationColors = {
  success: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-100 bg-amber-50 text-amber-800',
  info: 'border-indigo-100 bg-indigo-50 text-indigo-800',
};

const NotificationTray = ({ notifications, connected, onClear }) => (
  <aside className="fixed right-6 top-24 z-40 w-[min(380px,calc(100vw-48px))] rounded-2xl border border-slate-200 bg-white shadow-2xl">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Notificaciones</h2>
        <p className="text-[10px] font-bold uppercase text-slate-400">
          {connected ? 'En vivo' : 'Sin conexion en vivo'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg px-3 py-1 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        Limpiar
      </button>
    </div>
    <div className="max-h-[420px] space-y-2 overflow-y-auto p-3">
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-400">
          Sin eventos recientes.
        </div>
      ) : (
        notifications.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-3 ${notificationColors[item.severity] || notificationColors.info}`}
          >
            <div className="text-xs font-black uppercase">{item.title || 'Actividad'}</div>
            <div className="mt-1 text-xs font-semibold leading-relaxed">{item.message}</div>
            <div className="mt-2 text-[10px] font-bold uppercase opacity-60">
              {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
            </div>
          </div>
        ))
      )}
    </div>
  </aside>
);

const DetailBox = ({ label, value, isFull, highlight }) => (
  <div className={`${isFull ? 'col-span-2' : ''} p-5 rounded-3xl border ${highlight ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</span>
    <p className={`text-sm font-bold ${highlight ? 'text-indigo-700' : 'text-slate-700'}`}>{value || 'N/A'}</p>
  </div>
);

const FormSelect = ({ label, value, onChange, children }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-xs font-bold uppercase text-slate-700 outline-none transition-all focus:border-indigo-500"
    >
      {children}
    </select>
  </label>
);

const FormInput = ({ label, value, onChange, type = 'text', min }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    <input
      type={type}
      min={min}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-700 outline-none transition-all focus:border-indigo-500"
    />
  </label>
);

const cardColors = {
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  red: 'bg-red-50 text-red-600',
};

const StatCard = ({ icon, label, value, color, compact }) => (
  <div className={`bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 ${compact ? 'md:max-w-sm' : ''}`}>
    <div className={`w-10 h-10 ${cardColors[color] || cardColors.indigo} rounded-xl flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <span className="text-3xl font-black text-slate-800 tracking-tighter">{value}</span>
  </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 py-4 px-6 rounded-2xl font-black text-[10px] uppercase transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

export default JefeDashboard;
