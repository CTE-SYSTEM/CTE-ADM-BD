import React, { useEffect, useState, useCallback } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const COLUMNS = [
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Teléfono', accessor: 'telefono' },
  { header: 'Equipos', accessor: 'total_equipos' },
  { header: 'Diagnósticos', accessor: 'total_diagnosticos' },
  { header: 'Órdenes', accessor: 'total_ordenes' },
  { header: 'Última visita', accessor: 'ultima_visita' },
];

export default function ClientesAvanzado() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Traer datos de la API
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin_pro/reportes/equipos_cliente');
      const data = res.data?.data || [];
      
      const formateados = data.map((item) => ({
        ...item,
        raw_equipos: Number(item.total_equipos) || 0,
        raw_ordenes: Number(item.total_ordenes) || 0,
        ultima_visita: item.ultima_visita 
          ? new Date(item.ultima_visita).toLocaleDateString() 
          : '-',
      }));
      
      setClientes(formateados);
    } catch (err) {
      setError('No se pudo cargar la información de clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Descargar CSV
  const downloadClientesCsv = () => {
    setDownloading(true);
    try {
      downloadJsonCsv(clientes, COLUMNS, 'clientes_equipos.csv');
    } catch (err) {
      setError('No se pudo descargar el reporte en CSV.');
    } finally {
      setDownloading(false);
    }
  };

  // Descargar PDF
  const downloadClientesPdf = () => {
    setDownloading(true);
    try {
      downloadJsonPdf(clientes, COLUMNS, 'clientes_equipos.pdf', 'Clientes y equipos');
    } catch (err) {
      setError('No se pudo descargar el reporte en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  // Cálculos en tiempo real basados en los registros mapeados
  const totalEquiposGarantia = clientes.reduce((acc, item) => acc + (item.raw_equipos || 0), 0);
  const totalOrdenesAsignadas = clientes.reduce((acc, item) => acc + (item.raw_ordenes || 0), 0);

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado Principal */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Clientes y equipos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Identifica clientes clave, volumen de dispositivos ingresados y la última actividad registrada en el centro.</p>
      </div>

      {/* Grid Dinámico de KPIs de Carteras */}
      {!loading && !error && clientes.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Base de Clientes</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{clientes.length} usuarios</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Historial de Equipos</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{totalEquiposGarantia} unidades</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Servicios Vinculados</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{totalOrdenesAsignadas} órdenes</p>
          </div>
        </div>
      )}

      {/* Contenedor Principal de la Tabla */}
      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-50 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Resumen de clientes</h2>
            <p className="text-sm text-gray-400">Auditoría de activos, diagnósticos parciales y flujos de trabajo.</p>
          </div>
          
          {/* Botones de Acción de Reportes */}
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={downloadClientesCsv}
              disabled={downloading || loading || clientes.length === 0}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={downloadClientesPdf}
              disabled={downloading || loading || clientes.length === 0}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400"
            >
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Estados de Carga, Error o Tabla */}
        {loading && <div className="text-gray-400 text-center py-10 text-sm">Procesando registros de la cartera...</div>}
        {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm font-semibold">{error}</div>}
        
        {!loading && !error && (
          <div className="overflow-x-auto">
            {clientes.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-sm">
                No se registran datos o movimientos de clientes disponibles en este momento.
              </div>
            ) : (
              <Table columns={COLUMNS} data={clientes} sortable />
            )}
          </div>
        )}
      </section>

    </div>
  );
}