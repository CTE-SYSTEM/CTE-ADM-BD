import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const columns = [
  { header: 'ID', accessor: 'id_factura' },
  { header: 'Orden', accessor: 'id_orden' },
  { header: 'Fecha', accessor: 'fecha_emision' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Técnico', accessor: 'tecnico' },
  { header: 'Total', accessor: 'total' },
  { header: 'Método de Pago', accessor: 'metodo_pago' },
];

export default function FacturasAvanzado() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchFacturas = async () => {
    setLoading(true);
    setError('');
    try {
      const query = [];
      if (fromDate) query.push(`fecha_inicio=${fromDate}`);
      if (toDate) query.push(`fecha_fin=${toDate}`);
      const url = `/admin_pro/reportes/facturacion${query.length ? `?${query.join('&')}` : ''}`;
      const res = await api.get(url);
      const data = res.data?.data || [];
      setFacturas(
        data.map((f) => ({
          id_factura: f.id_factura,
          id_orden: f.id_orden,
          fecha_emision: f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString() : '- ',
          cliente: f.cliente || '-',
          equipo: f.equipo || '-',
          tecnico: f.tecnico || '-',
          total: f.total ? `$ ${Number(f.total).toFixed(2)}` : '$ 0.00',
          metodo_pago: f.metodo_pago || '-',
        }))
      );
    } catch (err) {
      setError('No se pudo cargar la información de facturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  const downloadFacturasCsv = async () => {
    setDownloading(true);
    setError('');
    try {
      downloadJsonCsv(facturas, columns, `facturacion_${fromDate || 'desde'}_${toDate || 'hasta'}.csv`);
    } catch (err) {
      setError('No se pudo descargar el reporte.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadFacturasPdf = async () => {
    setDownloading(true);
    setError('');
    try {
      downloadJsonPdf(facturas, columns, `facturacion_${fromDate || 'desde'}_${toDate || 'hasta'}.pdf`, 'Reporte de Facturación');
    } catch (err) {
      setError('No se pudo descargar el reporte en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Facturación avanzada</h2>
        <p className="text-gray-500 mt-1">Analiza facturación por orden y período, con exportación directa.</p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end mb-6">
          <div>
            <h3 className="text-lg font-semibold">Filtro por periodo</h3>
            <p className="text-sm text-gray-500">Filtra la facturación por fecha de emisión.</p>
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
                onClick={fetchFacturas}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto"
              >
                Consultar
              </button>
              <button
                type="button"
                onClick={downloadFacturasCsv}
                disabled={downloading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
              >
                {downloading ? 'Descargando...' : 'Exportar CSV'}
              </button>
              <button
                type="button"
                onClick={downloadFacturasPdf}
                disabled={downloading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
              >
                {downloading ? 'Descargando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="text-gray-600">Cargando facturas...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && <Table columns={columns} data={facturas} />}
      </section>
    </div>
  );
}
