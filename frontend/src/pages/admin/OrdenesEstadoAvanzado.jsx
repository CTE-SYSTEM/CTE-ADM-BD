import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const columns = [
  { header: 'Estado', accessor: 'estado' },
  { header: 'Cantidad', accessor: 'cantidad' },
  { header: 'Normal', accessor: 'prioridad_normal' },
  { header: 'Alta', accessor: 'prioridad_alta' },
  { header: 'Urgente', accessor: 'prioridad_urgente' },
];

export default function OrdenesEstadoAvanzado() {
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
      const url = `/admin_pro/reportes/ordenes_estado${query.length ? `?${query.join('&')}` : ''}`;
      const res = await api.get(url);
      setData(res.data?.data || []);
    } catch (err) {
      setError('No se pudo cargar el reporte de órdenes por estado.');
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
      downloadJsonCsv(data, columns, `ordenes_estado_${fromDate || 'desde'}_${toDate || 'hasta'}.csv`);
    } catch (err) {
      setError('No se pudo descargar el reporte.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadReportPdf = async () => {
    setDownloading(true);
    try {
      downloadJsonPdf(data, columns, `ordenes_estado_${fromDate || 'desde'}_${toDate || 'hasta'}.pdf`, 'Órdenes por estado');
    } catch (err) {
      setError('No se pudo descargar el reporte en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Órdenes por estado</h2>
        <p className="text-gray-500 mt-1">Observa cómo evolucionan las órdenes según su estado y prioridad.</p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Filtrar periodo</h3>
            <p className="text-sm text-gray-500">Ajusta el rango para ver las tendencias de estado.</p>
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
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchReport}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Consultar
              </button>
              <button
                type="button"
                onClick={downloadReportCsv}
                disabled={downloading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {downloading ? 'Descargando...' : 'Exportar CSV'}
              </button>
              <button
                type="button"
                onClick={downloadReportPdf}
                disabled={downloading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
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
