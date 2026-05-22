import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MetricBarChart from '../../components/MetricBarChart';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const currentYear = new Date().getFullYear();
const formatCurrency = (value) => `$ ${Number(value || 0).toFixed(2)}`;

const detailColumns = [
  { header: 'Tipo', accessor: 'tipo' },
  { header: 'Fecha', accessor: 'fecha' },
  { header: 'Concepto', accessor: 'concepto' },
  { header: 'Monto', accessor: 'monto' },
  { header: 'Pago', accessor: 'metodo_pago' },
];

const chartSeries = [
  { key: 'ingresos', label: 'Ingresos', color: '#059669' },
  { key: 'gastos', label: 'Gastos', color: '#dc2626' },
  { key: 'ganancia_neta', label: 'Ganancia neta', color: '#4f46e5' },
  { key: 'costo_repuestos_usados', label: 'Costo usado', color: '#d97706' },
];

const quickFilters = [
  { key: 'mes', label: 'Mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'anio', label: 'Anio' },
];

export default function Ganancias() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('anio');
  const [activeMetric, setActiveMetric] = useState('all');
  const [detailLimit, setDetailLimit] = useState(12);
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
    fetchGanancias(controller.signal);
    return () => controller.abort();
  }, [fetchGanancias]);

  const totals = data?.totals || {};
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
    { key: 'gastos', label: 'Gastos', value: totals.gastos, detail: `${totals.compras || 0} compras registradas`, tone: 'red' },
    { key: 'ganancia_neta', label: balanceLabel, value: totals.ganancia_neta, detail: `Margen neto ${marginPercent}%`, tone: 'indigo' },
    { key: 'costo_repuestos_usados', label: 'Costo usado', value: totals.costo_repuestos_usados, detail: 'Repuestos consumidos en ordenes', tone: 'amber' },
  ]), [balanceLabel, marginPercent, totals]);

  const detail = useMemo(() => (
    (data?.detail || []).map((item) => ({
      ...item,
      fecha: item.fecha ? new Date(item.fecha).toLocaleDateString() : '-',
      monto: formatCurrency(item.monto),
      metodo_pago: item.metodo_pago || '-',
    }))
  ), [data]);

  const reportFilename = `ganancias_${fromDate || 'general'}_${toDate || 'general'}`;

  const handleQuickFilter = (filterType) => {
    setActiveFilter(filterType);
    setData(null);

    const now = new Date();
    if (filterType === 'mes') {
      setFromDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setToDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (filterType === 'trimestre') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      setFromDate(new Date(now.getFullYear(), quarterStartMonth, 1).toISOString().split('T')[0]);
      setToDate(new Date(now.getFullYear(), quarterStartMonth + 3, 0).toISOString().split('T')[0]);
    } else {
      setFromDate(`${currentYear}-01-01`);
      setToDate(`${currentYear}-12-31`);
    }
  };

  const handleDateChange = (type, value) => {
    setActiveFilter('');
    setData(null);
    if (type === 'from') setFromDate(value);
    if (type === 'to') setToDate(value);
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

          <div className="flex bg-slate-100 p-1 rounded-xl self-start lg:self-auto">
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
            <button type="button" onClick={downloadGananciasCsv} disabled={downloading || loading || detail.length === 0} className="rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400 text-center whitespace-nowrap">CSV</button>
            <button type="button" onClick={downloadGananciasPdf} disabled={downloading || loading || detail.length === 0} className="rounded-xl bg-slate-800 py-2.5 px-4 text-xs font-bold text-white hover:bg-slate-900 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400 text-center whitespace-nowrap">PDF</button>
          </div>
        </div>
      </section>

      {loading && <div className="rounded-2xl bg-white p-12 shadow-sm text-gray-400 text-center font-medium animate-pulse">Calculando balances financieros...</div>}
      {error && <div className="rounded-2xl bg-red-50 p-6 text-red-700 shadow-sm border border-red-100">{error}</div>}

      {!loading && !error && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card) => {
              const active = activeMetric === card.key;
              const tone = {
                emerald: 'text-emerald-500 ring-emerald-200',
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
                <h2 className="text-lg font-bold text-slate-800">Balance mensual</h2>
                <p className="text-sm text-gray-400">Toca una tarjeta para aislar la metrica o pasa el cursor sobre una barra.</p>
              </div>
              {activeMetric !== 'all' && (
                <button type="button" onClick={() => setActiveMetric('all')} className="h-9 rounded-xl border border-gray-200 px-4 text-xs font-bold text-gray-600 transition hover:bg-slate-50">Ver todo</button>
              )}
            </div>
            <MetricBarChart data={data.monthly || []} labelKey="etiqueta" series={selectedSeries} interactive showGrid />
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