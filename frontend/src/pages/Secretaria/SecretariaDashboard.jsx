import React from 'react';
import { Users, Laptop, Package, Truck, FileText, Clock } from 'lucide-react';
import MissionVision from '../../components/MissionVision';
import Table from '../../components/Table';

const SecretariaDashboard = () => {
  // Datos de ejemplo - reemplazar con datos reales de la API
  const stats = {
    clientes: 45,
    equipos: 78,
    repuestos: 156,
    proveedores: 12,
    ordenesPendientes: 8,
    ordenesHoy: 3,
  };

  // Órdenes recientes
  const ordenesRecientes = [
    { id: 'ORD-001', cliente: 'Juan Pérez', equipo: 'Laptop HP', estado: 'Pendiente', fecha: '2026-04-25' },
    { id: 'ORD-002', cliente: 'María García', equipo: 'Impresora Epson', estado: 'En Revisión', fecha: '2026-04-25' },
    { id: 'ORD-003', cliente: 'Carlos López', equipo: 'Computadora Dell', estado: 'Completado', fecha: '2026-04-24' },
    { id: 'ORD-004', cliente: 'Ana Martínez', equipo: 'Tablet Samsung', estado: 'Pendiente', fecha: '2026-04-24' },
  ];

  const columnasOrdenes = [
    { header: 'ID', accessor: 'id' },
    { header: 'Cliente', accessor: 'cliente' },
    { header: 'Equipo', accessor: 'equipo' },
    { header: 'Estado', accessor: 'estado' },
    { header: 'Fecha', accessor: 'fecha' },
  ];

  // Tarjetas de estadísticas
  const statCards = [
    { title: 'Clientes Registrados', value: stats.clientes, icon: Users, color: 'bg-blue-500' },
    { title: 'Equipos en Taller', value: stats.equipos, icon: Laptop, color: 'bg-green-500' },
    { title: 'Repuestos en Stock', value: stats.repuestos, icon: Package, color: 'bg-purple-500' },
    { title: 'Proveedores', value: stats.proveedores, icon: Truck, color: 'bg-orange-500' },
    { title: 'Órdenes Pendientes', value: stats.ordenesPendientes, icon: Clock, color: 'bg-red-500' },
    { title: 'Órdenes del Día', value: stats.ordenesHoy, icon: FileText, color: 'bg-teal-500' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Bienvenida */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Bienvenido a CTE
        </h1>
        <p className="text-gray-500">
          Centro Técnico Electrónico - Panel de Secretaria
        </p>
      </div>

      {/* Misión y Visión */}
      <MissionVision />

      {/* Estadísticas */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Resumen del Día
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Órdenes Recientes */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Órdenes Recientes
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table columns={columnasOrdenes} data={ordenesRecientes} />
        </div>
      </div>
    </div>
  );
};

export default SecretariaDashboard;