import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Users, Laptop, Truck, Package,
  ReceiptText, Stethoscope, Filter, Tags, AlertCircle
} from 'lucide-react';
import { getClientes } from '../../services/secretaria/clientesService';
import { getEquipos } from '../../services/secretaria/equiposService';
import { getOrdenes } from '../../services/secretaria/ordenesService';
import { getProveedores } from '../../services/secretaria/proveedoresService';
import { getRepuestos } from '../../services/secretaria/repuestosService';
import { getTiposRepuesto } from '../../services/secretaria/tiposRepuestoService';
import { getFacturas } from '../../services/secretaria/facturasService';
import { getDiagnosticos } from '../../services/secretaria/diagnosticoService';

const dateFields = {
  clientes: [],
  equipos: [],
  ordenes: ['fecha_ingreso', 'createdAt'],
  proveedores: [],
  repuestos: [],
  tiposRepuesto: [],
  facturas: ['fecha_emision'],
  diagnosticos: ['fecha_hora', 'fecha_asignacion'],
};

const getItemDate = (item, fields) => {
  const rawDate = fields.map((field) => item?.[field]).find(Boolean);
  if (!rawDate) return null;

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const filterItemsByDate = (items, fields, filterType) => {
  if (!items || !Array.isArray(items)) return [];
  if (filterType === 'all') return items;
  if (!fields.length) return items;

  const now = new Date();

  return items.filter((item) => {
    const itemDate = getItemDate(item, fields);
    if (!itemDate) return false;

    if (filterType === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= weekAgo;
    }

    if (filterType === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }

    if (filterType === 'year') {
      return itemDate.getFullYear() === now.getFullYear();
    }

    return true;
  });
};

const sortOrdenesRecientes = (ordenes) => (
  [...ordenes].sort((a, b) => {
    const dateA = getItemDate(a, dateFields.ordenes)?.getTime() || 0;
    const dateB = getItemDate(b, dateFields.ordenes)?.getTime() || 0;
    if (dateB !== dateA) return dateB - dateA;
    return Number(b.id_orden || 0) - Number(a.id_orden || 0);
  })
);

const SecretariaDashboard = () => {
  const [rawData, setRawData] = useState({
    clientes: [],
    equipos: [],
    ordenes: [],
    proveedores: [],
    repuestos: [],
    tiposRepuesto: [],
    facturas: [],
    diagnosticos: [],
  });

  const [stats, setStats] = useState({
    clientes: 0,
    equipos: 0,
    ordenes: 0,
    proveedores: 0,
    repuestos: 0,
    tiposRepuesto: 0,
    facturas: 0,
    diagnosticos: 0,
  });

  const [filteredOrdenes, setFilteredOrdenes] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Usamos Promise.allSettled para evitar que la caída de un servicio tire abajo todo el módulo
        const resultados = await Promise.allSettled([
          getClientes(),
          getEquipos(),
          getOrdenes(),
          getProveedores(),
          getRepuestos(),
          getTiposRepuesto(),
          getFacturas(),
          getDiagnosticos(),
        ]);

        const extraeData = (res, backupKey) => {
          if (res.status === 'fulfilled' && res.value?.data) {
            // Maneja el formato limpio nuevo { ordenes: [...] } o el formato estándar .data o .data.data
            return res.value.data[backupKey] || res.value.data.data || res.value.data || [];
          }
          return [];
        };

        if (resultados[2].status === 'rejected') {
          console.error('El servicio de órdenes falló al responder:', resultados[2].reason);
          setError('Aviso: No se pudieron sincronizar las órdenes de trabajo actuales.');
        }

        setRawData({
          clientes: extraeData(resultados[0], 'clientes'),
          equipos: extraeData(resultados[1], 'equipos'),
          ordenes: extraeData(resultados[2], 'ordenes'),
          proveedores: extraeData(resultados[3], 'proveedores'),
          repuestos: extraeData(resultados[4], 'repuestos'),
          tiposRepuesto: extraeData(resultados[5], 'tiposRepuesto'),
          facturas: extraeData(resultados[6], 'facturas'),
          diagnosticos: extraeData(resultados[7], 'diagnosticos'),
        });
      } catch (err) {
        console.error(err);
        setError('Ocurrió un problema crítico al procesar los paneles informativos.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const filtered = {
      clientes: filterItemsByDate(rawData.clientes, dateFields.clientes, filterType),
      equipos: filterItemsByDate(rawData.equipos, dateFields.equipos, filterType),
      ordenes: filterItemsByDate(rawData.ordenes, dateFields.ordenes, filterType),
      proveedores: filterItemsByDate(rawData.proveedores, dateFields.proveedores, filterType),
      repuestos: filterItemsByDate(rawData.repuestos, dateFields.repuestos, filterType),
      tiposRepuesto: filterItemsByDate(rawData.tiposRepuesto, dateFields.tiposRepuesto, filterType),
      facturas: filterItemsByDate(rawData.facturas, dateFields.facturas, filterType),
      diagnosticos: filterItemsByDate(rawData.diagnosticos, dateFields.diagnosticos, filterType),
    };

    setStats({
      clientes: filtered.clientes.length,
      equipos: filtered.equipos.length,
      ordenes: filtered.ordenes.length,
      proveedores: filtered.proveedores.length,
      repuestos: filtered.repuestos.length,
      tiposRepuesto: filtered.tiposRepuesto.length,
      facturas: filtered.facturas.length,
      diagnosticos: filtered.diagnosticos.length,
    });

    setFilteredOrdenes(sortOrdenesRecientes(filtered.ordenes).slice(0, 5));
  }, [filterType, rawData]);

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
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Secretaría</h1>
            <p className="text-gray-500 font-medium">Gestión operativa - {filterType === 'all' ? 'Historial completo' : `Filtro: ${filterType.toUpperCase()}`}</p>
          </div>
        </div>

        <div className="flex items-center bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
          {[
            { id: 'all', label: 'Todo' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' },
            { id: 'year', label: 'Año' },
          ].map((filter) => (
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
              Últimas órdenes ({filterType})
            </h2>
            <p className="text-sm text-gray-500 font-medium">Órdenes generadas en el sistema técnico.</p>
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
                <th className="px-4 py-3 border-b border-gray-100">Técnico</th>
                <th className="px-4 py-3 border-b border-gray-100 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrdenes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-gray-400 italic font-medium">
                    No se encontraron órdenes registradas en este periodo
                  </td>
                </tr>
              ) : (
                filteredOrdenes.map((orden) => (
                  <tr key={orden.id_orden} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-indigo-600">#{orden.id_orden}</td>
                    <td className="px-4 py-3">{orden.fecha_ingreso || orden.createdAt ? new Date(orden.fecha_ingreso || orden.createdAt).toLocaleDateString() : '-'}</td>
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