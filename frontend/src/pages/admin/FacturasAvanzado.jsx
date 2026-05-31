import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const columns = [
  { header: 'ID', accessor: 'id_factura' },
  { header: 'Orden', accessor: 'id_orden' },
  { 
    header: 'Fecha', 
    accessor: 'fecha_emision',
    render: (row) => row.fecha_emision ? new Date(row.fecha_emision).toLocaleDateString() : '-'
  },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Técnico', accessor: 'tecnico' },
  { 
    header: 'Total', 
    accessor: 'total',
    render: (row) => row.total ? `C$ ${Number(row.total).toFixed(2)}` : 'C$ 0.00'
  },
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
          fecha_emision: f.fecha_emision || null,
          cliente: f.cliente || '-',
          equipo: f.equipo || '-',
          tecnico: f.tecnico || '-',
          total: f.total ? Number(f.total) : 0, 
          metodo_pago: f.metodo_pago || '-',
        }))
      );
    } catch (err) {
      setError('No se pudo cargar la información de facturas.');
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
      const exportData = facturas.map(f => ({
        ...f,
        fecha_emision: f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString() : '-',
        total: `C$ ${f.total.toFixed(2)}`
      }));
      downloadJsonCsv(exportData, columns, `control_facturas_${fromDate || 'desde'}_${toDate || 'hasta'}.csv`);
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
      const exportData = facturas.map(f => ({
        ...f,
        fecha_emision: f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString() : '-',
        total: `C$ ${f.total.toFixed(2)}`
      }));
      downloadJsonPdf(exportData, columns, `control_facturas_${fromDate || 'desde'}_${toDate || 'hasta'}.pdf`, 'Reporte de control de facturas');
    } catch (err) {
      setError('No se pudo descargar el reporte en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const totalIngresos = facturas.reduce((acc, f) => acc + f.total, 0);
  const operacionesEfectivo = facturas.filter(f => f.metodo_pago.toLowerCase().includes('efectivo')).length;
  const operationsDigital = facturas.length - operacionesEfectivo;

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado Principal */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Visualización y control de facturas</h1>
        <p className="text-gray-400 text-sm mt-0.5">Analiza los ingresos percibidos del taller por rangos de fecha y métodos de pago.</p>
      </div>

      {/* Grid Dinámico de KPIs Financieros */}
      {!loading && !error && facturas.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Ingresos Totales (Rango)</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">C$ {totalIngresos.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Flujo en Efectivo</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{operacionesEfectivo} transac.</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Bancos / Medios Digitales</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{operationsDigital} operaciones</p>
          </div>
        </div>
      )}

      {/* Tarjeta de Filtros y Tabla */}
      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
        
        {/* Fila superior: Título e Inputs de Fecha */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-gray-50 pb-4">
          <div className="shrink-0">
            <h2 className="text-lg font-bold text-slate-800">Parámetros de conciliación</h2>
            <p className="text-sm text-gray-400">Selecciona fechas de emisión para acotar los libros contables.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full lg:w-auto dynamic-filters">
            
            {/* Input Desde */}
            <div className="w-full sm:w-[150px] shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase block">Desde</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Input Hasta */}
            <div className="w-full sm:w-[150px] shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase block">Hasta</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            {/* Grupo de Acciones Rápidas */}
            <div className="flex gap-2 items-end w-full sm:w-auto mt-2 sm:mt-0">
              <button
                type="button"
                onClick={fetchFacturas}
                disabled={loading}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:bg-slate-300 whitespace-nowrap"
              >
                Consultar
              </button>
              <button
                type="button"
                onClick={downloadFacturasCsv}
                disabled={downloading || loading || facturas.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400 whitespace-nowrap"
                title="Exportar a Excel / CSV"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={downloadFacturasPdf}
                disabled={downloading || loading || facturas.length === 0}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-900 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400 whitespace-nowrap"
                title="Exportar a PDF impreso"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Control de Estados de Respuesta de la API */}
        {loading && <div className="text-gray-400 text-center py-10 text-sm">Conciliando extractos financieros...</div>}
        {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm font-semibold">{error}</div>}
        
        {!loading && !error && (
          <div className="overflow-x-auto">
            {facturas.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-sm">
                No se encontraron facturas ni cobros registrados en el rango de fechas seleccionado.
              </div>
            ) : (
              <Table columns={columns} data={facturas} sortable />
            )}
          </div>
        )}
      </section>

    </div>
  );
}