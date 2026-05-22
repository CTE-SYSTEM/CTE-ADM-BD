import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Table from '../../components/Table';
import MetricBarChart from '../../components/MetricBarChart';

const summaryCards = [
  { title: 'Equipos', key: 'equipos', color: 'bg-sky-50 text-sky-700 border-sky-100' },
  { title: 'Repuestos', key: 'repuestos', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { title: 'Órdenes', key: 'ordenes', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { title: 'Facturas', key: 'facturas', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  { title: 'Usuarios', key: 'usuarios', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100' },
  { title: 'Diagnósticos pendientes', key: 'diagnosticosPendientes', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  { title: 'Órdenes en reparación', key: 'ordenesEnReparacion', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
];

const latestOrdersColumns = [
  { header: 'ID', accessor: 'id_orden' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Estado', accessor: 'estado' },
  { header: 'Técnico', accessor: 'tecnico' },
  { header: 'Ingreso', accessor: 'fecha_ingreso' },
];

const upcomingGarantiasColumns = [
  { header: 'Garantía', accessor: 'id_garantia' },
  { header: 'Factura', accessor: 'factura_id' },
  { header: 'Orden', accessor: 'orden_id' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Vence', accessor: 'fecha_vencimiento' },
];

const equiposPreviewColumns = [
  { header: 'ID', accessor: 'id_equipo' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Estado', accessor: 'estado' },
];

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [equiposPreview, setEquiposPreview] = useState([]);
  const [productividad, setProductividad] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [res, equiposRes, productividadRes] = await Promise.all([
          api.get('/admin_pro/dashboard'),
          api.get('/admin_pro/equipos'),
          api.get('/admin_pro/analitica/productividad'),
        ]);
        const data = res.data;
        if (data.data) {
          setDashboard(data.data);
          setProductividad(productividadRes.data?.data || null);
          setEquiposPreview(
            (equiposRes.data?.data || []).slice(0, 6).map((equipo) => ({
              id_equipo: equipo.id_equipo,
              cliente: equipo.cliente?.nombre || '-',
              equipo: [equipo.marca, equipo.modelo].filter(Boolean).join(' ') || equipo.tipo || '-',
              estado: equipo.diagnosticos?.[0]?.estado_del_diagnostico || '-',
            }))
          );
        } else {
          setError('No se pudo cargar el panel de administración');
        }
      } catch {
        setError('Error de red o servidor');
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel avanzado de administración</h1>
          <p className="text-gray-400 text-sm mt-0.5">Accede rápidamente a los principales indicadores de la empresa.</p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            {showHelp ? 'Ocultar ayuda' : 'Ayuda'}
          </button>
        </div>
      </div>

      {loading && <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-400 text-center">Cargando datos del panel...</div>}
      {error && <div className="rounded-2xl bg-red-50 p-6 text-red-700 shadow-sm">{error}</div>}

      {/* Banner Informativo / Ayuda (Estilo Bloque Oscuro) */}
      {showHelp && (
        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm space-y-4 animate-fade-in">
          <div>
            <h2 className="text-lg font-bold">Cómo usar el panel Admin Pro</h2>
            <p className="mt-1 text-sm text-slate-300">
              Este panel centraliza las operaciones del sistema. A continuación dispones de un resumen de cómo se estructuran las métricas actuales:
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-900 p-4 border border-slate-800">
              <p className="text-sm font-semibold text-indigo-400">Tarjetas de Resumen</p>
              <p className="mt-1 text-xs text-slate-400">Muestran totales globales en tiempo real del estado de la empresa.</p>
            </div>
            <div className="rounded-xl bg-slate-900 p-4 border border-slate-800">
              <p className="text-sm font-semibold text-emerald-400">Tablas de Monitoreo</p>
              <p className="mt-1 text-xs text-slate-400">Monitorea órdenes entrantes, garantías próximas a vencer e ingresos de equipos.</p>
            </div>
          </div>
        </section>
      )}

      {dashboard && (
        <>
          {/* Bloques de Métricas Recortadas (Cards) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.key} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[140px]">
                <div className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${card.color}`}>
                  {card.title}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{dashboard.totals[card.key] ?? 0}</span>
                  <span className="text-xs font-medium text-gray-400">totales</span>
                </div>
              </div>
            ))}
          </div>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Productividad mensual y anual</h2>
                <p className="text-sm text-gray-400">Compara diagnosticos, ordenes cerradas y facturacion del equipo tecnico.</p>
              </div>
              <Link
                to="/admin/tecnicos"
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Ver tecnicos
              </Link>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Mes a mes {productividad?.year || ''}
                </p>
                <MetricBarChart
                  data={(productividad?.monthly || []).map((item) => ({
                    ...item,
                    etiqueta: item.etiqueta || item.mes,
                  }))}
                  labelKey="etiqueta"
                  series={[
                    { key: 'diagnosticos', label: 'Diagnosticos', color: '#4f46e5' },
                    { key: 'ordenes_finalizadas', label: 'Ordenes cerradas', color: '#059669' },
                  ]}
                />
              </div>

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-500">
                  Resumen anual
                </p>
                <MetricBarChart
                  data={(productividad?.yearly || []).map((item) => ({
                    ...item,
                    etiqueta: String(item.anio),
                  }))}
                  labelKey="etiqueta"
                  series={[
                    { key: 'diagnosticos', label: 'Diagnosticos', color: '#4f46e5' },
                    { key: 'ordenes_finalizadas', label: 'Ordenes cerradas', color: '#059669' },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* Grid de Contenido Principal (Tablas Balanceadas) */}
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* Órdenes Recientes */}
            <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-800">Órdenes recientes</h2>
                <p className="text-sm text-gray-400">Las últimas 5 órdenes registradas en el sistema.</p>
              </div>
              <div className="overflow-x-auto">
                <Table columns={latestOrdersColumns} data={dashboard.latestOrders} sortable />
              </div>
            </section>

            {/* Vista Previa de Equipos */}
            <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Vista previa de equipos</h2>
                  <p className="text-sm text-gray-400">Equipos pendientes de revisión en taller.</p>
                </div>
                <Link
                  to="/admin/equipos"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Ver todos
                </Link>
              </div>
              <div className="overflow-x-auto">
                <Table columns={equiposPreviewColumns} data={equiposPreview} sortable />
              </div>
            </section>

            {/* Garantías por Vencer (Ocupa el ancho completo en pantallas grandes si queda sola) */}
            <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-800">Garantías por vencer</h2>
                <p className="text-sm text-gray-400">Alertas de garantías que expiran en los próximos 30 días.</p>
              </div>
              <div className="overflow-x-auto">
                <Table columns={upcomingGarantiasColumns} data={dashboard.upcomingGarantias} sortable />
              </div>
            </section>
          </div>

          {/* Sección Unificada de Acciones Rápidas */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Módulos de acceso rápido</h2>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <Link to="/admin/usuarios" className="rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition">Usuarios</Link>
              <Link to="/admin/equipos" className="rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition">Equipos</Link>
              <Link to="/admin/ordenes" className="rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition">Órdenes</Link>
              <Link to="/admin/repuestos" className="rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition">Repuestos</Link>
              <Link to="/admin/compras" className="rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition">Compras</Link>
              <Link to="/admin/ganancias" className="rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition">Ganancias</Link>
              <Link to="/admin/tecnicos" className="rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition">Técnicos</Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
