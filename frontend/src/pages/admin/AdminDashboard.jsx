import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Table from '../../components/Table';
import MetricBarChart from '../../components/MetricBarChart';

const formatCurrency = (value) => `C$ ${Number(value || 0).toFixed(2)}`;

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

const dashboardSections = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'backups', label: 'Backups' },
  { id: 'productividad', label: 'Productividad' },
  { id: 'monitoreo', label: 'Monitoreo' },
  { id: 'modulos', label: 'Modulos' },
];

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [equiposPreview, setEquiposPreview] = useState([]);
  const [productividad, setProductividad] = useState(null);
  const [ganancias, setGanancias] = useState(null);
  const [activeSection, setActiveSection] = useState('resumen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backups, setBackups] = useState({ root: '', months: [] });
  const [backupError, setBackupError] = useState('');
  const [backupMessage, setBackupMessage] = useState('');
  const [manualBackupLoading, setManualBackupLoading] = useState(false);
  const showHelp = false;

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const [res, equiposRes, productividadRes, gananciasRes, backupsRes] = await Promise.all([
          api.get('/admin_pro/dashboard'),
          api.get('/admin_pro/equipos'),
          api.get('/admin_pro/analitica/productividad'),
          api.get(`/admin_pro/analitica/ganancias?fecha_inicio=${monthStart}&fecha_fin=${monthEnd}&detalle_limite=5`),
          api.get('/admin_pro/backups', { cache: false }),
        ]);

        const data = res.data;
        if (data.data) {
          setDashboard(data.data);
          setProductividad(productividadRes.data?.data || null);
          setGanancias(gananciasRes.data?.data || null);
          setBackups(backupsRes.data?.data || { root: '', months: [] });
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel avanzado de administración</h1>
        <p className="text-gray-400 text-sm mt-0.5">Accede rápidamente a los principales indicadores de la empresa.</p>
      </div>

      {/* Estados de Carga y Error */}
      {loading && (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-400 text-center">
          Cargando datos del panel...
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {/* Banner Informativo / Ayuda */}
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

      {/* Contenido del Dashboard */}
      {dashboard && (
        <>
          {/* Tarjetas de Métricas Globales */}
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

          {/* Resumen Financiero */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Resumen financiero del mes</h2>
                <p className="text-sm text-gray-400">Acceso rápido a ganancias, rentabilidad y pérdidas reales.</p>
              </div>
              <Link
                to="/admin/ganancias"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Ver ganancias
              </Link>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Ganancia neta', value: formatCurrency(ganancias?.totals?.ganancia_neta), tone: 'text-indigo-600' },
                { label: 'Rentabilidad', value: `${Number(ganancias?.totals?.rentabilidad_porcentaje || 0).toFixed(1)}%`, tone: 'text-emerald-600' },
                { label: 'Ordenes facturadas', value: ganancias?.totals?.ordenes_procesadas || 0, tone: 'text-slate-900' },
                { label: 'Perdidas reales', value: formatCurrency(ganancias?.totals?.perdidas_reales), tone: 'text-red-600' },
                { label: 'Compras inventario', value: formatCurrency(ganancias?.totals?.compras_inventario), tone: 'text-sky-600' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                  <p className={`mt-1 text-xl font-extrabold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Alertas Financieras */}
            {(ganancias?.alertas || []).length > 0 && (
              <div className="grid gap-3 lg:grid-cols-3">
                {ganancias.alertas.slice(0, 3).map((alerta) => (
                  <div key={`${alerta.titulo}-${alerta.detalle}`} className={`rounded-xl border p-3 ${alerta.nivel === 'alto' ? 'border-red-100 bg-red-50 text-red-800' : 'border-amber-100 bg-amber-50 text-amber-800'}`}>
                    <p className="text-xs font-black uppercase">{alerta.titulo}</p>
                    <p className="mt-1 text-xs font-semibold">{alerta.detalle}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Backups del sistema */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Backups del sistema</h2>
                <p className="text-sm text-gray-400">Revisa el historial de backups y crea uno manual cuando lo necesites.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setBackupError('');
                  setBackupMessage('');
                  setManualBackupLoading(true);
                  try {
                    const response = await api.post('/admin_pro/backups/manual');
                    setBackups(response.data?.data || backups);
                    setBackupMessage(response.data?.message || 'Backup generado correctamente.');
                  } catch (manualError) {
                    setBackupError(manualError.response?.data?.error || 'No se pudo generar el backup manual');
                  }
                  setManualBackupLoading(false);
                }}
                disabled={manualBackupLoading}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {manualBackupLoading ? 'Generando backup...' : 'Generar backup ahora'}
              </button>
            </div>

            {backupMessage && (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{backupMessage}</div>
            )}
            {backupError && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{backupError}</div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4 border border-gray-100">
                <p className="text-xs uppercase tracking-wider text-gray-400">Directorio</p>
                <p className="mt-2 text-sm text-slate-700 break-all">{backups.root || 'No disponible'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-gray-100">
                <p className="text-xs uppercase tracking-wider text-gray-400">Meses con backups</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{backups.months?.length ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-gray-100">
                <p className="text-xs uppercase tracking-wider text-gray-400">Último backup</p>
                <p className="mt-2 text-sm text-slate-700">
                  {backups.months?.[0]?.files?.[0] ? `${backups.months[0].month} / ${backups.months[0].files[0]}` : 'No registrado'}
                </p>
              </div>
            </div>

            {backups.months?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-800">
                  <thead>
                    <tr className="border-b border-gray-200 bg-slate-50 text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Mes</th>
                      <th className="px-4 py-3">Archivos</th>
                      <th className="px-4 py-3">Archivos recientes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.months.map((month) => (
                      <tr key={month.month} className="border-b border-gray-100">
                        <td className="px-4 py-3 font-semibold text-slate-900">{month.month}</td>
                        <td className="px-4 py-3">{month.fileCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {month.files.slice(0, 3).join(', ')}{month.files.length > 3 ? `, +${month.files.length - 3} más` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aún no hay backups generados en el sistema.</p>
            )}
          </section>

          {/* Gráficas de Productividad */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Productividad mensual y anual</h2>
                <p className="text-sm text-gray-400">Compara diagnósticos, órdenes cerradas y facturación del equipo técnico.</p>
              </div>
              <Link
                to="/admin/tecnicos"
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Ver técnicos
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
                    { key: 'diagnosticos', label: 'Diagnósticos', color: '#4f46e5' },
                    { key: 'ordenes_finalizadas', label: 'Órdenes cerradas', color: '#059669' },
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
                    { key: 'diagnosticos', label: 'Diagnósticos', color: '#4f46e5' },
                    { key: 'ordenes_finalizadas', label: 'Órdenes cerradas', color: '#059669' },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* Grid de Tablas de Monitoreo */}
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

            {/* Garantías por Vencer */}
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

          {/* Módulos de Acceso Rápido */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Módulos de acceso rápido</h2>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
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
