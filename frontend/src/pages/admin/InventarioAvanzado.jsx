import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const columns = [
  { header: 'ID', accessor: 'id_repuesto' },
  { header: 'Repuesto', accessor: 'repuesto' },
  { header: 'Categoría', accessor: 'categoria' },
  { header: 'Stock estimado', accessor: 'stock_estimado' },
  { header: 'Último costo', accessor: 'ultimo_costo' },
  { header: 'Historial', accessor: 'historial' },
  {
    header: 'Acciones',
    accessor: 'acciones',
    render: (row) => (
      <button
        type="button"
        onClick={row.onViewHistory}
        className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
      >
        Ver historial
      </button>
    ),
  },
];

const fetchInventario = async (setRepuestos, setLoading, setError) => {
  setLoading(true);
  try {
    const res = await api.get('/admin_pro/reportes/inventario');
    const data = res.data;
    if (data.data) {
      setRepuestos(
        data.data.map((r) => ({
          id_repuesto: r.id_repuesto,
          repuesto: r.repuesto || '-',
          categoria: r.categoria || '-',
          stock_estimado: r.stock_estimado ?? '-',
          ultimo_costo: r.ultimo_costo ? `$ ${Number(r.ultimo_costo).toFixed(2)}` : '-',
          historial: `${r.cantidad_usada || 0} usos`,
          raw: r,
        }))
      );
    } else {
      setError('No se pudo cargar el inventario');
    }
  } catch (e) {
    setError('Error de red o servidor');
  }
  setLoading(false);
};

export default function InventarioAvanzado() {
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRepuesto, setSelectedRepuesto] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchInventario(setRepuestos, setLoading, setError);
  }, []);

  const downloadInventoryCsv = async () => {
    setDownloading(true);
    try {
      downloadJsonCsv(repuestos, columns, 'inventario_repuestos.csv');
    } catch (err) {
      setError('No se pudo descargar el reporte de inventario.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadInventoryPdf = async () => {
    setDownloading(true);
    try {
      downloadJsonPdf(repuestos, columns, 'inventario_repuestos.pdf', 'Inventario de repuestos');
    } catch (err) {
      setError('No se pudo descargar el reporte de inventario en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleViewHistory = async (repuesto) => {
    setSelectedRepuesto(repuesto);
    setHistoryLoading(true);
    setHistoryError('');
    setHistorial([]);

    try {
      const res = await api.get(`/admin_pro/repuestos/${repuesto.id_repuesto}/historial`);
      const data = res.data?.data || [];
      setHistorial(
        data.map((item) => ({
          fecha_instalacion: item.fecha_instalacion ? new Date(item.fecha_instalacion).toLocaleString() : '-',
          equipo: item.orden?.diagnostico?.equipo?.modelo || '-',
          cliente: item.orden?.diagnostico?.equipo?.cliente?.nombre || '-',
          orden: item.orden_id || '-',
        }))
      );
    } catch (err) {
      setHistoryError('No se pudo cargar el historial de este repuesto.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredRepuestos = repuestos.filter((repuesto) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;
    return [
      repuesto.repuesto,
      repuesto.categoria,
      repuesto.ultimo_costo,
    ].some((field) => field?.toString().toLowerCase().includes(term));
  });

  const repuestosWithActions = filteredRepuestos.map((repuesto) => ({
    ...repuesto,
    onViewHistory: () => handleViewHistory(repuesto),
  }));

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Control avanzado de inventario</h2>
        <p className="text-gray-500 mt-1">Visualiza stock estimado, revisa costos y explora el historial de uso de cada repuesto.</p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Inventario de repuestos</h3>
            <p className="text-sm text-gray-500">Las cifras se basan en compras y usos aprobados.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar repuesto o categoría"
              className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-80"
            />
            <button
              type="button"
              onClick={downloadInventoryCsv}
              disabled={downloading}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {downloading ? 'Descargando...' : 'Exportar CSV'}
            </button>
            <button
              type="button"
              onClick={downloadInventoryPdf}
              disabled={downloading}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {downloading ? 'Descargando...' : 'Exportar PDF'}
            </button>
          </div>
        </div>

        {loading && <div className="text-gray-600">Cargando inventario...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && <Table columns={columns} data={repuestosWithActions} />}
      </div>

      {selectedRepuesto && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Historial de {selectedRepuesto.repuesto}</h3>
              <p className="text-sm text-gray-500">Usos recientes del componente y órdenes vinculadas.</p>
            </div>
            <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">Stock estimado: {selectedRepuesto.stock_estimado}</span>
          </div>

          {historyLoading && <div className="mt-4 text-gray-600">Cargando historial...</div>}
          {historyError && <div className="mt-4 text-red-600">{historyError}</div>}
          {!historyLoading && !historyError && (
            <Table
              columns={[
                { header: 'Fecha instalación', accessor: 'fecha_instalacion' },
                { header: 'Equipo', accessor: 'equipo' },
                { header: 'Cliente', accessor: 'cliente' },
                { header: 'Orden', accessor: 'orden' },
              ]}
              data={historial}
            />
          )}
        </div>
      )}
    </div>
  );
}
