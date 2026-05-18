import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { header: 'Fecha', accessor: 'fecha_hora' },
  { header: 'Técnico', accessor: 'tecnico' },
  { header: 'Diagnóstico', accessor: 'diagnostico_real' },
  { header: 'Estado', accessor: 'estado_del_diagnostico' },
  { header: 'Órdenes Relacionadas', accessor: 'ordenes' },
];

export default function HistorialEquipo() {
  const [equipos, setEquipos] = useState([]);
  const [selectedEquipoId, setSelectedEquipoId] = useState('');
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin_pro/equipos')
      .then((res) => {
        const data = res.data?.data || [];
        setEquipos(
          data.map((equipo) => ({
            id_equipo: equipo.id_equipo,
            nombre: equipo.modelo || `Equipo ${equipo.id_equipo}`,
          }))
        );
      })
      .catch(() => {
        setError('No se pudo cargar la lista de equipos.');
      });
  }, []);

  useEffect(() => {
    if (!selectedEquipoId) return;
    setLoading(true);
    setError('');
    api.get(`/admin_pro/equipos/${selectedEquipoId}/historial`)
      .then((res) => {
        const data = res.data?.data || [];
        setHistorial(
          data.map((d) => ({
            fecha_hora: d.fecha_hora ? new Date(d.fecha_hora).toLocaleString() : '-',
            tecnico: d.tecnico?.nombre || '-',
            diagnostico_real: d.diagnostico_real || '-',
            estado_del_diagnostico: d.estado_del_diagnostico || '-',
            ordenes: d.ordenes?.length || 0,
          }))
        );
      })
      .catch(() => {
        setError('No se pudo cargar el historial.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedEquipoId]);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Historial de equipo</h2>
        <p className="text-gray-500 mt-1">Selecciona un equipo para revisar sus diagnósticos y órdenes históricas.</p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Equipo</span>
          <select
            value={selectedEquipoId}
            onChange={(e) => setSelectedEquipoId(e.target.value)}
            className="mt-1 block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Seleccionar equipo</option>
            {equipos.map((equipo) => (
              <option key={equipo.id_equipo} value={equipo.id_equipo}>{equipo.nombre}</option>
            ))}
          </select>
        </label>

        {selectedEquipoId ? (
          <>
            {loading && <div className="text-gray-600">Cargando historial del equipo...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && <Table columns={columns} data={historial} />}
          </>
        ) : (
          <div className="text-gray-600">Elige un equipo para visualizar su historial.</div>
        )}
      </section>
    </div>
  );
}
