import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { header: 'Fecha instalación', accessor: 'fecha_instalacion' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Orden', accessor: 'orden' },
];

export default function HistorialRepuesto({ repuestoId }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!repuestoId) return;
    setLoading(true);
    api.get(`/admin_pro/repuestos/${repuestoId}/historial`)
      .then((res) => {
        const data = res.data;
        if (data.data) {
          setHistorial(
            data.data.map((u) => ({
              fecha_instalacion: u.fecha_instalacion ? new Date(u.fecha_instalacion).toLocaleString() : '-',
              equipo: u.orden?.diagnostico?.equipo?.modelo || '-',
              cliente: u.orden?.diagnostico?.equipo?.cliente?.nombre || '-',
              orden: u.orden_id || '-',
            }))
          );
        } else setError('No se pudo cargar el historial');
        setLoading(false);
      })
      .catch(() => {
        setError('Error de red o servidor');
        setLoading(false);
      });
  }, [repuestoId]);

  if (!repuestoId) return <div>Seleccione un repuesto para ver el historial.</div>;

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-2">Historial de uso</h3>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <Table columns={columns} data={historial} />
    </div>
  );
}
