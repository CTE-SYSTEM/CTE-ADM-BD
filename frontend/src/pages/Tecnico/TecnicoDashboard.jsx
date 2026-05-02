// frontend/src/pages/Tecnico/TecnicoDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, CheckCircle, Clock, Wrench, X } from 'lucide-react';
import { EstadoBadge, PrioridadBadge } from "../Secretaria/Diagnostico";
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

// Mock data para órdenes asignadas al técnico
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

// Mock data para solicitudes de repuestos
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

// Modal para solicitar repuesto
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Solicitar Repuesto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600 font-medium">Orden: {orden?.id}</div>
            <div className="text-sm text-gray-600">{orden?.equipo}</div>
            <div className="text-xs text-gray-500">{orden?.cliente}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Repuesto *</label>
            <input
              type="text"
              value={repuesto}
              onChange={(e) => setRepuesto(e.target.value)}
              required
              placeholder="Ej: Pantalla LCD 15.6'', Batería..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota / Descripción</label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows="3"
              placeholder="Especificaciones técnicas..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!repuesto.trim() || loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Panel del Técnico</h1>
            <p className="text-gray-600">Gestiona tus órdenes asignadas y solicita repuestos</p>
          </div>

          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('ordenes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'ordenes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Wrench size={18} className="inline-block mr-2" />
                Órdenes Asignadas
              </button>
              <button
                onClick={() => setActiveTab('repuestos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'repuestos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package size={18} className="inline-block mr-2" />
                Mis Solicitudes de Repuestos
              </button>
            </nav>
          </div>

          {activeTab === 'ordenes' && (
            <div className="space-y-4">
              {ordenes.map((orden) => (
                <div key={orden.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-gray-800">{orden.id}</span>
                        <PrioridadBadge prioridad={orden.prioridad} />
                        <EstadoBadge estado={orden.estado} />
                      </div>
                      <h3 className="text-md font-medium text-gray-900">{orden.equipo}</h3>
                      <p className="text-sm text-gray-600">{orden.cliente}</p>
                      <p className="text-sm text-gray-500 mt-2">{orden.falla}</p>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[200px]">
                      <select
                        value={orden.estado}
                        onChange={(e) => handleEstadoChange(orden.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="En Diagnóstico">En Diagnóstico</option>
                        <option value="Esperando Repuesto">Esperando Repuesto</option>
                        <option value="Reparado">Reparado</option>
                        <option value="Entregado">Entregado</option>
                      </select>
                      <button
                        onClick={() => setModalOrden(orden)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Package size={16} />
                        Solicitar Repuesto
                      </button>
                    </div>
                  </div>

                  {getRepuestosOrden(orden.id).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Repuestos Solicitados:</h4>
                      <div className="space-y-2">
                        {getRepuestosOrden(orden.id).map((rep) => (
                          <div key={rep.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-800">{rep.repuesto}</span>
                              <span className="text-gray-500"> (x{rep.cantidad})</span>
                            </div>
                            <EstadoSolicitudBadge estado={rep.estado} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'repuestos' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repuesto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {repuestos.map((rep) => (
                    <tr key={rep.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{rep.ordenId}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rep.repuesto}</td>
                      <td className="px-6 py-4"><EstadoSolicitudBadge estado={rep.estado} /></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{rep.fechaSolicitud}</td>
                    </tr>
                  ))}
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