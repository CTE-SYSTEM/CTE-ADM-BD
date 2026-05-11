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
import Table from '../../components/Table';
import { PrioridadBadge } from '../Secretaria/Diagnostico';

const TAB_DIAGNOSTICOS = 'asignar_diagnostico';
const TAB_ORDENES = 'asignar_orden';
const TAB_REPUESTOS = 'repuestos';
const TAB_ALERTAS = 'alertas';

const JefeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [diagnosticosPendientes, setDiagnosticosPendientes] = useState([]);
  const [ordenesAprobadas, setOrdenesAprobadas] = useState([]);
  const [repuestosPendientes, setRepuestosPendientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [activeTab, setActiveTab] = useState(TAB_DIAGNOSTICOS);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detalles, setDetalles] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

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
    if (!selectedItem || selectedItem.id_detalle_repuesto) return;

    const id = selectedItem.id_diagnostico || selectedItem.id_orden;
    if (id) fetchDetalles(selectedItem);
  }, [selectedItem]);

  const getData = (response) => response?.data?.data || response?.data || [];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [diagRes, ordenesRes, repuestosRes, tecRes] = await Promise.all([
        diagnosticoService.getPendientes(),
        ordenesService.getAprobadas(),
        repuestoService.getPendientesAprobacion(),
        diagnosticoService.getTecnicos(),
      ]);

      setDiagnosticosPendientes(getData(diagRes));
      setOrdenesAprobadas(getData(ordenesRes));
      setRepuestosPendientes(getData(repuestosRes));
      setTecnicos(getData(tecRes));
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
    if (!window.confirm(`Deseas ${texto} esta solicitud de repuesto?`)) return;

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

  const mainData =
    activeTab === TAB_DIAGNOSTICOS
      ? diagnosticosPendientes.filter((item) => !getTecnicoId(item))
      : activeTab === TAB_ORDENES
        ? ordenesAprobadas.filter((item) => !getTecnicoId(item))
        : activeTab === TAB_REPUESTOS
          ? repuestosPendientes
          : alertasRetraso;

  const mainColumns = activeTab === TAB_REPUESTOS ? repuestosColumns : asignacionColumns;

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
    </div>
  );
};

const DetailBox = ({ label, value, isFull, highlight }) => (
  <div className={`${isFull ? 'col-span-2' : ''} p-5 rounded-3xl border ${highlight ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</span>
    <p className={`text-sm font-bold ${highlight ? 'text-indigo-700' : 'text-slate-700'}`}>{value || 'N/A'}</p>
  </div>
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
