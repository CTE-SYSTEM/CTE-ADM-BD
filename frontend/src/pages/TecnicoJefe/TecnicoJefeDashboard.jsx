import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { jefeService } from '../../services/JefeTecnico/jefeService';
import { 
  Users, AlertTriangle, X, Eye, 
  ClipboardList, Wrench, LayoutDashboard,
  LogOut, ShieldCheck, Save, Search,
  Package, Calendar, FileText, Settings
} from 'lucide-react';
import { PrioridadBadge } from '../Secretaria/Diagnostico';

const JefeDashboard = () => {
  const { user } = useContext(AuthContext);
  
  // Estados de datos
  const [diagnosticosPendientes, setDiagnosticosPendientes] = useState([]);
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);
  const [repuestosPendientes, setRepuestosPendientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState('asignar_diagnostico');
  const [filtroTiempo, setFiltroTiempo] = useState('mes'); // Afecta solo a las métricas
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [diagRes, ordRes, repRes, tecRes] = await Promise.all([
        jefeService.getDiagnosticosPendientes(),
        jefeService.getOrdenesPendientes(),
        jefeService.getRepuestosSolicitados(),
        jefeService.getTecnicosDisponibles()
      ]);

      setDiagnosticosPendientes(diagRes.data.data);
      setOrdenesPendientes(ordRes.data.data);
      setRepuestosPendientes(repRes.data.data);
      setTecnicos(tecRes.data.data);
    } catch (error) {
      console.error("Error al sincronizar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTableData = () => {
    switch(activeTab) {
      case 'asignar_diagnostico': return diagnosticosPendientes;
      case 'asignar_orden': return ordenesPendientes.filter(o => !o.id_tecnico);
      case 'ver_diagnosticos': return diagnosticosPendientes;
      case 'ver_ordenes': return ordenesPendientes;
      case 'repuestos': return repuestosPendientes;
      case 'alertas': return ordenesPendientes.filter(o => o.prioridad === 'URGENTE');
      default: return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="bg-[#0f172a] text-white p-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-500/20">CTE</div>
            <div>
              <h1 className="text-xl font-black tracking-tight italic text-indigo-400 uppercase">Control Técnico</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Panel Administrativo Jefe</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right border-r border-slate-700 pr-6">
              <p className="text-sm font-bold text-slate-200">TECNICOJEFE</p>
              <p className="text-[10px] font-black text-indigo-500 flex items-center justify-end gap-1 uppercase italic tracking-tighter">
                <ShieldCheck size={12}/> Autorizado
              </p>
            </div>
            <button className="text-slate-400 hover:text-white transition-colors"><LogOut size={24}/></button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-8">
        
        {/* FILTRO DE TIEMPO (POSICIONADO ARRIBA DE LOS CUADRADOS) */}
        <div className="flex justify-end mb-4">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            {['semana', 'mes', 'año'].map((t) => (
              <button 
                key={t} 
                onClick={() => setFiltroTiempo(t)} 
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${filtroTiempo === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* METRICAS (CUADRADOSpequeños) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<Search size={22}/>} label="Diag. Pendientes" value={diagnosticosPendientes.length} color="blue" sub={filtroTiempo} />
          <StatCard icon={<Users size={22}/>} label="Órdenes x Asignar" value={ordenesPendientes.length} color="indigo" sub={filtroTiempo} />
          <StatCard icon={<Package size={22}/>} label="Repuestos x Aprobar" value={repuestosPendientes.length} color="amber" sub={filtroTiempo} />
          <StatCard icon={<AlertTriangle size={22}/>} label="Alertas Críticas" value={ordenesPendientes.filter(o => o.prioridad === 'URGENTE').length} color="red" sub={filtroTiempo} />
        </div>

        {/* MODULOS OPERATIVOS (6 PESTAÑAS) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 bg-white p-2.5 rounded-[2.5rem] shadow-sm border border-gray-100">
          <TabButton active={activeTab === 'asignar_diagnostico'} onClick={() => setActiveTab('asignar_diagnostico')} icon={<Settings size={16}/>} label="Asignar Diag." />
          <TabButton active={activeTab === 'asignar_orden'} onClick={() => setActiveTab('asignar_orden')} icon={<Users size={16}/>} label="Asignar Orden" />
          <TabButton active={activeTab === 'ver_diagnosticos'} onClick={() => setActiveTab('ver_diagnosticos')} icon={<FileText size={16}/>} label="Ver Diagnósticos" />
          <TabButton active={activeTab === 'ver_ordenes'} onClick={() => setActiveTab('ver_ordenes')} icon={<Eye size={16}/>} label="Ver Órdenes" />
          <TabButton active={activeTab === 'repuestos'} onClick={() => setActiveTab('repuestos')} icon={<Package size={16}/>} label="Repuestos" />
          <TabButton active={activeTab === 'alertas'} onClick={() => setActiveTab('alertas')} icon={<AlertTriangle size={16}/>} label="Alertas" />
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-40 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-black text-slate-300 uppercase text-xs tracking-[0.5em]">Sincronizando Base de Datos...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b">
                  <tr>
                    <th className="px-10 py-7">Referencia</th>
                    <th className="px-10 py-7">Equipo / Cliente</th>
                    <th className="px-10 py-7 text-center">Estado/Prioridad</th>
                    <th className="px-10 py-7 text-center">Acciones</th>
                    {(activeTab.includes('asignar')) && <th className="px-10 py-7">Asignar Personal</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {getFilteredTableData().length === 0 ? (
                    <tr><td colSpan="5" className="p-40 text-center text-slate-300 font-black uppercase text-sm tracking-widest">No se encontraron registros activos</td></tr>
                  ) : getFilteredTableData().map((item) => (
                    <tr key={item.id_diagnostico || item.id_orden} className="hover:bg-indigo-50/30 transition-all group">
                      <td className="px-10 py-8">
                        <span className="font-black text-indigo-600 block text-base">#{item.id_diagnostico || item.id_orden}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Registrado hoy</span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 uppercase text-xs">
                            {item.equipo?.marca || 'S/M'} {item.equipo?.modelo || 'S/M'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-tighter">{item.equipo?.cliente?.nombre || 'Cliente Particular'}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <PrioridadBadge prioridad={item.prioridad || 'NORMAL'} />
                      </td>
                      <td className="px-10 py-8 text-center">
                        <button className="p-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl hover:text-indigo-600 hover:border-indigo-600 hover:shadow-md transition-all active:scale-90">
                          <Eye size={20} />
                        </button>
                      </td>
                      {activeTab.includes('asignar') && (
                        <td className="px-10 py-8">
                          <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none shadow-sm">
                            <option value="">Seleccionar Especialista...</option>
                            {tecnicos.map(t => <option key={t.id_tecnico} value={t.id_tecnico}>{t.nombre}</option>)}
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="p-10 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.6em]">
        CTE - Nicaragua University Project © 2026
      </footer>
    </div>
  );
};

// COMPONENTES DE DISEÑO
const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 relative group transition-all hover:shadow-xl hover:shadow-slate-200/40">
    <div className="flex flex-col gap-4">
      <div className={`w-12 h-12 bg-${color}-50 text-${color}-600 rounded-2xl flex items-center justify-center shadow-inner`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{value}</span>
          <span className="text-[9px] font-bold text-slate-300 uppercase italic tracking-tighter">Acumulado {sub}</span>
        </div>
      </div>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center gap-2.5 py-5 px-3 rounded-[2rem] font-black text-[9px] uppercase tracking-tighter transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default JefeDashboard;