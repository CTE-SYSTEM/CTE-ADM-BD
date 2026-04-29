// frontend/src/pages/TecnicoJefe/TecnicoJefeDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Users, Package, AlertTriangle, CheckCircle, X, Clock, Wrench, ArrowRight } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

// Mock data para técnicos
const mockTecnicos = [
  { id: 1, nombre: 'Juan Pérez', especialidad: 'Laptops', activo: true },
  { id: 2, nombre: 'Carlos Ruiz', especialidad: 'Móviles', activo: true },
  { id: 3, nombre: 'Pedro Gómez', especialidad: 'Tablets', activo: true },
  { id: 4, nombre: 'Luis Martínez', especialidad: 'Consolas', activo: false },
];

// Mock data para equipos pendientes de diagnóstico
const mockEquiposPendientes = [
  { id: 'ORD-001', cliente: 'Carlos Mendoza', equipo: 'Laptop Dell Inspiron 15', falla: 'Pantalla sin imagen', prioridad: 'ALTA', fecha: '2026-04-25' },
  { id: 'ORD-002', cliente: 'María González', equipo: 'Samsung Galaxy S21', falla: 'No enciende', prioridad: 'URGENTE', fecha: '2026-04-26' },
  { id: 'ORD-003', cliente: 'Roberto López', equipo: 'iMac 27" 2020', falla: 'Disco duro SSD', prioridad: 'MEDIA', fecha: '2026-04-27' },
  { id: 'ORD-004', cliente: 'Ana Torres', equipo: 'PlayStation 5', falla: 'Lector de discos', prioridad: 'BAJA', fecha: '2026-04-20' },
  { id: 'ORD-005', cliente: 'Jorge Ramírez', equipo: 'HP Pavilion', falla: 'Sobrecalentamiento', prioridad: 'MEDIA', fecha: '2026-04-28' },
];

// Mock data para solicitudes de repuestos
const mockSolicitudesRepuesto = [
  { id: 'REP-001', ordenId: 'ORD-002', solicitante: 'Juan Pérez', repuesto: 'Pantalla OLED 6.1"', cantidad: 1, prioridad: 'URGENTE', estado: 'Pendiente', fecha: '2026-04-26' },
  { id: 'REP-002', ordenId: 'ORD-001', solicitante: 'Carlos Ruiz', repuesto: 'Inverter Backlight', cantidad: 1, prioridad: 'ALTA', estado: 'Pendiente', fecha: '2026-04-25' },
  { id: 'REP-003', ordenId: 'ORD-003', solicitante: 'Juan Pérez', repuesto: 'SSD 512GB', cantidad: 1, prioridad: 'MEDIA', estado: 'Aprobado', fecha: '2026-04-24' },
  { id: 'REP-004', ordenId: 'ORD-004', solicitante: 'Pedro Gómez', repuesto: 'Lector蓝光', cantidad: 1, prioridad: 'BAJA', estado: 'Desaprobado', fecha: '2026-04-22' },
  { id: 'REP-005', ordenId: 'ORD-005', solicitante: 'Carlos Ruiz', repuesto: 'Ventilador CPU', cantidad: 2, prioridad: 'MEDIA', estado: 'Pendiente', fecha: '2026-04-28' },
];

// Mock data para órdenes críticas (más de 3 días sin movimiento)
const mockOrdenesCriticas = [
  { id: 'ORD-006', cliente: 'Empresa ABC', equipo: 'Servidor Dell', diasSinMovimiento: 5, ultimoEstado: 'En Diagnóstico' },
  { id: 'ORD-007', cliente: 'Tienda Central', equipo: 'POS Terminal', diasSinMovimiento: 4, ultimoEstado: 'Esperando Repuesto' },
  { id: 'ORD-008', cliente: 'Colegio Nacional', equipo: 'Proyector Epson', diasSinMovimiento: 3, ultimoEstado: 'En Diagnóstico' },
];

// Badge de prioridad
const PrioridadBadge = ({ prioridad }) => {
  const styles = {
    URGENTE: 'bg-red-100 text-red-800',
    ALTA: 'bg-orange-100 text-orange-800',
    MEDIA: 'bg-yellow-100 text-yellow-800',
    BAJA: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[prioridad] || 'bg-gray-100 text-gray-800'}`}>
      {prioridad}
    </span>
  );
};

// Badge de estado
const EstadoBadge = ({ estado }) => {
  const styles = {
    Pendiente: 'bg-yellow-100 text-yellow-800',
    Aprobado: 'bg-green-100 text-green-800',
    Desaprobado: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-gray-800'}`}>
      {estado}
    </span>
  );
};

const JefeDashboard = () => {
  const [equiposPendientes, setEquiposPendientes] = useState(mockEquiposPendientes);
  const [solicitudesRepuesto, setSolicitudesRepuesto] = useState(mockSolicitudesRepuesto);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('asignacion');

  // useEffect para cargar datos desde API
  useEffect(() => {
    // TODO: Implementar llamadas a API
    // const fetchEquipos = async () => {
    //   const response = await fetch('/api/equipos/pendientes');
    //   const data = await response.json();
    //   setEquiposPendientes(data);
    // };
    // const fetchSolicitudes = async () => {
    //   const response = await fetch('/api/repuestos/solicitudes');
    //   const data = await response.json();
    //   setSolicitudesRepuesto(data);
    // };
  }, []);

  // Manejar asignación de técnico
  const handleAsignarTecnico = (ordenId, tecnicoId) => {
    setEquiposPendientes((prev) =>
      prev.map((equipo) =>
        equipo.id === ordenId ? { ...equipo, tecnicoAsignado: tecnicoId } : equipo
      )
    );
    // TODO: Llamar a API
    // await fetch('/api/ordenes/asignar', {
    //   method: 'POST',
    //   body: JSON.stringify({ ordenId, tecnicoId }),
    // });
  };

  // Manejar aprobación de repuesto
  const handleAprobarRepuesto = (solicitudId) => {
    setSolicitudesRepuesto((prev) =>
      prev.map((sol) =>
        sol.id === solicitudId ? { ...sol, estado: 'Aprobado' } : sol
      )
    );
    // TODO: Llamar a API
    // await fetch(`/api/repuestos/${solicitudId}/aprobar`, { method: 'POST' });
  };

  // Manejar rechazo de repuesto
  const handleRechazarRepuesto = (solicitudId) => {
    setSolicitudesRepuesto((prev) =>
      prev.map((sol) =>
        sol.id === solicitudId ? { ...sol, estado: 'Desaprobado' } : sol
      )
    );
    // TODO: Llamar a API
    // await fetch(`/api/repuestos/${solicitudId}/rechazar`, { method: 'POST' });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Panel del Jefe Técnico</h1>
            <p className="text-gray-600">Gestión de técnicos y aprobación de repuestos</p>
          </div>

          {/* Tabs de navegación */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('asignacion')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'asignacion'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users size={18} />
                Asignar Técnicos
              </button>
              <button
                onClick={() => setActiveTab('repuestos')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'repuestos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package size={18} />
                Aprobar Repuestos
              </button>
              <button
                onClick={() => setActiveTab('criticas')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'criticas'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle size={18} />
                Órdenes Críticas
              </button>
            </nav>
          </div>

          {/* Contenido según tab */}
          {activeTab === 'asignacion' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Equipos Pendientes de Diagnóstico</h3>
                <p className="text-sm text-gray-500">Selecciona un técnico para asignar cada equipo</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Falla</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignar a</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equiposPendientes.map((equipo) => (
                      <tr key={equipo.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{equipo.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{equipo.cliente}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{equipo.equipo}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{equipo.falla}</td>
                        <td className="px-4 py-3">
                          <PrioridadBadge prioridad={equipo.prioridad} />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={equipo.tecnicoAsignado || ''}
                            onChange={(e) => handleAsignarTecnico(equipo.id, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleccionar...</option>
                            {mockTecnicos.filter(t => t.activo).map((tecnico) => (
                              <option key={tecnico.id} value={tecnico.id}>
                                {tecnico.nombre} - {tecnico.especialidad}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab de aprobación de repuestos */}
          {activeTab === 'repuestos' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Solicitudes de Repuestos</h3>
                <p className="text-sm text-gray-500">Revisa y aprueba las solicitudes de tus técnicos</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repuesto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {solicitudesRepuesto.map((sol) => (
                      <tr key={sol.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{sol.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{sol.ordenId}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sol.solicitante}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sol.repuesto}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sol.cantidad}</td>
                        <td className="px-4 py-3">
                          <PrioridadBadge prioridad={sol.prioridad} />
                        </td>
                        <td className="px-4 py-3">
                          <EstadoBadge estado={sol.estado} />
                        </td>
                        <td className="px-4 py-3">
                          {sol.estado === 'Pendiente' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAprobarRepuesto(sol.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm transition-colors"
                              >
                                <CheckCircle size={14} />
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleRechazarRepuesto(sol.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition-colors"
                              >
                                <X size={14} />
                                Rechazar
                              </button>
                            </div>
                          )}
                          {sol.estado !== 'Pendiente' && (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab de órdenes críticas */}
          {activeTab === 'criticas' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-red-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-800">Órdenes Críticas</h3>
                </div>
                <p className="text-sm text-red-600 ml-7">Reparaciones con más de 3 días sin movimiento</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días Sin Movimiento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockOrdenesCriticas.map((orden) => (
                      <tr key={orden.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{orden.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{orden.cliente}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{orden.equipo}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Clock size={12} className="mr-1" />
                            {orden.diasSinMovimiento} días
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{orden.ultimoEstado}</td>
                        <td className="px-4 py-3">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                            Ver detalles
                            <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mockOrdenesCriticas.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                  <p>No hay órdenes críticas</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default JefeDashboard;