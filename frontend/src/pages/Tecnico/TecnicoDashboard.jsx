// frontend/src/pages/Tecnico/TecnicoDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, CheckCircle, Clock, Wrench, X } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

// --- COMPONENTES DE APOYO (Definidos localmente para evitar errores de importación) ---

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
    'En Diagnóstico': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Esperando Repuesto': 'bg-amber-50 text-amber-700 border-amber-100',
    'Reparado': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Entregado': 'bg-slate-50 text-slate-700 border-slate-100',
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

  const icons = {
    Pendiente: <Clock size={14} className="mr-1" />,
    Aprobado: <CheckCircle size={14} className="mr-1" />,
    Desaprobado: <X size={14} className="mr-1" />,
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-gray-800'}`}>
      {icons[estado]}
      {estado}
    </span>
  );
};

// --- MOCK DATA ---

const mockOrdenes = [
  {
    id: 'ORD-001',
    cliente: 'Carlos Mendoza',
    equipo: 'Laptop Dell Inspiron 15',
    falla: 'Pantalla sin imagen, backlight dañado',
    prioridad: 'ALTA',
    estado: 'En Diagnóstico',
    fechaAsignacion: '2026-04-25',
    descripcion: 'El cliente reporta que la pantalla no muestra imagen pero el equipo enciende.',
  },
  {
    id: 'ORD-002',
    cliente: 'María González',
    equipo: 'Samsung Galaxy S21',
    falla: 'No enciende, posible daño por líquido',
    prioridad: 'URGENTE',
    estado: 'Esperando Repuesto',
    fechaAsignacion: '2026-04-26',
    descripcion: 'Equipo mojado, no responde al botón de encendido.',
  },
  {
    id: 'ORD-003',
    cliente: 'Roberto López',
    equipo: 'iMac 27" 2020',
    falla: 'Disco duro SSD fallando',
    prioridad: 'MEDIA',
    estado: 'En Diagnóstico',
    fechaAsignacion: '2026-04-27',
    descripcion: 'El sistema operativo reporta errores de disco, ruidos extraños.',
  },
  {
    id: 'ORD-004',
    cliente: 'Ana Torres',
    equipo: 'PlayStation 5',
    falla: 'Lector de discos dañado',
    prioridad: 'BAJA',
    estado: 'Reparado',
    fechaAsignacion: '2026-04-20',
    descripcion: 'No lee discos, error de lectura constante.',
  },
];

const mockRepuestos = [
  {
    id: 'REP-001',
    ordenId: 'ORD-002',
    repuesto: 'Pantalla OLED 6.1"',
    cantidad: 1,
    nota: 'Necesaria para reemplazo completo del módulo',
    estado: 'Pendiente',
    fechaSolicitud: '2026-04-26',
  },
  {
    id: 'REP-002',
    ordenId: 'ORD-001',
    repuesto: 'Inverter Backlight',
    cantidad: 1,
    nota: 'Modelo específico para Dell Inspiron 15 5000 series',
    estado: 'Aprobado',
    fechaSolicitud: '2026-04-25',
  },
];

// --- MODAL COMPONENT ---

const SolicitarRepuestoModal = ({ orden, onClose, onSubmit }) => {
  const [repuesto, setRepuesto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repuesto.trim()) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      onSubmit({
        ordenId: orden.id,
        repuesto,
        cantidad,
        nota,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Solicitar Repuesto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
            <div className="text-sm text-indigo-700 font-bold uppercase tracking-tight">Orden: {orden?.id}</div>
            <div className="text-sm text-gray-700 font-medium">{orden?.equipo}</div>
            <div className="text-xs text-gray-500">{orden?.cliente}</div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Repuesto *</label>
            <input
              type="text"
              value={repuesto}
              onChange={(e) => setRepuesto(e.target.value)}
              required
              placeholder="Ej: Pantalla LCD 15.6'', Batería..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad *</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nota / Descripción</label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows="3"
              placeholder="Especificaciones técnicas..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold text-xs uppercase">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!repuesto.trim() || loading}
              className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-bold text-xs uppercase shadow-md shadow-indigo-100"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---

const TecnicoDashboard = () => {
  const [ordenes, setOrdenes] = useState(mockOrdenes);
  const [repuestos, setRepuestos] = useState(mockRepuestos);
  const [modalOrden, setModalOrden] = useState(null);
  const [activeTab, setActiveTab] = useState('ordenes');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleEstadoChange = (ordenId, nuevoEstado) => {
    setOrdenes((prev) =>
      prev.map((orden) =>
        orden.id === ordenId ? { ...orden, estado: nuevoEstado } : orden
      )
    );
  };

  const handleSolicitarRepuesto = (solicitud) => {
    const nuevoRepuesto = {
      id: `REP-${Date.now()}`,
      ...solicitud,
      estado: 'Pendiente',
      fechaSolicitud: new Date().toISOString().split('T')[0],
    };
    setRepuestos((prev) => [...prev, nuevoRepuesto]);
  };

  const getRepuestosOrden = (ordenId) => {
    return repuestos.filter((r) => r.ordenId === ordenId);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar open={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">PANEL TÉCNICO</h1>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Gestión de reparaciones y repuestos</p>
          </div>

          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('ordenes')}
                className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest transition-colors flex items-center ${
                  activeTab === 'ordenes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Wrench size={16} className="mr-2" />
                Órdenes Asignadas
              </button>
              <button
                onClick={() => setActiveTab('repuestos')}
                className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest transition-colors flex items-center ${
                  activeTab === 'repuestos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Package size={16} className="mr-2" />
                Mis Repuestos
              </button>
            </nav>
          </div>

          {activeTab === 'ordenes' && (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {ordenes.map((orden) => (
                <div key={orden.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-indigo-600 tracking-tighter">#{orden.id}</span>
                          <PrioridadBadge prioridad={orden.prioridad} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 leading-tight">{orden.equipo}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{orden.cliente}</p>
                      </div>
                      <EstadoBadge estado={orden.estado} />
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 flex-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Reporte de Falla</div>
                      <p className="text-sm text-gray-700 italic">"{orden.falla}"</p>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-gray-50">
                      <select
                        value={orden.estado}
                        onChange={(e) => handleEstadoChange(orden.id, e.target.value)}
                        className="flex-1 min-w-[150px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="En Diagnóstico">EN DIAGNÓSTICO</option>
                        <option value="Esperando Repuesto">ESPERANDO REPUESTO</option>
                        <option value="Reparado">MARCAR COMO REPARADO</option>
                        <option value="Entregado">MARCAR COMO ENTREGADO</option>
                      </select>
                      
                      <button
                        onClick={() => setModalOrden(orden)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-bold uppercase transition-all shadow-lg shadow-indigo-100"
                      >
                        <Package size={14} />
                        Repuesto
                      </button>
                    </div>

                    {getRepuestosOrden(orden.id).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-dashed border-gray-100">
                        <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Solicitudes vinculadas</div>
                        <div className="flex flex-wrap gap-2">
                          {getRepuestosOrden(orden.id).map((rep) => (
                            <div key={rep.id} className="flex items-center bg-gray-50 px-2 py-1 rounded border border-gray-100">
                              <span className="text-[10px] font-bold text-gray-600 mr-2">{rep.repuesto}</span>
                              <EstadoSolicitudBadge estado={rep.estado} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'repuestos' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50/50">
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                    <th className="px-6 py-4 text-left">Orden</th>
                    <th className="px-6 py-4 text-left">Repuesto</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Fecha Solicitud</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {repuestos.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic text-sm">No has realizado solicitudes aún</td>
                    </tr>
                  ) : (
                    repuestos.map((rep) => (
                      <tr key={rep.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-black text-indigo-600">#{rep.ordenId}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-800">{rep.repuesto}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{rep.nota || 'Sin notas adicionales'}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <EstadoSolicitudBadge estado={rep.estado} />
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-gray-400">
                          {rep.fechaSolicitud}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {modalOrden && (
          <SolicitarRepuestoModal
            orden={modalOrden}
            onClose={() => setModalOrden(null)}
            onSubmit={handleSolicitarRepuesto}
          />
        )}
      </div>
    </div>
  );
};

export default TecnicoDashboard;