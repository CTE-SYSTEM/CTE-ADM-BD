import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { header: 'ID Garantía', accessor: 'id_garantia' },
  { header: 'Factura', accessor: 'factura_id' },
  { header: 'Orden', accessor: 'orden_id' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Inicio', accessor: 'fecha_inicio' },
  { header: 'Vence', accessor: 'fecha_vencimiento' },
  { header: 'Duración (meses)', accessor: 'duracion_meses' },
  { header: 'Condiciones', accessor: 'condiciones' },
];

const transformGarantias = (garantias) =>
  garantias.map((g) => ({
    id_garantia: g.id_garantia,
    factura_id: g.factura_id,
    orden_id: g.factura?.orden?.id_orden || '-',
    cliente: g.factura?.orden?.diagnostico?.equipo?.cliente?.nombre || '-',
    equipo: g.factura?.orden?.diagnostico?.equipo?.modelo || '-',
    fecha_inicio: g.fecha_inicio ? new Date(g.fecha_inicio).toLocaleDateString() : '-',
    fecha_vencimiento: g.fecha_vencimiento ? new Date(g.fecha_vencimiento).toLocaleDateString() : '-',
    duracion_meses: g.duracion_meses ?? '-',
    condiciones: g.condiciones || '-',
  }));

export default function GarantiasAvanzado() {
  const [garantias, setGarantias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [facturaId, setFacturaId] = useState('');
  const [condiciones, setCondiciones] = useState('');
  const [duracionMeses, setDuracionMeses] = useState('12');
  const [createMessage, setCreateMessage] = useState('');

  const fetchGarantias = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin_pro/garantias');
      const data = res.data?.data || [];
      setGarantias(transformGarantias(data));
    } catch (err) {
      setError('Error al cargar garantías.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCreateMessage('');
    setError('');

    if (!facturaId || !duracionMeses) {
      setError('Factura y duración son obligatorios.');
      return;
    }

    try {
      const res = await api.post('/admin_pro/garantias', {
        factura_id: Number(facturaId),
        condiciones,
        duracion_meses: Number(duracionMeses),
      });

      setCreateMessage(res.data?.message || 'Garantía creada correctamente.');
      setFacturaId('');
      setCondiciones('');
      setDuracionMeses('12');
      fetchGarantias();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la garantía.');
    }
  };

  useEffect(() => {
    fetchGarantias();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Revalidación de Garantías</h2>
        <p className="text-sm text-gray-500">
          
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-5">
            <h3 className="text-lg font-semibold mb-3">Crear nueva garantía</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Factura ID</label>
                <input
                  type="number"
                  value={facturaId}
                  onChange={(e) => setFacturaId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ingresa el ID de factura"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duración (meses)</label>
                <input
                  type="number"
                  min="1"
                  value={duracionMeses}
                  onChange={(e) => setDuracionMeses(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Condiciones</label>
                <textarea
                  value={condiciones}
                  onChange={(e) => setCondiciones(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Describe las condiciones de la garantía"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                Guardar garantía
              </button>
              {createMessage && <div className="text-sm text-green-600">{createMessage}</div>}
              {error && <div className="text-sm text-red-600">{error}</div>}
            </form>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-5">
          <h3 className="text-lg font-semibold mb-3">Resumen rápido</h3>
          <p className="text-sm text-gray-600">
            Puedes generar garantías para facturas existentes. El vencimiento se calcula automáticamente en base a la duración.
          </p>
        </div>
      </section>

      <section className="bg-white shadow-sm rounded-xl border border-gray-100 p-5">
        <h3 className="text-lg font-semibold mb-4">Listado de garantías</h3>
        {loading && <div>Cargando garantías...</div>}
        {!loading && <Table columns={columns} data={garantias} />}
      </section>
    </div>
  );
}
