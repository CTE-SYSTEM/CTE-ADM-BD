import React from 'react';
import ServiceCard from '../../components/ServiceCard';
import Table from '../../components/Table';
import { IconDashboard, IconClientes, IconTecnicos, IconEquipos, IconOrdenes, IconInventario, IconFacturacion } from '../../components/icons';

const mainServices = [
  { title: 'Home', icon: IconDashboard, color: 'bg-indigo-400', count: 14, notification: 2 },
  { title: 'Calendar', icon: IconFacturacion, color: 'bg-yellow-400', count: 5, notification: 1 },
  { title: 'Files', icon: IconEquipos, color: 'bg-blue-400', count: 21, notification: 0 },
  { title: 'Companies', icon: IconClientes, color: 'bg-pink-400', count: 17, notification: 3 },
];

const secondaryServices = [
  { title: 'Tasks', icon: IconOrdenes },
  { title: 'FAQs', icon: IconInventario },
  { title: 'Birthdays', icon: IconTecnicos },
  { title: 'Favorites', icon: IconDashboard },
  { title: 'Company parties', icon: IconClientes },
  { title: 'Schedule', icon: IconFacturacion },
  { title: 'Goals', icon: IconEquipos },
  { title: 'Timelogs', icon: IconOrdenes },
  { title: 'Folders', icon: IconInventario },
  { title: 'Employees', icon: IconTecnicos },
  { title: 'Notifications', icon: IconDashboard },
  { title: 'News', icon: IconClientes },
];

const Dashboard = () => {
  // sample summary numbers (replace with real API data later)
  const summary = {
    servicesDone: 124,
    spareParts: 58,
    technicians: 12,
    pendingOrders: 7,
  };

  const recentColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Cliente', accessor: 'client' },
    { header: 'Equipo', accessor: 'device' },
    { header: 'Estado', accessor: 'status' },
  ];
  const recentData = [
    { id: 'ORD-1001', client: 'ACME SA', device: 'Impresora X', status: 'Pendiente' },
    { id: 'ORD-1002', client: 'Grupo Beta', device: 'Router Z', status: 'En progreso' },
    { id: 'ORD-1003', client: 'Tienda 9', device: 'PC-3', status: 'Finalizado' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
        <p className="text-gray-500">Resumen de la empresa y actividad reciente</p>
      </div>

      <div className="summary-grid mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="summary-card p-4 rounded-lg shadow-soft">
          <div className="text-sm text-muted">Servicios realizados</div>
          <div className="text-2xl font-bold">{summary.servicesDone}</div>
        </div>
        <div className="summary-card p-4 rounded-lg shadow-soft">
          <div className="text-sm text-muted">Repuestos en stock</div>
          <div className="text-2xl font-bold">{summary.spareParts}</div>
        </div>
        <div className="summary-card p-4 rounded-lg shadow-soft">
          <div className="text-sm text-muted">Técnicos activos</div>
          <div className="text-2xl font-bold">{summary.technicians}</div>
        </div>
        <div className="summary-card p-4 rounded-lg shadow-soft">
          <div className="text-sm text-muted">Órdenes pendientes</div>
          <div className="text-2xl font-bold">{summary.pendingOrders}</div>
        </div>
      </div>
      <div className="service-grid-main grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainServices.map((svc, idx) => (
          <ServiceCard key={svc.title} {...svc} />
        ))}
      </div>
      <div className="service-grid-secondary grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {secondaryServices.map((svc, idx) => (
          <ServiceCard key={svc.title} {...svc} color="bg-white" />
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Órdenes recientes</h3>
        <Table columns={recentColumns} data={recentData} />
      </div>
    </div>
  );
};

export default Dashboard;