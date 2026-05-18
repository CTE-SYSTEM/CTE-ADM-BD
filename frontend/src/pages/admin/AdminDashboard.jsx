import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Table from '../../components/Table';

const summaryCards = [
  { title: 'Equipos', key: 'equipos', color: 'from-sky-500 to-indigo-500' },
  { title: 'Repuestos', key: 'repuestos', color: 'from-emerald-500 to-teal-500' },
  { title: 'Órdenes', key: 'ordenes', color: 'from-indigo-500 to-violet-500' },
  { title: 'Facturas', key: 'facturas', color: 'from-orange-500 to-amber-500' },
  { title: 'Usuarios', key: 'usuarios', color: 'from-fuchsia-500 to-pink-500' },
  { title: 'Diagnósticos pendientes', key: 'diagnosticosPendientes', color: 'from-rose-500 to-red-500' },
  { title: 'Órdenes en reparación', key: 'ordenesEnReparacion', color: 'from-cyan-500 to-sky-500' },
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [res, equiposRes] = await Promise.all([
          api.get('/admin_pro/dashboard'),
          api.get('/admin_pro/equipos'),
        ]);
        const data = res.data;
        if (data.data) {
          setDashboard(data.data);
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
      } catch (e) {
        setError('Error de red o servidor');
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel avanzado de administración</h1>
          <p className="text-gray-500 mt-1">Accede rápidamente a los principales indicadores y gestiona la empresa desde aquí.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            {showHelp ? 'Ocultar ayuda' : 'Ayuda'}
          </button>
          <Link to="/admin/usuarios" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition">Usuarios</Link>
          <Link to="/admin/equipos" className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition">Equipos</Link>
          <Link to="/admin/ordenes" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">Órdenes</Link>
          <Link to="/admin/repuestos" className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition">Repuestos</Link>
          <Link to="/admin/compras" className="rounded-full bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 transition">Compras</Link>
          <Link to="/admin/tecnicos" className="rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700 transition">Técnicos</Link>
          <Link to="/admin/clientes" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition">Clientes</Link>
        </div>
      </div>

      {loading && <div className="rounded-xl bg-white p-6 shadow-sm text-gray-600">Cargando datos del panel...</div>}
      {error && <div className="rounded-xl bg-red-50 p-6 text-red-700 shadow-sm">{error}</div>}

      {showHelp && (
        <section className="rounded-3xl bg-slate-50 p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold">Cómo usar el panel Admin Pro</h2>
          <p className="mt-3 text-sm text-slate-600 leading-7">
            Este panel centraliza los principales indicadores de la administración. Usa los botones rápidos para navegar por las secciones de equipos,
            órdenes, repuestos, compras y usuarios.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 border border-slate-200">
              <p className="text-sm font-semibold text-slate-800">Resumen</p>
              <p className="mt-2 text-sm text-slate-600">Los bloques superiores muestran métricas clave de equipos, órdenes, garantías y usuarios.</p>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-200">
              <p className="text-sm font-semibold text-slate-800">Acciones rápidas</p>
              <p className="mt-2 text-sm text-slate-600">En la sección inferior encontrarás accesos directos para revisar equipos, gestionar órdenes y controlar inventario.</p>
            </div>
          </div>
        </section>
      )}

      {dashboard && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.key} className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100 min-h-[170px]">
                <div className={`inline-flex rounded-full bg-gradient-to-r ${card.color} bg-opacity-10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-700`}>{card.title}</div>
                <div className="mt-6 flex items-end gap-3">
                  <span className="text-4xl font-bold text-slate-900">{dashboard.totals[card.key] ?? 0}</span>
                  <span className="text-sm text-gray-500">Resultados</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr_0.9fr]">
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Órdenes recientes</h2>
                  <p className="text-sm text-gray-500">Las últimas 5 órdenes registradas.</p>
                </div>
              </div>
              <Table columns={latestOrdersColumns} data={dashboard.latestOrders} />
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Vista previa de equipos</h2>
                  <p className="text-sm text-gray-500">Equipos registrados para revisar sin salir del panel.</p>
                </div>
                <Link
                  to="/admin/equipos"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Ver todos
                </Link>
              </div>
              <Table columns={equiposPreviewColumns} data={equiposPreview} />
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Garantías por vencer</h2>
                <p className="text-sm text-gray-500">Garantías que expiran en los próximos 30 días.</p>
              </div>
              <Table columns={upcomingGarantiasColumns} data={dashboard.upcomingGarantias} />
            </section>
          </div>

          <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Acciones rápidas</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link to="/admin/usuarios" className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">Administrar usuarios</Link>
              <Link to="/admin/equipos" className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">Revisar equipos</Link>
              <Link to="/admin/ordenes" className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">Gestionar órdenes</Link>
              <Link to="/admin/inventario" className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">Control de inventario</Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
