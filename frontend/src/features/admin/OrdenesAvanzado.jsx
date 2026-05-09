import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { header: 'ID', accessor: 'id_orden' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Estado', accessor: 'estado' },
  { header: 'Técnico', accessor: 'tecnico' },
  { header: 'Facturas', accessor: 'facturas' },
];

const fetchOrdenes = async (setOrdenes, setLoading, setError) => {
  setLoading(true);
  try {
    const res = await api.get('/admin_pro/ordenes');
    const data = res.data;
    if (data.data) {
      setOrdenes(
        data.data.map((o) => ({
          id_orden: o.id_orden,
          equipo: o.diagnostico?.equipo?.modelo || '-',
          cliente: o.diagnostico?.equipo?.cliente?.nombre || '-',
          estado: o.estado || '-',
          tecnico: o.tecnico?.nombre || '-',
          facturas: o.facturas?.length || 0,
        }))
      );
    } else {
      setError('No se pudo cargar la información de órdenes');
    }
  } catch (e) {
    setError('Error de red o servidor');
  }
  setLoading(false);
};

export default function OrdenesAvanzado() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrdenes(setOrdenes, setLoading, setError);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Órdenes avanzadas</h2>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <Table columns={columns} data={ordenes} />
    </div>
  );
}
