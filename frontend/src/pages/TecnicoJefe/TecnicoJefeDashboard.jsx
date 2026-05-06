// frontend/src/pages/TecnicoJefe/TecnicoJefeDashboard.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { diagnosticoService } from '../../services/JefeTecnico/DiagnosticoService'; 
import Table from '../../components/Table';
import {  
  Users, AlertTriangle, Eye, LogOut, ShieldCheck, Search,
  Package, Settings, CheckCircle2, X, History, Save, Bell
} from 'lucide-react';
import { PrioridadBadge } from '../Secretaria/Diagnostico';
import { useNavigate } from 'react-router-dom';

const JefeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [diagnosticosPendientes, setDiagnosticosPendientes] = useState([]);
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);
  const [repuestosPendientes, setRepuestosPendientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [activeTab, setActiveTab] = useState('asignar_diagnostico');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState({});

  // Estados para el modal
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detalles, setDetalles] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      const id = selectedItem.id_diagnostico || (selectedItem.diagnostico?.id_diagnostico) || selectedItem.id_orden;
      if (id) fetchDetalles(id);
    }
  }, [selectedItem]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [diagRes, ordRes, repRes, tecRes] = await Promise.all([
        diagnosticoService.getTodos(), 
        diagnosticoService.getOrdenes(), 
        diagnosticoService.getRepuestos(),
        diagnosticoService.getTecnicos() 
      ]);
      setDiagnosticosPendientes(diagRes.data?.data || []);
      setOrdenesPendientes(ordRes.data?.data || []);
      setRepuestosPendientes(repRes.data?.data || []);
      setTecnicos(tecRes.data?.data || []);
    } catch (error) {
      console.error("Error en la carga de datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetalles = async (id) => {
    setLoadingDetalles(true);
    try {
      const res = await diagnosticoService.getById(id);
      setDetalles(res.data?.data);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
    } finally {
      setLoadingDetalles(false);
    }
  };

  // LÓGICA DE ALERTAS: Diagnósticos en proceso con más de 72 horas
  const getRowKey = (row) => `${row.id_diagnostico ? 'diagnostico' : 'orden'}-${row.id_diagnostico || row.id_orden}`;

  const getTecnicoId = (row) => row.tecnico_id ?? row.id_tecnico ?? '';

  const getFechaAsignacion = (row) => row.fecha_asignacion || row.diagnostico?.fecha_asignacion || row.updatedAt || row.fecha_hora || row.fecha_ingreso || row.createdAt;

  const getHorasDesdeAsignacion = (row) => {
    const fechaAsignacion = getFechaAsignacion(row);
    if (!fechaAsignacion) return null;

    const fecha = new Date(fechaAsignacion);
    if (Number.isNaN(fecha.getTime())) return null;

    return (new Date() - fecha) / (1000 * 60 * 60);
  };

  const puedeEditar = (row) => {
    const horasAsignado = getHorasDesdeAsignacion(row);
    return horasAsignado !== null && horasAsignado < 24;
  };

  const getTecnicoDisplay = (id) => {
    const tecnico = tecnicos.find(t => String(t.id_tecnico) === String(id));
    if (!tecnico) return 'Seleccionar Tecnico...';

    return `${tecnico.nombre} - ${tecnico.especialidad || 'GENERAL'}`;
  };

  const handleTecnicoChange = (row, value) => {
    setTecnicosSeleccionados(prev => ({
      ...prev,
      [getRowKey(row)]: value
    }));
  };

  const handleSaveAsignacion = async (row) => {
    const id = row.id_diagnostico || row.id_orden;
    const idTecnico = tecnicosSeleccionados[getRowKey(row)] || getTecnicoId(row);

    if (!id || !idTecnico || savingId) return;

    setSavingId(id);
    try {
      if (row.id_diagnostico) {
        await diagnosticoService.asignar(row.id_diagnostico, idTecnico);
      } else if (row.id_orden) {
        await diagnosticoService.asignarOrden(row.id_orden, idTecnico);
      }
      await fetchData();
      setTecnicosSeleccionados(prev => {
        const siguiente = { ...prev };
        delete siguiente[getRowKey(row)];
        return siguiente;
      });
    } catch (error) {
      console.error("Error al guardar asignacion:", error);
    } finally {
      setSavingId(null);
    }
  };

  const getAlertasRetraso = () => {
    return diagnosticosPendientes.filter(d => {
      const estado = String(d.estado_del_diagnostico || '').toUpperCase();
      const horasAsignado = getHorasDesdeAsignacion(d);
      // Filtra si tiene más de 72h y ya tiene un técnico asignado (está en proceso)
      return Boolean(getTecnicoId(d)) && horasAsignado !== null && horasAsignado > 72 && estado !== 'COMPLETADO';
    });
  };

  const getAsignacionesRecientes = () => {
    const recientesDiag = diagnosticosPendientes.filter(d => getTecnicoId(d) && puedeEditar(d));
    const recientesOrd = ordenesPendientes.filter(o => getTecnicoId(o) && puedeEditar(o));
    return [...recientesDiag, ...recientesOrd];
  };

  const columns = [
    {
      header: 'Referencia',
      accessor: 'id',
      render: (row) => (
        <div className="py-2">
          <span className="font-black text-indigo-600 block text-base leading-none">
            #{row.id_diagnostico || row.id_orden}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID Registro</span>
        </div>
      )
    },
    {
      header: 'Equipo / Cliente',
      accessor: 'equipo',
      render: (row) => {
        const equipo = row.equipo || row.diagnostico?.equipo;
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
      }
    },
    {
      header: 'Técnico y Especialidad',
      accessor: 'asignar',
      render: (row) => {
        const idKey = row.id_diagnostico || row.id_orden;
        const isSaving = savingId === idKey;
        const tecnicoId = tecnicosSeleccionados[getRowKey(row)] ?? getTecnicoId(row);
        const esAsignacionExistente = Boolean(getTecnicoId(row));
        const edicionPermitida = !esAsignacionExistente || puedeEditar(row);
        return (
          <div className="relative flex items-center gap-3 min-w-[280px]">
            <select 
              value={tecnicoId}
              disabled={!edicionPermitida || isSaving}
              title={tecnicoId ? getTecnicoDisplay(tecnicoId) : 'Seleccionar Tecnico'}
              className={`flex-1 px-3 py-2.5 bg-white border-2 ${isSaving ? 'border-amber-400' : 'border-slate-100'} rounded-xl text-[10px] font-bold uppercase outline-none focus:border-indigo-500 transition-all ${edicionPermitida ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
              onChange={(event) => handleTecnicoChange(row, event.target.value)}
            >
              <option value="">Seleccionar Técnico...</option>
              {tecnicos.map(t => (
                <option key={t.id_tecnico} value={t.id_tecnico}>
                  {t.nombre} — {t.especialidad || 'GENERAL'}
                </option>
              ))}
            </select>
            
            <button 
              className="group relative p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm border border-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!edicionPermitida || !tecnicoId || isSaving}
              onClick={() => handleSaveAsignacion(row)}
            >
              {isSaving ? <Settings size={18} className="animate-spin" /> : <Save size={18} />}
            </button>

            <div className="w-6 flex justify-center">
               {getTecnicoId(row) && !isSaving && <CheckCircle2 size={20} className="text-emerald-500" />}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Prioridad',
      accessor: 'prioridad',
      render: (row) => <PrioridadBadge prioridad={row.prioridad || 'NORMAL'} />
    },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <button 
          onClick={() => { setSelectedItem(row); setShowModal(true); }} 
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-black text-[10px] uppercase"
        >
          <Eye size={14} /> Ver
        </button>
      )
    }
  ];

  const asignacionesRecientes = getAsignacionesRecientes();
  const alertasRetraso = getAlertasRetraso();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
      {/* HEADER CON USUARIO Y ROL */}
      <header className="bg-[#0f172a] text-white p-6 shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-500/20">CTE</div>
            <div>
              <h1 className="text-xl text-white italic uppercase tracking-tight">Panel <span className="text-indigo-400">Jefe Técnico</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Información del Usuario a la derecha */}
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">Usuario Conectado</p>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-white uppercase tracking-tight">{user?.nombre || 'Técnico Jefe'}</span>
                <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-indigo-500/30">
                  {user?.rol || 'Jefe'}
                </span>
              </div>
            </div>

            <button onClick={logout} className="group flex items-center gap-3 bg-slate-800/50 hover:bg-red-500/10 p-2 pr-4 rounded-2xl transition-all border border-slate-700 hover:border-red-500/50">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center group-hover:text-red-500 transition-colors"><LogOut size={20}/></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-500">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-8">
        
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<Search size={22}/>} label="Diag. Pendientes" value={diagnosticosPendientes.filter(d => !getTecnicoId(d)).length} color="blue" />
          <StatCard icon={<Users size={22}/>} label="Órdenes" value={ordenesPendientes.filter(o => !o.id_tecnico).length} color="indigo" />
          <StatCard icon={<Package size={22}/>} label="Repuestos" value={repuestosPendientes.length} color="amber" />
          <StatCard icon={<AlertTriangle size={22}/>} label="Alertas +72h" value={alertasRetraso.length} color="red" />
        </div>

        {/* ASIGNACIONES RECIENTES */}
        {asignacionesRecientes.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 px-4">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><History size={20}/></div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Asignaciones Recientes (24h)</h2>
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-amber-50 overflow-hidden">
              <Table columns={columns} data={asignacionesRecientes} />
            </div>
          </section>
        )}

        {/* SELECTOR DE PESTAÑAS (INCLUYE ALERTAS) */}
        <div className="flex flex-wrap gap-3 mb-8">
          <TabButton active={activeTab === 'asignar_diagnostico'} onClick={() => setActiveTab('asignar_diagnostico')} icon={<Search size={16}/>} label="Asignar Diagnóstico" />
          <TabButton active={activeTab === 'asignar_orden'} onClick={() => setActiveTab('asignar_orden')} icon={<Users size={16}/>} label="Asignar Orden" />
          <TabButton active={activeTab === 'repuestos'} onClick={() => setActiveTab('repuestos')} icon={<Package size={16}/>} label="Repuestos" />
          <TabButton 
            active={activeTab === 'alertas'} 
            onClick={() => setActiveTab('alertas')} 
            icon={<Bell size={16}/>} 
            label={`Alertas (${alertasRetraso.length})`} 
          />
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-40 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-black text-slate-300 uppercase text-xs tracking-widest">Cargando...</span>
            </div>
          ) : (
            <Table 
              columns={columns.filter(col => activeTab === 'repuestos' ? col.header !== 'Técnico y Especialidad' : true)} 
              data={
                activeTab === 'asignar_diagnostico' ? diagnosticosPendientes.filter(d => !getTecnicoId(d)) : 
                activeTab === 'asignar_orden' ? ordenesPendientes.filter(o => !getTecnicoId(o)) : 
                activeTab === 'repuestos' ? repuestosPendientes :
                activeTab === 'alertas' ? alertasRetraso : []
              } 
            />
          )}
        </div>
      </main>

      {/* MODAL DETALLES */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ficha Técnica</h2>
              <button onClick={() => { setShowModal(false); setDetalles(null); setSelectedItem(null); }} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              {loadingDetalles ? (
                <div className="py-20 text-center">Cargando detalles...</div>
              ) : detalles ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailBox label="Equipo" value={`${detalles.equipo?.marca} ${detalles.equipo?.modelo}`} />
                    <DetailBox label="Cliente" value={detalles.equipo?.cliente?.nombre} />
                  </div>
                  <DetailBox label="Falla Reportada" value={detalles.falla_reportada} isFull highlight />
                  <DetailBox label="Diagnóstico Realizado" value={detalles.diagnostico_real || 'Aún no se ha realizado diagnóstico'} isFull />
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTES AUXILIARES
const DetailBox = ({ label, value, isFull, highlight }) => (
  <div className={`${isFull ? 'col-span-2' : ''} p-5 rounded-3xl border ${highlight ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</span>
    <p className={`text-sm font-bold ${highlight ? 'text-indigo-700' : 'text-slate-700'}`}>{value || 'N/A'}</p>
  </div>
);

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50">
    <div className={`w-10 h-10 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center mb-4`}>{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <span className="text-3xl font-black text-slate-800 tracking-tighter">{value}</span>
  </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 py-4 px-6 rounded-2xl font-black text-[10px] uppercase transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

export default JefeDashboard;
