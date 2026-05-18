import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { header: 'Fecha instalación', accessor: 'fecha_instalacion' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Orden', accessor: 'orden' },
];

export default function HistorialRepuesto() {
  const [repuestos, setRepuestos] = useState([]);
  const [selectedRepuestoId, setSelectedRepuestoId] = useState('');
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin_pro/repuestos')
      .then((res) => {
        const data = res.data?.data || [];
        setRepuestos(
          data.map((repuesto) => ({
            id_repuesto: repuesto.id_repuesto,
            nombre: repuesto.nombre || `Repuesto ${repuesto.id_repuesto}`,
          }))
        );
      })
      .catch(() => {
        setError('No se pudo cargar la lista de repuestos.');
      });
  }, []);

  useEffect(() => {
    if (!selectedRepuestoId) return;
    setLoading(true);
    setError('');
    api.get(`/admin_pro/repuestos/${selectedRepuestoId}/historial`)
      .then((res) => {
        const data = res.data?.data || [];
        setHistorial(
          data.map((u) => ({
            fecha_instalacion: u.fecha_instalacion ? new Date(u.fecha_instalacion).toLocaleString() : '-',
            equipo: u.orden?.diagnostico?.equipo?.modelo || '-',
            cliente: u.orden?.diagnostico?.equipo?.cliente?.nombre || '-',
            orden: u.orden_id || '-',
          }))
        );
      })
      .catch(() => {
        setError('No se pudo cargar el historial.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedRepuestoId]);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Historial de repuesto</h2>
        <p className="text-gray-500 mt-1">Selecciona un repuesto para ver su historial de uso en órdenes.</p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Repuesto</span>
          <select
            value={selectedRepuestoId}
            onChange={(e) => setSelectedRepuestoId(e.target.value)}
            className="mt-1 block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Seleccionar repuesto</option>
            {repuestos.map((repuesto) => (
              <option key={repuesto.id_repuesto} value={repuesto.id_repuesto}>{repuesto.nombre}</option>
            ))}
          </select>
        </label>

        {selectedRepuestoId ? (
          <>
            {loading && <div className="text-gray-600">Cargando historial del repuesto...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && <Table columns={columns} data={historial} />}
          </>
        ) : (
          <div className="text-gray-600">Elige un repuesto para visualizar su historial.</div>
        )}
      </section>
    </div>
  );
}
