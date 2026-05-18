import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv } from '../../utils/csvExport';

const columns = [
  { header: 'Compra', accessor: 'id_compra' },
  { header: 'Fecha', accessor: 'fecha_obtencion' },
  { header: 'Proveedor', accessor: 'proveedor' },
  { header: 'Repuesto', accessor: 'repuesto' },
  { header: 'Documento', accessor: 'documento' },
  { header: 'Cantidad', accessor: 'cantidad' },
  { header: 'Costo unitario', accessor: 'costo_unitario' },
  { header: 'Costo total', accessor: 'costo_total' },
  { header: 'Pago', accessor: 'metodo_pago' },
];

export default function ComprasAvanzado() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchCompras = async () => {
    setLoading(true);
    setError('');
    try {
      const query = [];
      if (fromDate) query.push(`fecha_inicio=${fromDate}`);
      if (toDate) query.push(`fecha_fin=${toDate}`);
      const url = `/admin_pro/reportes/compras${query.length ? `?${query.join('&')}` : ''}`;
      const res = await api.get(url);
      const data = res.data?.data || [];
      setCompras(
        data.map((item) => ({
          ...item,
          fecha_obtencion: item.fecha_obtencion ? new Date(item.fecha_obtencion).toLocaleDateString() : '-',
          costo_unitario: item.costo_unitario ? `$ ${Number(item.costo_unitario).toFixed(2)}` : '$ 0.00',
          costo_total: item.costo_total ? `$ ${Number(item.costo_total).toFixed(2)}` : '$ 0.00',
        }))
      );
    } catch (err) {
      setError('No se pudo cargar las compras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const downloadCompras = async () => {
    setDownloading(true);
    try {
      downloadJsonCsv(compras, columns, `compras_${fromDate || 'desde'}_${toDate || 'hasta'}.csv`);
    } catch (err) {
      setError('No se pudo descargar el reporte de compras.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Compras y proveedores</h2>
        <p className="text-gray-500 mt-1">Monitorea compras de repuestos y los montos pagados a proveedores.</p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Rango de búsqueda</h3>
            <p className="text-sm text-gray-500">Filtra compras por fecha de obtención.</p>
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
                onClick={fetchCompras}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Consultar
              </button>
              <button
                type="button"
                onClick={downloadCompras}
                disabled={downloading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {downloading ? 'Descargando...' : 'Exportar CSV'}
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="text-gray-600">Cargando compras...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && <Table columns={columns} data={compras} />}
      </section>
    </div>
  );
}
