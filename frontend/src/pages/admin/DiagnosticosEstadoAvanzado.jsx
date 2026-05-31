import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const columns = [
  { header: 'Estado', accessor: 'estado' },
  { header: 'Aprobación', accessor: 'aprobacion' },
  { header: 'Cantidad', accessor: 'cantidad' },
  { 
    header: 'Presupuesto total', 
    accessor: 'presupuesto_total',
    render: (row) => row.presupuesto_total ? `C$ ${Number(row.presupuesto_total).toFixed(2)}` : 'C$ 0.00'
  },
  { 
    header: 'Promedio', 
    accessor: 'presupuesto_promedio',
    render: (row) => row.presupuesto_promedio ? `C$ ${Number(row.presupuesto_promedio).toFixed(2)}` : 'C$ 0.00'
  },
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
      const reportData = res.data?.data || [];
      
      setData(
        reportData.map((item) => ({
          ...item,
          presupuesto_total: item.presupuesto_total ? Number(item.presupuesto_total) : 0,
          presupuesto_promedio: item.presupuesto_promedio ? Number(item.presupuesto_promedio) : 0,
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
    setError('');
    try {
      const exportData = data.map(item => ({
        ...item,
        presupuesto_total: `C$ ${item.presupuesto_total.toFixed(2)}`,
        presupuesto_promedio: `C$ ${item.presupuesto_promedio.toFixed(2)}`
      }));
      downloadJsonCsv(exportData, columns, `diagnosticos_estado_${fromDate || 'desde'}_${toDate || 'hasta'}.csv`);
    } catch (err) {
      setError('No se pudo descargar el reporte.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadReportPdf = async () => {
    setDownloading(true);
    setError('');
    try {
      const exportData = data.map(item => ({
        ...item,
        presupuesto_total: `C$ ${item.presupuesto_total.toFixed(2)}`,
        presupuesto_promedio: `C$ ${item.presupuesto_promedio.toFixed(2)}`
      }));
      downloadJsonPdf(exportData, columns, `diagnosticos_estado_${fromDate || 'desde'}_${toDate || 'hasta'}.pdf`, 'Diagnósticos por estado');
    } catch (err) {
      setError('No se pudo descargar el reporte en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado Principal */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Diagnósticos por estado</h1>
        <p className="text-gray-400 text-sm mt-0.5">Supervisa el avance de diagnósticos y el presupuesto estimado por estado.</p>
      </div>

      {/* Tarjeta de Filtros y Tabla */}
      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
        
        {/* Fila superior: Título e Inputs de Fecha */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-gray-50 pb-4">
          <div className="shrink-0">
            <h2 className="text-lg font-bold text-slate-800">Filtrar por periodo</h2>
            <p className="text-sm text-gray-400">Selecciona el rango para ver las métricas de diagnóstico.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full lg:w-auto">
            
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
                onClick={fetchReport}
                disabled={loading}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:bg-slate-300 whitespace-nowrap"
              >
                Consultar
              </button>
              <button
                type="button"
                onClick={downloadReportCsv}
                disabled={downloading || loading || data.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400 whitespace-nowrap"
                title="Exportar a Excel / CSV"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={downloadReportPdf}
                disabled={downloading || loading || data.length === 0}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-900 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400 whitespace-nowrap"
                title="Exportar a PDF impreso"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Control de Estados de Respuesta de la API */}
        {loading && <div className="text-gray-400 text-center py-10 text-sm">Procesando métricas de diagnóstico...</div>}
        {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm font-semibold">{error}</div>}
        
        {!loading && !error && (
          <div className="overflow-x-auto">
            {data.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-sm">
                No se encontraron diagnósticos ni presupuestos registrados en el rango seleccionado.
              </div>
            ) : (
              <Table columns={columns} data={data} sortable />
            )}
          </div>
        )}
      </section>

    </div>
  );
}