import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { header: 'Nombre', accessor: 'nombre' },
  { header: 'Descripción', accessor: 'descripcion' },
  { header: 'Categoría', accessor: 'categoria' },
  { header: 'Proveedor', accessor: 'proveedor' },
  { header: 'Stock', accessor: 'stock' },
  { header: 'Historial', accessor: 'historial' },
];

const fetchRepuestos = async (setRepuestos, setLoading, setError) => {
  setLoading(true);
  try {
    const res = await api.get('/admin_pro/repuestos');
    const data = res.data;
    if (data.data) {
      setRepuestos(
        data.data.map((r) => ({
          nombre: r.nombre,
          descripcion: r.descripcion,
          categoria: r.categorias_Repuestos?.nombre_tipo || '-',
          proveedor: r.proveedor?.nombre || '-',
          stock: r.stock ?? '-',
          historial: r.ordenes_repuestos?.length || 0,
        }))
      );
    } else {
      setError('No se pudo cargar el inventario');
    }
  } catch (e) {
    setError('Error de red o servidor');
  }
  setLoading(false);
};

export default function InventarioAvanzado() {
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRepuestos(setRepuestos, setLoading, setError);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Inventario avanzado de repuestos</h2>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <Table columns={columns} data={repuestos} />
    </div>
  );
}
