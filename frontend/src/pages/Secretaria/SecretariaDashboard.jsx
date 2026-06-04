import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ClipboardList,
  Filter,
  Laptop,
  Package,
  ReceiptText,
  Stethoscope,
  Tags,
  Truck,
  Users,
} from 'lucide-react';
import { getSecretariaDashboard } from '../../services/secretaria/dashboardService';

const EMPTY_STATS = {
  clientes: 0,
  equipos: 0,
  ordenes: 0,
  proveedores: 0,
  repuestos: 0,
  tiposRepuesto: 0,
  facturas: 0,
  diagnosticos: 0,
};

const filters = [
  { id: 'all', label: 'Todo' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Anio' },
];

const getOrderDate = (orden) => {
  const rawDate = orden?.fecha_ingreso || orden?.createdAt;
  if (!rawDate) return 0;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const sortOrdenesRecientes = (ordenes = []) => (
  [...ordenes].sort((a, b) => {
    const dateDiff = getOrderDate(b) - getOrderDate(a);
    if (dateDiff !== 0) return dateDiff;
    return Number(b.id_orden || 0) - Number(a.id_orden || 0);
  })
);

const normalizeStats = (stats = {}) => ({
  clientes: Number(stats.clientes || 0),
  equipos: Number(stats.equipos || 0),
  ordenes: Number(stats.ordenes || 0),
  proveedores: Number(stats.proveedores || 0),
  repuestos: Number(stats.repuestos || 0),
  tiposRepuesto: Number(stats.tiposRepuesto || 0),
  facturas: Number(stats.facturas || 0),
  diagnosticos: Number(stats.diagnosticos || 0),
});

const SecretariaDashboard = () => {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [filteredOrdenes, setFilteredOrdenes] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHelp] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getSecretariaDashboard(filterType);
        const dashboard = response.data?.data || {};

        setStats(normalizeStats(dashboard.stats));
        setFilteredOrdenes(sortOrdenesRecientes(dashboard.recentOrders || []).slice(0, 5));
      } catch (err) {
        console.error(err);
        setError('Ocurrio un problema al cargar el dashboard de Secretaria.');
        setStats(EMPTY_STATS);
        setFilteredOrdenes([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [filterType]);

  const quickActions = [
    { title: 'Clientes', value: stats.clientes, icon: Users, url: '/secretaria/clientes', color: 'bg-blue-600' },
    { title: 'Equipos', value: stats.equipos, icon: Laptop, url: '/secretaria/equipos', color: 'bg-cyan-600' },
    { title: 'Diagnostico', value: stats.diagnosticos, icon: Stethoscope, url: '/secretaria/diagnostico', color: 'bg-purple-600' },
    { title: 'Ordenes', value: stats.ordenes, icon: ClipboardList, url: '/secretaria/nueva-orden', color: 'bg-indigo-600' },
    { title: 'Repuestos', value: stats.repuestos, icon: Package, url: '/secretaria/repuestos', color: 'bg-amber-600' },
    { title: 'Tipos Repuesto', value: stats.tiposRepuesto, icon: Tags, url: '/secretaria/tipos-repuesto', color: 'bg-violet-600' },
    { title: 'Proveedores', value: stats.proveedores, icon: Truck, url: '/secretaria/proveedores', color: 'bg-slate-700' },
    { title: 'Facturas', value: stats.facturas, icon: ReceiptText, url: '/secretaria/facturacion', color: 'bg-rose-600' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Secretaria</h1>
            <p className="text-gray-500 font-medium">Gestion operativa - {filterType === 'all' ? 'Historial completo' : `Filtro: ${filterType.toUpperCase()}`}</p>
          </div>
        </div>

        <div className="flex items-center bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterType(filter.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filterType === filter.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {showHelp && (
        <section className="mb-8 rounded-2xl bg-slate-950 p-6 text-white shadow-sm space-y-4 animate-fade-in">
          <h2 className="text-lg font-bold">Mini tutorial de Secretaria</h2>
        </section>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 text-left">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          {error}
        </div>
      )}

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} to={action.url} className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all hover:-translate-y-1">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-white ${action.color} mb-3 shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-bold text-gray-900">{loading ? '...' : action.value}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">{action.title}</div>
            </Link>
          );
        })}
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="text-left">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-500" />
              Ultimas ordenes ({filterType})
            </h2>
            <p className="text-sm text-gray-500 font-medium">Ordenes generadas en el sistema tecnico.</p>
          </div>
          <Link to="/secretaria/nueva-orden" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100">
            Nueva orden
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-600">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="px-4 py-3 border-b border-gray-100">Orden</th>
                <th className="px-4 py-3 border-b border-gray-100">Fecha</th>
                <th className="px-4 py-3 border-b border-gray-100">Cliente</th>
                <th className="px-4 py-3 border-b border-gray-100">Equipo</th>
                <th className="px-4 py-3 border-b border-gray-100">Tecnico</th>
                <th className="px-4 py-3 border-b border-gray-100 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrdenes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-gray-400 italic font-medium">
                    No se encontraron ordenes registradas en este periodo
                  </td>
                </tr>
              ) : (
                filteredOrdenes.map((orden) => (
                  <tr key={orden.id_orden} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-indigo-600">#{orden.id_orden}</td>
                    <td className="px-4 py-3">{orden.fecha_ingreso ? new Date(orden.fecha_ingreso).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{orden.diagnostico?.equipo?.cliente?.nombre || 'General'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {[orden.diagnostico?.equipo?.marca, orden.diagnostico?.equipo?.modelo].filter(Boolean).join(' ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{orden.tecnico?.nombre || 'Sin asignar'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black border ${
                        orden.estado === 'FINALIZADO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {(orden.estado || 'PENDIENTE').replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SecretariaDashboard;
