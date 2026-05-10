// frontend/src/pages/Tecnico/TecnicoDashboard.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Package, CheckCircle, Clock, Wrench, X, FileText, ClipboardList } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

// --- COMPONENTES DE APOYO ---

const PrioridadBadge = ({ prioridad }) => {
  const styles = {
    URGENTE: 'bg-red-100 text-red-700 border-red-200',
    ALTA: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIA: 'bg-blue-100 text-blue-700 border-blue-200',
    BAJA: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[prioridad] || styles.BAJA}`}>
      {prioridad}
    </span>
  );
};

const EstadoBadge = ({ estado }) => {
  const styles = {
    'Pendiente': 'bg-gray-100 text-gray-600 border-gray-200',
    'En Diagnóstico': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Diagnosticado': 'bg-purple-50 text-purple-700 border-purple-100',
    'Esperando Repuesto': 'bg-amber-50 text-amber-700 border-amber-100',
    'Reparado': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[estado] || 'bg-gray-50 text-gray-600'}`}>
      {estado?.toUpperCase()}
    </span>
  );
};

const EstadoSolicitudBadge = ({ estado }) => {
  const styles = {
    Pendiente: 'bg-yellow-100 text-yellow-800',
    Aprobado: 'bg-green-100 text-green-800',
    Desaprobado: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-gray-800'}`}>
      {estado}
    </span>
  );
};

// --- MODALES ---

const SolicitarRepuestoModal = ({ orden, onClose, onSubmit }) => {
  const [repuesto, setRepuesto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    onSubmit({ ordenId: orden.id, repuesto, cantidad, nota });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Solicitar Repuesto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs mb-4">
            <span className="font-black text-indigo-600">ORDEN #{orden.id}</span>
            <p className="font-bold text-gray-700">{orden.equipo}</p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nombre Repuesto</label>
            <input required className="w-full px-3 py-2 border rounded-lg text-sm" value={repuesto} onChange={e => setRepuesto(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Cantidad</label>
            <input type="number" min="1" className="w-full px-3 py-2 border rounded-lg text-sm" value={cantidad} onChange={e => setCantidad(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-gray-500">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase">
              {loading ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RegistrarDiagnosticoModal = ({ orden, onClose, onSubmit }) => {
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico || '');
  const [solucion, setSolucion] = useState(orden.solucion || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    onSubmit(orden.id, { diagnostico, solucion });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Nuevo Diagnóstico</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Seleccionar Orden</label>
            <div className="p-3 bg-gray-50 border rounded-lg text-sm font-bold text-gray-700">
                {orden.id} - {orden.equipo}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Hallazgos</label>
            <textarea required rows="3" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500" value={diagnostico} onChange={e => setDiagnostico(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Acción / Solución</label>
            <textarea required rows="2" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500" value={solucion} onChange={e => setSolucion(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-gray-500">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold uppercase">
              {loading ? 'Guardando...' : 'Guardar Diagnóstico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---

const TecnicoDashboard = () => {
  const { user } = useContext(AuthContext);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [repuestos, setRepuestos] = useState([]);

  // Seccion de estado inicial cambiada a 'diagnosticos'
  const [activeTab, setActiveTab] = useState('diagnosticos');
  const [modalRepuesto, setModalRepuesto] = useState(null);
  const [modalDiagnostico, setModalDiagnostico] = useState(null);

  const mapDiagnostico = (diagnostico) => ({
    id: diagnostico.id_diagnostico,
    cliente: diagnostico.equipo?.cliente?.nombre || 'Sin cliente',
    equipo: `${diagnostico.equipo?.tipo || 'Equipo'} ${diagnostico.equipo?.marca || ''} ${diagnostico.equipo?.modelo || ''}`.trim(),
    falla: diagnostico.falla_reportada || 'Sin falla reportada',
    prioridad: 'MEDIA',
    estado: diagnostico.estado_del_diagnostico === 'PENDIENTE' ? 'Pendiente' : 'En Diagnóstico',
    diagnostico: diagnostico.diagnostico_real || '',
    solucion: '',
    presupuesto: diagnostico.presupuesto_estimado,
  });

  const loadMisDiagnosticos = async () => {
    if (!user?.username) return;

    setLoading(true);
    try {
      const response = await api.get(`/tecnicos/mis-diagnosticos/${encodeURIComponent(user.username)}`);
      setOrdenes((response.data.data || []).map(mapDiagnostico));
    } catch (error) {
      console.error('Error al cargar diagnósticos asignados:', error);
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMisDiagnosticos();
  }, [user?.username]);

  const handleEstadoChange = (ordenId, nuevoEstado) => {
    setOrdenes(prev => prev.map(o => o.id === ordenId ? { ...o, estado: nuevoEstado } : o));
  };

  const handleGuardarDiagnostico = (ordenId, data) => {
    setOrdenes(prev => prev.map(o => o.id === ordenId ? { ...o, ...data, estado: 'Diagnosticado' } : o));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight text-left">PANEL TÉCNICO</h1>
      </div>

      {/* Tabs Reordenados: Diagnósticos primero */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('diagnosticos')} className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest flex items-center ${activeTab === 'diagnosticos' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}>
            <ClipboardList size={16} className="mr-2" /> Diagnósticos
          </button>
          <button onClick={() => setActiveTab('ordenes')} className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest flex items-center ${activeTab === 'ordenes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>
            <Wrench size={16} className="mr-2" /> Órdenes Asignadas
          </button>
          <button onClick={() => setActiveTab('repuestos')} className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest flex items-center ${activeTab === 'repuestos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>
            <Package size={16} className="mr-2" /> Mis Repuestos
          </button>
        </nav>
      </div>

      {/* Contenido según Tab */}
      {activeTab === 'diagnosticos' && (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-gray-400 uppercase">Gestión de Diagnósticos</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr className="text-[10px] font-black text-gray-400 uppercase text-left">
                            <th className="px-6 py-4">Orden</th>
                            <th className="px-6 py-4">Equipo</th>
                            <th className="px-6 py-4">Presupuesto</th>
                            <th className="px-6 py-4">Diagnóstico Actual</th>
                            <th className="px-6 py-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ordenes.map(o => (
                            <tr key={o.id} className="text-sm">
                                <td className="px-6 py-4 font-black text-purple-600">#{o.id}</td>
                                <td className="px-6 py-4 font-bold text-gray-800">{o.equipo}</td>
                                <td className="px-6 py-4 font-bold text-emerald-700">
                                    {o.presupuesto ? `C$ ${Number(o.presupuesto).toFixed(2)}` : 'Sin presupuesto'}
                                </td>
                                <td className="px-6 py-4 text-gray-500 italic">
                                    {o.diagnostico || 'Sin diagnóstico registrado...'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => setModalDiagnostico(o)}
                                        className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
                                    >
                                        <FileText size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && ordenes.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                                    No tienes diagnósticos asignados todavía.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-purple-500 font-bold">
                                    Cargando diagnósticos asignados...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'ordenes' && (
        <div className="grid gap-6 md:grid-cols-2">
          {ordenes.map((orden) => (
            <div key={orden.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-indigo-600">#{orden.id}</span>
                    <PrioridadBadge prioridad={orden.prioridad} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{orden.equipo}</h3>
                </div>
                <EstadoBadge estado={orden.estado} />
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <span className="text-[9px] font-black text-gray-400 uppercase">Falla Reportada</span>
                <p className="text-xs text-gray-600 italic">"{orden.falla}"</p>
              </div>
              <div className="flex gap-2">
                <select className="flex-1 px-3 py-2 border rounded-lg text-[10px] font-black uppercase" value={orden.estado} onChange={(e) => handleEstadoChange(orden.id, e.target.value)}>
                  <option value="En Diagnóstico">EN DIAGNÓSTICO</option>
                  <option value="Esperando Repuesto">ESPERANDO REPUESTO</option>
                  <option value="Reparado">REPARADO</option>
                </select>
                <button onClick={() => setModalRepuesto(orden)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
                  <Package size={14}/> Repuesto
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'repuestos' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
                <tr className="text-[10px] font-black text-gray-400 uppercase text-left">
                    <th className="px-6 py-4">Orden</th>
                    <th className="px-6 py-4">Repuesto</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Fecha</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {repuestos.map(r => (
                    <tr key={r.id} className="text-sm">
                        <td className="px-6 py-4 font-black text-indigo-600">#{r.ordenId}</td>
                        <td className="px-6 py-4 font-bold">{r.repuesto}</td>
                        <td className="px-6 py-4 text-center"><EstadoSolicitudBadge estado={r.estado}/></td>
                        <td className="px-6 py-4 text-right text-gray-400">{r.fechaSolicitud}</td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      {modalRepuesto && <SolicitarRepuestoModal orden={modalRepuesto} onClose={() => setModalRepuesto(null)} onSubmit={(s) => setRepuestos([...repuestos, {id: Date.now(), ...s, estado: 'Pendiente', fechaSolicitud: '2026-05-05'}])} />}
      {modalDiagnostico && <RegistrarDiagnosticoModal orden={modalDiagnostico} onClose={() => setModalDiagnostico(null)} onSubmit={handleGuardarDiagnostico} />}
    </div>
  );
};

export default TecnicoDashboard;
