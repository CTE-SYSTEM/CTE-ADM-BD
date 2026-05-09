import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { header: 'ID', accessor: 'id_factura' },
  { header: 'Orden', accessor: 'orden' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Total', accessor: 'total' },
  { header: 'Método de Pago', accessor: 'metodo_pago' },
];

const fetchFacturas = async (setFacturas, setLoading, setError) => {
  setLoading(true);
  try {
    const res = await api.get('/admin_pro/facturas');
    const data = res.data;
    if (data.data) {
      setFacturas(
        data.data.map((f) => ({
          id_factura: f.id_factura,
          orden: f.orden_id,
          equipo: f.orden?.diagnostico?.equipo?.modelo || '-',
          cliente: f.orden?.diagnostico?.equipo?.cliente?.nombre || '-',
          total: f.total ?? '-',
          metodo_pago: f.metodo_pago || '-',
        }))
      );
    } else {
      setError('No se pudo cargar la información de facturas');
    }
  } catch (e) {
    setError('Error de red o servidor');
  }
  setLoading(false);
};

export default function FacturasAvanzado() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFacturas(setFacturas, setLoading, setError);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Facturación avanzada</h2>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <Table columns={columns} data={facturas} />
    </div>
  );
}
