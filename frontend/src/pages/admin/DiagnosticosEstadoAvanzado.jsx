import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const columns = [
  { header: 'Estado', accessor: 'estado' },
  { header: 'Aprobación', accessor: 'aprobacion' },
  { header: 'Cantidad', accessor: 'cantidad' },
  { header: 'Presupuesto total', accessor: 'presupuesto_total' },
  { header: 'Promedio', accessor: 'presupuesto_promedio' },
];

export default function DiagnosticosEstadoAvanzado() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const query = [];
      if (fromDate) query.push(`fecha_inicio=${fromDate}`);
      if (toDate) query.push(`fecha_fin=${toDate}`);
      const url = `/admin_pro/reportes/diagnosticos_estado${query.length ? `?${query.join('&')}` : ''}`;
      const res = await api.get(url);
      const data = res.data?.data || [];
      setData(
        data.map((item) => ({
          ...item,
          presupuesto_total: item.presupuesto_total ? `$ ${Number(item.presupuesto_total).toFixed(2)}` : '$ 0.00',
          presupuesto_promedio: item.presupuesto_promedio ? `$ ${Number(item.presupuesto_promedio).toFixed(2)}` : '$ 0.00',
        }))
      );
    } catch (err) {
      setError('No se pudo cargar el reporte de diagnósticos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const downloadReportCsv = async () => {
    setDownloading(true);
    try {
      downloadJsonCsv(data, columns, `diagnosticos_estado_${fromDate || 'desde'}_${toDate || 'hasta'}.csv`);
    } catch (err) {
      setError('No se pudo descargar el reporte.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadReportPdf = async () => {
    setDownloading(true);
    try {
      downloadJsonPdf(data, columns, `diagnosticos_estado_${fromDate || 'desde'}_${toDate || 'hasta'}.pdf`, 'Diagnósticos por estado');
    } catch (err) {
      setError('No se pudo descargar el reporte en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Diagnósticos por estado</h2>
        <p className="text-gray-500 mt-1">Supervisa el avance de diagnósticos y el presupuesto estimado por estado.</p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Filtrar por periodo</h3>
            <p className="text-sm text-gray-500">Selecciona el rango para ver las métricas de diagnóstico.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 w-full max-w-3xl">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Desde</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Hasta</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fetchReport}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto"
              >
                Consultar
              </button>
              <button
                type="button"
                onClick={downloadReportCsv}
                disabled={downloading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
              >
                {downloading ? 'Descargando...' : 'Exportar CSV'}
              </button>
              <button
                type="button"
                onClick={downloadReportPdf}
                disabled={downloading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
              >
                {downloading ? 'Descargando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="text-gray-600">Cargando reporte...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && <Table columns={columns} data={data} />}
      </section>
    </div>
  );
}
