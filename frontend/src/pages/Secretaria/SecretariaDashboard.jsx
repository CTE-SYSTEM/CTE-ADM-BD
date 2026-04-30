import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Laptop, ClipboardCheck, Truck } from 'lucide-react';

const SecretariaDashboard = () => {
  const quickActions = [
    {
      title: 'Ingresar Equipos',
      description: 'Registrar un equipo nuevo en taller para revisión y diagnóstico.',
      icon: Laptop,
      url: '/secretaria/equipos',
      color: 'bg-indigo-500',
    },
    {
      title: 'Ver Clientes',
      description: 'Acceder a la lista de clientes registrados y su información.',
      icon: Users,
      url: '/secretaria/clientes',
      color: 'bg-blue-500',
    },
    {
      title: 'Equipos Listos',
      description: 'Ver equipos listos para entrega y gestionar su salida.',
      icon: ClipboardCheck,
      url: '/secretaria/equipos',
      color: 'bg-emerald-500',
    },
  ];

  const equiposListos = [
    {
      id: 'EQ-101',
      cliente: 'Juan Pérez',
      equipo: 'Laptop HP Pavilion',
      fechaIngreso: '2026-04-18',
      estado: 'Listo para Entrega',
    },
    {
      id: 'EQ-102',
      cliente: 'María García',
      equipo: 'Impresora Epson L3150',
      fechaIngreso: '2026-04-20',
      estado: 'Listo para Entrega',
    },
    {
      id: 'EQ-103',
      cliente: 'Carlos López',
      equipo: 'Tablet Samsung Galaxy',
      fechaIngreso: '2026-04-22',
      estado: 'Listo para Entrega',
    },
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

      <section className="grid gap-4 md:grid-cols-3 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.url}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-white ${action.color} mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{action.title}</h2>
              <p className="text-sm text-gray-500">{action.description}</p>
              <div className="mt-4 inline-flex items-center text-indigo-600 group-hover:text-indigo-700 font-medium">
                Ver más
              </div>
            </Link>
          );
        })}
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Equipos listos para salida</h2>
            <p className="text-sm text-gray-500">Revisa los equipos preparados y tramita la entrega al cliente.</p>
          </div>
          <Link
            to="/secretaria/equipos"
            className="inline-flex items-center justify-center rounded-full border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Ver todos los equipos
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-600">
            <thead>
              <tr>
                <th className="border-b border-gray-200 px-4 py-3">Código</th>
                <th className="border-b border-gray-200 px-4 py-3">Cliente</th>
                <th className="border-b border-gray-200 px-4 py-3">Equipo</th>
                <th className="border-b border-gray-200 px-4 py-3">Fecha ingreso</th>
                <th className="border-b border-gray-200 px-4 py-3">Estado</th>
                <th className="border-b border-gray-200 px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {equiposListos.map((equipo) => (
                <tr key={equipo.id} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-3 font-medium text-gray-800">{equipo.id}</td>
                  <td className="border-b border-gray-100 px-4 py-3">{equipo.cliente}</td>
                  <td className="border-b border-gray-100 px-4 py-3">{equipo.equipo}</td>
                  <td className="border-b border-gray-100 px-4 py-3">{equipo.fechaIngreso}</td>
                  <td className="border-b border-gray-100 px-4 py-3">
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {equipo.estado}
                    </span>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3">
                    <button className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-white text-sm hover:bg-indigo-700 transition-colors">
                      <Truck className="mr-2 h-4 w-4" />
                      Salida
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SecretariaDashboard;