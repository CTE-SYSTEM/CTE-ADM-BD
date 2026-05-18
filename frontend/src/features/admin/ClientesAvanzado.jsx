import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv } from '../../utils/csvExport';

const columns = [
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

  const fetchClientes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin_pro/reportes/equipos_cliente');
      const data = res.data?.data || [];
      setClientes(
        data.map((item) => ({
          ...item,
          ultima_visita: item.ultima_visita ? new Date(item.ultima_visita).toLocaleDateString() : '-',
        }))
      );
    } catch (err) {
      setError('No se pudo cargar la información de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const downloadClientes = async () => {
    setDownloading(true);
    try {
      downloadJsonCsv(clientes, columns, 'clientes_equipos.csv');
    } catch (err) {
      setError('No se pudo descargar el reporte.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Clientes y equipos</h2>
        <p className="text-gray-500 mt-1">Identifica clientes clave y revisa la última visita de sus equipos.</p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Resumen de clientes</h3>
            <p className="text-sm text-gray-500">Lista de clientes con equipos, diagnósticos y órdenes registradas.</p>
          </div>
          <button
            type="button"
            onClick={downloadClientes}
            disabled={downloading}
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {downloading ? 'Descargando...' : 'Exportar CSV'}
          </button>
        </div>

        {loading && <div className="text-gray-600">Cargando clientes...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && <Table columns={columns} data={clientes} />}
      </section>
    </div>
  );
}
