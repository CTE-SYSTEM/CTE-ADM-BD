import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileDown, FileText } from 'lucide-react';
import MetricBarChart from '../../components/MetricBarChart';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const currentYear = new Date().getFullYear();
const formatCurrency = (value) => `$ ${Number(value || 0).toFixed(2)}`;
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const detailColumns = [
  { header: 'Tipo', accessor: 'tipo' },
  { header: 'Fecha', accessor: 'fecha' },
  { header: 'Concepto', accessor: 'concepto' },
  { header: 'Monto', accessor: 'monto' },
  { header: 'Pago', accessor: 'metodo_pago' },
];

const chartSeries = [
  { key: 'ingresos', label: 'Ingresos', color: '#059669' },
  { key: 'compras_inventario', label: 'Compras inventario', color: '#0ea5e9' },
  { key: 'ganancia_neta', label: 'Ganancia neta', color: '#4f46e5' },
  { key: 'costo_repuestos_usados', label: 'Costo usado', color: '#d97706' },
  { key: 'perdidas_reales', label: 'Perdidas reales', color: '#991b1b' },
];

const quickFilters = [
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'anio', label: 'Anio' },
];

const periodFilters = [
  { key: 'semanal', label: 'Semanal' },
  { key: 'mensual', label: 'Mensual' },
  { key: 'anual', label: 'Anual' },
];

const orderMarginColumns = [
  { header: 'Orden', accessor: 'orden' },
  { header: 'Factura', accessor: 'factura' },
  { header: 'Fecha', accessor: 'fecha' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Tecnico', accessor: 'tecnico' },
  { header: 'Estado', accessor: 'estado' },
  { header: 'Facturado', accessor: 'total_facturado' },
  { header: 'Mano obra', accessor: 'mano_obra' },
  { header: 'Ganancia repuestos', accessor: 'ganancia_repuestos' },
  { header: 'Costo', accessor: 'costo_repuestos' },
  { header: 'Ganancia', accessor: 'ganancia_servicio' },
  { header: 'Margen', accessor: 'margen_porcentaje' },
];

const lossColumns = [
  { header: 'Accion', accessor: 'accion' },
  { header: 'Clasificacion', accessor: 'clasificacion' },
  { header: 'Fecha', accessor: 'fecha' },
  { header: 'Monto', accessor: 'monto' },
];

const profitabilityColumns = [
  { header: 'Periodo', accessor: 'etiqueta' },
  { header: 'Ingresos', accessor: 'ingresos' },
  { header: 'Compras inventario', accessor: 'compras_inventario' },
  { header: 'Costos consumidos', accessor: 'costo_repuestos_usados' },
  { header: 'Perdidas reales', accessor: 'perdidas_reales' },
  { header: 'Ganancia neta', accessor: 'ganancia_neta' },
  { header: 'Margen servicio', accessor: 'margen_servicio' },
  { header: 'Rentabilidad', accessor: 'rentabilidad_porcentaje' },
  { header: 'Ordenes', accessor: 'ordenes_procesadas' },
];

const exportButtonBase = 'inline-flex h-9 min-w-[72px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400 disabled:shadow-none';

function ExportButton({ children, format, ...props }) {
  const tone = format === 'pdf'
    ? 'bg-slate-800 hover:bg-slate-900'
    : 'bg-emerald-600 hover:bg-emerald-700';
  const Icon = format === 'pdf' ? FileText : FileDown;

  return (
    <button
      type="button"
      className={`${exportButtonBase} ${tone}`}
      title={format === 'pdf' ? 'Exportar a PDF' : 'Exportar a Excel / CSV'}
      {...props}
    >
      <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

function ExportActions({ disabled, onCsv, onPdf }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ExportButton format="csv" onClick={onCsv} disabled={disabled}>
        CSV
      </ExportButton>
      <ExportButton format="pdf" onClick={onPdf} disabled={disabled}>
        PDF
      </ExportButton>
    </div>
  );
}

export default function Ganancias() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('anio');
  const [activeMetric, setActiveMetric] = useState('all');
  const [activePeriod, setActivePeriod] = useState('mensual');
  const [detailLimit, setDetailLimit] = useState(12);
  const [comparePrevious, setComparePrevious] = useState(false);
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`);
  const [toDate, setToDate] = useState(`${currentYear}-12-31`);

  const fetchGanancias = useCallback(async (signal) => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams();
      if (fromDate) query.set('fecha_inicio', fromDate);
      if (toDate) query.set('fecha_fin', toDate);
      query.set('detalle_limite', String(detailLimit));

      const res = await api.get(`/admin_pro/analitica/ganancias?${query.toString()}`, { signal });
      setData(res.data?.data || null);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError('No se pudo cargar el modulo de ganancias.');
      }
    } finally {
      setLoading(false);
    }
  }, [detailLimit, fromDate, toDate]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => fetchGanancias(controller.signal));
    return () => controller.abort();
  }, [fetchGanancias]);

  const totals = useMemo(() => data?.totals || {}, [data]);
  const activos = useMemo(() => data?.activos || {}, [data]);
  const alertas = data?.alertas || [];
  const periodData = useMemo(() => (
    data?.periods?.[activePeriod] || data?.monthly || []
  ), [activePeriod, data]);
  const isPositiveBalance = Number(totals.ganancia_neta || 0) >= 0;
  const balanceLabel = isPositiveBalance ? 'Ganancia neta' : 'Perdida neta';
  const marginPercent = Number(totals.ingresos || 0)
    ? ((Number(totals.ganancia_neta || 0) / Number(totals.ingresos || 0)) * 100).toFixed(1)
    : '0.0';

  const selectedSeries = useMemo(() => (
    activeMetric === 'all'
      ? chartSeries
      : chartSeries.filter((serie) => serie.key === activeMetric)
  ), [activeMetric]);

  const metricCards = useMemo(() => ([
    { key: 'ingresos', label: 'Ingresos', value: totals.ingresos, detail: `${totals.facturas || 0} facturas`, tone: 'emerald' },
    { key: 'compras_inventario', label: 'Compras inventario', value: totals.compras_inventario, detail: `${totals.compras || 0} compras capitalizadas`, tone: 'sky' },
    { key: 'perdidas_reales', label: 'Perdidas reales', value: totals.perdidas_reales, detail: `${totals.ordenes_irreparables || 0} ordenes irreparables`, tone: 'red' },
    { key: 'ganancia_neta', label: balanceLabel, value: totals.ganancia_neta, detail: `Margen neto ${marginPercent}%`, tone: 'indigo' },
    { key: 'margen_servicio', label: 'Margen de servicios', value: totals.margen_servicio, detail: `${formatPercent(totals.rentabilidad_porcentaje)} rentabilidad`, tone: 'amber' },
  ]), [balanceLabel, marginPercent, totals]);

  const detail = useMemo(() => (
    (data?.detail || []).map((item) => ({
      ...item,
      fecha: item.fecha ? new Date(item.fecha).toLocaleDateString() : '-',
      monto: formatCurrency(item.monto),
      metodo_pago: item.metodo_pago || '-',
    }))
  ), [data]);

  const orderMargins = useMemo(() => (
    (data?.orderMargins || []).map((item) => ({
      ...item,
      orden: `#${item.id_orden}`,
      factura: `#${item.id_factura}`,
      fecha: item.fecha_emision ? new Date(item.fecha_emision).toLocaleDateString() : '-',
      total_facturado: formatCurrency(item.total_facturado),
      mano_obra: formatCurrency(item.mano_obra),
      ganancia_repuestos: formatCurrency(item.ganancia_repuestos),
      costo_repuestos: formatCurrency(item.costo_repuestos),
      ganancia_servicio: formatCurrency(item.ganancia_servicio),
      margen_porcentaje: formatPercent(item.margen_porcentaje),
    }))
  ), [data]);

  const losses = useMemo(() => (
    (data?.perdidas || []).map((item) => ({
      ...item,
      fecha: item.fecha ? new Date(item.fecha).toLocaleDateString() : '-',
      monto: formatCurrency(item.monto),
    }))
  ), [data]);

  const profitability = useMemo(() => (
    periodData.map((item) => ({
      ...item,
      ingresos: formatCurrency(item.ingresos),
      compras_inventario: formatCurrency(item.compras_inventario),
      costo_repuestos_usados: formatCurrency(item.costo_repuestos_usados),
      perdidas_reales: formatCurrency(item.perdidas_reales),
      ganancia_neta: formatCurrency(item.ganancia_neta),
      margen_servicio: formatCurrency(item.margen_servicio),
      rentabilidad_porcentaje: formatPercent(item.rentabilidad_porcentaje),
    }))
  ), [periodData]);

  const assetCards = useMemo(() => ([
    { label: 'Clientes activos', value: activos.clientes_activos || 0 },
    { label: 'Tecnicos activos', value: activos.tecnicos_activos || 0 },
    { label: 'Usuarios activos', value: activos.usuarios_activos || 0 },
    { label: 'Equipos registrados', value: activos.equipos_registrados || 0 },
    { label: 'Proveedores activos', value: activos.proveedores_activos || 0 },
    { label: 'Repuestos activos', value: activos.repuestos_activos || 0 },
    { label: 'Unidades en stock', value: activos.unidades_stock || 0 },
    { label: 'Valor inventario costo', value: formatCurrency(activos.valor_inventario_costo) },
    { label: 'Valor inventario venta', value: formatCurrency(activos.valor_inventario_venta) },
    { label: 'Margen inventario', value: formatCurrency(activos.margen_inventario) },
    { label: 'Repuestos sin stock', value: activos.repuestos_sin_stock || 0 },
  ]), [activos]);

  const reportFilename = `ganancias_${fromDate || 'general'}_${toDate || 'general'}`;
  const assetColumns = useMemo(() => ([
    { header: 'Activo', accessor: 'label' },
    { header: 'Valor', accessor: 'value' },
  ]), []);

  const handleQuickFilter = (filterType) => {
    setActiveFilter(filterType);
    setData(null);
    setComparePrevious(false);

    const now = new Date();
    if (filterType === 'semana') {
      const day = now.getDay() || 7;
      const start = new Date(now);
      start.setDate(now.getDate() - day + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(end.toISOString().split('T')[0]);
      setActivePeriod('semanal');
    } else if (filterType === 'mes') {
      setFromDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setToDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
      setActivePeriod('mensual');
    } else if (filterType === 'trimestre') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      setFromDate(new Date(now.getFullYear(), quarterStartMonth, 1).toISOString().split('T')[0]);
      setToDate(new Date(now.getFullYear(), quarterStartMonth + 3, 0).toISOString().split('T')[0]);
      setActivePeriod('mensual');
    } else {
      setFromDate(`${currentYear}-01-01`);
      setToDate(`${currentYear}-12-31`);
      setActivePeriod('anual');
    }
  };

  const handleDateChange = (type, value) => {
    setActiveFilter('');
    setData(null);
    setComparePrevious(false);
    if (type === 'from') setFromDate(value);
    if (type === 'to') setToDate(value);
  };

  const handleComparePrevious = () => {
    if (!fromDate || !toDate) return;
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);
    const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
    const previousEnd = new Date(start);
    previousEnd.setDate(start.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousEnd.getDate() - days + 1);
    setActiveFilter('comparativo');
    setFromDate(previousStart.toISOString().split('T')[0]);
    setToDate(previousEnd.toISOString().split('T')[0]);
    setData(null);
    setComparePrevious(true);
  };

  const downloadGananciasCsv = async () => {
    setDownloading(true);
    setError('');
    try {
      downloadJsonCsv(detail, detailColumns, `${reportFilename}.csv`);
    } catch {
      setError('No se pudo descargar el reporte de ganancias.');
    } finally {
      setDownloading(false);
    }
  };

  const exportSection = (rows, columns, filename, title, format = 'csv') => {
    setDownloading(true);
    setError('');
    try {
      if (format === 'pdf') downloadJsonPdf(rows, columns, `${filename}.pdf`, title);
      else downloadJsonCsv(rows, columns, `${filename}.csv`);
    } catch {
      setError(`No se pudo exportar ${title.toLowerCase()}.`);
    } finally {
      setDownloading(false);
    }
  };

  const downloadGananciasPdf = async () => {
    setDownloading(true);
    setError('');
    try {
      downloadJsonPdf(detail, detailColumns, `${reportFilename}.pdf`, 'Reporte de Ganancias');
    } catch {
      setError('No se pudo descargar el reporte de ganancias en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ganancias</h1>
        <p className="text-gray-400 text-sm mt-0.5">Modulo financiero para ingresos, gastos, ganancias y perdidas del negocio.</p>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Parametros de reporte</h2>
            <p className="text-sm text-gray-400">Selecciona un periodo, limita el detalle y exporta el reporte filtrado.</p>
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl self-start lg:self-auto">
            {quickFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => handleQuickFilter(filter.key)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === filter.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-slate-800'}`}
              >
                {filter.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleComparePrevious}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === 'comparativo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-slate-800'}`}
            >
              Periodo anterior
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="w-full sm:w-[160px]">
              <span className="text-xs font-bold text-gray-400 uppercase block tracking-wider">Desde</span>
              <input type="date" value={fromDate} onChange={(e) => handleDateChange('from', e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>

            <div className="w-full sm:w-[160px]">
              <span className="text-xs font-bold text-gray-400 uppercase block tracking-wider">Hasta</span>
              <input type="date" value={toDate} onChange={(e) => handleDateChange('to', e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>

            <div className="w-full sm:w-[140px]">
              <span className="text-xs font-bold text-gray-400 uppercase block tracking-wider">Detalle</span>
              <select
                value={detailLimit}
                onChange={(e) => {
                  setData(null);
                  setDetailLimit(Number(e.target.value));
                }}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={12}>12 filas</option>
                <option value={25}>25 filas</option>
                <option value={50}>50 filas</option>
                <option value={100}>100 filas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full md:w-auto min-w-[280px]">
            <button type="button" onClick={() => fetchGanancias()} disabled={loading} className="rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:bg-slate-300 text-center whitespace-nowrap">Consultar</button>
            <ExportButton format="csv" onClick={downloadGananciasCsv} disabled={downloading || loading || detail.length === 0}>CSV</ExportButton>
            <ExportButton format="pdf" onClick={downloadGananciasPdf} disabled={downloading || loading || detail.length === 0}>PDF</ExportButton>
          </div>
        </div>
        {comparePrevious && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
            Vista comparativa aplicada al periodo anterior equivalente. Puedes volver a usar cualquier filtro rapido para regresar al periodo actual.
          </div>
        )}
      </section>

      {loading && <div className="rounded-2xl bg-white p-12 shadow-sm text-gray-400 text-center font-medium animate-pulse">Calculando balances financieros...</div>}
      {error && <div className="rounded-2xl bg-red-50 p-6 text-red-700 shadow-sm border border-red-100">{error}</div>}

      {!loading && !error && data && (
        <>
          {alertas.length > 0 && (
            <section className="grid gap-3 lg:grid-cols-3">
              {alertas.map((alerta) => (
                <div
                  key={`${alerta.titulo}-${alerta.detalle}`}
                  className={`rounded-xl border p-4 ${alerta.nivel === 'alto' ? 'border-red-100 bg-red-50 text-red-800' : 'border-amber-100 bg-amber-50 text-amber-800'}`}
                >
                  <p className="text-xs font-black uppercase tracking-wider">{alerta.titulo}</p>
                  <p className="mt-1 text-sm font-semibold">{alerta.detalle}</p>
                </div>
              ))}
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metricCards.map((card) => {
              const active = activeMetric === card.key;
              const tone = {
                emerald: 'text-emerald-500 ring-emerald-200',
                sky: 'text-sky-500 ring-sky-200',
                red: 'text-red-500 ring-red-200',
                indigo: 'text-indigo-500 ring-indigo-200',
                amber: 'text-amber-500 ring-amber-200',
              }[card.tone];

              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setActiveMetric(active ? 'all' : card.key)}
                  className={`rounded-2xl bg-white p-5 text-left shadow-sm border border-gray-100 transition hover:-translate-y-0.5 hover:shadow-md ${active ? `ring-2 ${tone}` : ''}`}
                >
                  <p className={`text-xs font-bold uppercase tracking-wider ${tone}`}>{card.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatCurrency(card.value)}</p>
                  <p className="mt-2 text-xs font-semibold text-gray-400">{card.detail}</p>
                </button>
              );
            })}
          </div>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Balance por etapa</h2>
                <p className="text-sm text-gray-400">Compara ganancias semanales, mensuales o anuales del periodo consultado.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-xl bg-slate-100 p-1">
                  {periodFilters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setActivePeriod(filter.key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${activePeriod === filter.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-slate-800'}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                {activeMetric !== 'all' && (
                  <button type="button" onClick={() => setActiveMetric('all')} className="h-9 rounded-xl border border-gray-200 px-4 text-xs font-bold text-gray-600 transition hover:bg-slate-50">Ver todo</button>
                )}
              </div>
            </div>
            <MetricBarChart data={periodData} labelKey="etiqueta" series={selectedSeries} interactive showGrid />
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Margen de ganancia por orden</h2>
                <p className="text-sm text-gray-400">Rentabilidad de cada servicio procesado con factura emitida.</p>
              </div>
              <ExportActions
                disabled={downloading || orderMargins.length === 0}
                onCsv={() => exportSection(orderMargins, orderMarginColumns, `${reportFilename}_ordenes`, 'Margen por Orden')}
                onPdf={() => exportSection(orderMargins, orderMarginColumns, `${reportFilename}_ordenes`, 'Margen por Orden', 'pdf')}
              />
            </div>
            <div className="overflow-x-auto">
              {orderMargins.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-sm">No hay ordenes facturadas en el periodo seleccionado.</div>
              ) : (
                <Table columns={orderMarginColumns} data={orderMargins} sortable />
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Control de activos</h2>
                <p className="text-sm text-gray-400">Estado operativo de clientes, personal, inventario y valor de activos registrados.</p>
              </div>
              <ExportActions
                disabled={downloading || assetCards.length === 0}
                onCsv={() => exportSection(assetCards, assetColumns, `${reportFilename}_activos`, 'Control de Activos')}
                onPdf={() => exportSection(assetCards, assetColumns, `${reportFilename}_activos`, 'Control de Activos', 'pdf')}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {assetCards.map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Costos y perdidas por accion</h2>
                  <p className="text-sm text-gray-400">Distingue inventario capitalizado, costos consumidos y perdidas reales.</p>
                </div>
                <ExportActions
                  disabled={downloading || losses.length === 0}
                  onCsv={() => exportSection(losses, lossColumns, `${reportFilename}_perdidas`, 'Costos y Perdidas')}
                  onPdf={() => exportSection(losses, lossColumns, `${reportFilename}_perdidas`, 'Costos y Perdidas', 'pdf')}
                />
              </div>
              <div className="overflow-x-auto">
                {losses.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-sm">No hay perdidas registradas para el periodo.</div>
                ) : (
                  <Table columns={lossColumns} data={losses} sortable />
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Rentabilidad {periodFilters.find((item) => item.key === activePeriod)?.label.toLowerCase()}</h2>
                  <p className="text-sm text-gray-400">Lectura financiera por etapa para revisar fiabilidad del negocio.</p>
                </div>
                <ExportActions
                  disabled={downloading || profitability.length === 0}
                  onCsv={() => exportSection(profitability, profitabilityColumns, `${reportFilename}_rentabilidad_${activePeriod}`, 'Rentabilidad por Etapa')}
                  onPdf={() => exportSection(profitability, profitabilityColumns, `${reportFilename}_rentabilidad_${activePeriod}`, 'Rentabilidad por Etapa', 'pdf')}
                />
              </div>
              <div className="overflow-x-auto">
                {profitability.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-sm">No hay rentabilidad calculada para el periodo.</div>
                ) : (
                  <Table columns={profitabilityColumns} data={profitability} sortable />
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Movimientos recientes</h2>
              <p className="text-sm text-gray-400">Ultimos ingresos y gastos usados para el calculo del periodo.</p>
            </div>
            <div className="overflow-x-auto">
              {detail.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-sm">No hay movimientos registrados para el periodo seleccionado.</div>
              ) : (
                <Table columns={detailColumns} data={detail} sortable />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
