import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Users, Laptop, Truck, Package, ReceiptText } from 'lucide-react';
import { getClientes } from '../../services/clientesService';
import { getEquipos } from '../../services/equiposService';
import { getOrdenes } from '../../services/ordenesService';
import { getProveedores } from '../../services/proveedoresService';
import { getRepuestos } from '../../services/repuestosService';
import { getFacturas } from '../../services/facturasService';

const SecretariaDashboard = () => {
  const [stats, setStats] = useState({
    clientes: 0,
    equipos: 0,
    ordenes: 0,
    proveedores: 0,
    repuestos: 0,
    facturas: 0,
  });
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [clientes, equipos, ordenesResponse, proveedores, repuestos, facturas] = await Promise.all([
          getClientes(),
          getEquipos(),
          getOrdenes(),
          getProveedores(),
          getRepuestos(),
          getFacturas(),
        ]);

        const ordenesData = ordenesResponse.data.data || [];
        setStats({
          clientes: clientes.data.data?.length || 0,
          equipos: equipos.data.data?.length || 0,
          ordenes: ordenesData.length,
          proveedores: proveedores.data.data?.length || 0,
          repuestos: repuestos.data.data?.length || 0,
          facturas: facturas.data.data?.length || 0,
        });
        setOrdenes(ordenesData.slice(-5).reverse());
      } catch {
        setError('No se pudo cargar el dashboard de Secretaria');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const quickActions = [
    { title: 'Nueva Orden', value: stats.ordenes, icon: ClipboardList, url: '/secretaria/nueva-orden', color: 'bg-indigo-600' },
    { title: 'Clientes', value: stats.clientes, icon: Users, url: '/secretaria/clientes', color: 'bg-blue-600' },
    { title: 'Equipos', value: stats.equipos, icon: Laptop, url: '/secretaria/equipos', color: 'bg-emerald-600' },
    { title: 'Proveedores', value: stats.proveedores, icon: Truck, url: '/secretaria/proveedores', color: 'bg-slate-700' },
    { title: 'Repuestos', value: stats.repuestos, icon: Package, url: '/secretaria/repuestos', color: 'bg-amber-600' },
    { title: 'Facturas', value: stats.facturas, icon: ReceiptText, url: '/secretaria/facturacion', color: 'bg-rose-600' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Secretaria</h1>
            <p className="text-gray-500">Panel operativo conectado a la base de datos</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} to={action.url} className="group bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-white ${action.color} mb-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">{loading ? '-' : action.value}</div>
              <div className="text-sm text-gray-500">{action.title}</div>
            </Link>
          );
        })}
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Ultimas ordenes registradas</h2>
            <p className="text-sm text-gray-500">Datos leidos desde PostgreSQL.</p>
          </div>
          <Link to="/secretaria/nueva-orden" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Nueva orden
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-600">
            <thead>
              <tr>
                <th className="border-b border-gray-200 px-4 py-3">Orden</th>
                <th className="border-b border-gray-200 px-4 py-3">Cliente</th>
                <th className="border-b border-gray-200 px-4 py-3">Equipo</th>
                <th className="border-b border-gray-200 px-4 py-3">Tecnico</th>
                <th className="border-b border-gray-200 px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No hay ordenes registradas</td>
                </tr>
              )}
              {ordenes.map((orden) => (
                <tr key={orden.id_orden} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-3 font-medium text-gray-800">#{orden.id_orden}</td>
                  <td className="border-b border-gray-100 px-4 py-3">{orden.diagnostico?.equipo?.cliente?.nombre || ''}</td>
                  <td className="border-b border-gray-100 px-4 py-3">
                    {[orden.diagnostico?.equipo?.tipo, orden.diagnostico?.equipo?.marca, orden.diagnostico?.equipo?.modelo].filter(Boolean).join(' ')}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3">{orden.tecnico?.nombre || ''}</td>
                  <td className="border-b border-gray-100 px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {orden.estado || 'PENDIENTE'}
                    </span>
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
