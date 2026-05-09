import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { header: 'ID', accessor: 'id_equipo' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Tipo', accessor: 'tipo' },
  { header: 'Marca', accessor: 'marca' },
  { header: 'Modelo', accessor: 'modelo' },
  { header: 'Serie', accessor: 'numero_serie' },
  { header: 'Estado', accessor: 'estado' },
  { header: 'Historial', accessor: 'historial' },
];

const fetchEquipos = async (setEquipos, setLoading, setError) => {
  setLoading(true);
  try {
    const res = await api.get('/admin_pro/equipos');
    const data = res.data;
    if (data.data) {
      setEquipos(
        data.data.map((e) => ({
          id_equipo: e.id_equipo,
          cliente: e.cliente?.nombre || '-',
          tipo: e.tipo || '-',
          marca: e.marca || '-',
          modelo: e.modelo || '-',
          numero_serie: e.numero_serie || '-',
          estado: e.diagnosticos?.[0]?.estado_del_diagnostico || '-',
          historial: e.diagnosticos?.length || 0,
        }))
      );
    } else {
      setError('No se pudo cargar la información de equipos');
    }
  } catch (e) {
    setError('Error de red o servidor');
  }
  setLoading(false);
};

export default function EquiposAvanzado() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEquipos(setEquipos, setLoading, setError);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Monitoreo avanzado de equipos</h2>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <Table columns={columns} data={equipos} />
    </div>
  );
}
