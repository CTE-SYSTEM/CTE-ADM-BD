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

export default function HistorialEquipo({ equipoId }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!equipoId) return;
    setLoading(true);
    api.get(`/admin_pro/equipos/${equipoId}/historial`)
      .then((res) => {
        const data = res.data;
        if (data.data) {
          setHistorial(
            data.data.map((d) => ({
              fecha_hora: d.fecha_hora ? new Date(d.fecha_hora).toLocaleString() : '-',
              tecnico: d.tecnico?.nombre || '-',
              diagnostico_real: d.diagnostico_real || '-',
              estado_del_diagnostico: d.estado_del_diagnostico || '-',
              ordenes: d.ordenes?.length || 0,
            }))
          );
        } else setError('No se pudo cargar el historial');
        setLoading(false);
      })
      .catch(() => {
        setError('Error de red o servidor');
        setLoading(false);
      });
  }, [equipoId]);

  if (!equipoId) return <div>Seleccione un equipo para ver el historial.</div>;

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-2">Historial de movimientos</h3>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <Table columns={columns} data={historial} />
    </div>
  );
}
