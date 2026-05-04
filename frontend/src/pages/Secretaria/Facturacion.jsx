// frontend/src/pages/Secretaria/Facturacion.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Table from '../../components/Table';
import { createFactura, getFacturas } from '../../services/secretaria/facturasService';
import { getOrdenes } from '../../services/secretaria/ordenesService';

const FacturacionPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [form, setForm] = useState({
    orden_id: '',
    monto_repuestos: '',
    mano_obra: '',
    impuestos: '',
    metodo_pago: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = useMemo(() => {
    return Number(form.monto_repuestos || 0) + Number(form.mano_obra || 0);
  }, [form.monto_repuestos, form.mano_obra]);

  const total = useMemo(() => subtotal + Number(form.impuestos || 0), [subtotal, form.impuestos]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [facturasResponse, ordenesResponse] = await Promise.all([getFacturas(), getOrdenes()]);
      setFacturas(facturasResponse.data.data || []);
      setOrdenes(ordenesResponse.data.data || []);
    } catch {
      setError('No se pudo cargar facturacion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createFactura({
        ...form,
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
      });
      setForm({ orden_id: '', monto_repuestos: '', mano_obra: '', impuestos: '', metodo_pago: '' });
      await loadData();
    } catch {
      setError('Error al crear la factura');
    } finally {
      setLoading(false);
    }
  };

  const columnas = [
    { header: 'ID', accessor: 'id_factura' },
    { header: 'Orden', accessor: 'orden_id' },
    { header: 'Cliente', accessor: 'cliente', render: (row) => row.orden?.diagnostico?.equipo?.cliente?.nombre || '' },
    { header: 'Fecha', accessor: 'fecha_emision', render: (row) => row.fecha_emision ? new Date(row.fecha_emision).toLocaleDateString() : '' },
    { header: 'Repuestos', accessor: 'monto_repuestos', render: (row) => row.monto_repuestos ? `C$ ${Number(row.monto_repuestos).toFixed(2)}` : '' },
    { header: 'Mano obra', accessor: 'mano_obra', render: (row) => row.mano_obra ? `C$ ${Number(row.mano_obra).toFixed(2)}` : '' },
    { header: 'Impuestos', accessor: 'impuestos', render: (row) => row.impuestos ? `C$ ${Number(row.impuestos).toFixed(2)}` : '' },
    { header: 'Total', accessor: 'total', render: (row) => row.total ? `C$ ${Number(row.total).toFixed(2)}` : '' },
    { header: 'Pago', accessor: 'metodo_pago' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Facturacion</h1>
        <p className="text-gray-500">Campos reales: orden, montos de repuestos, mano de obra, impuestos, total y metodo de pago.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <select required value={form.orden_id} onChange={(e) => setForm({ ...form, orden_id: e.target.value })} className="w-full border p-2 rounded-lg">
              <option value="">Seleccione una orden</option>
              {ordenes.map((orden) => (
                <option key={orden.id_orden} value={orden.id_orden}>
                  #{orden.id_orden} - {orden.diagnostico?.equipo?.cliente?.nombre || 'Sin cliente'}
                </option>
              ))}
            </select>
          </div>
          <Field label="Monto repuestos" value={form.monto_repuestos} onChange={(value) => setForm({ ...form, monto_repuestos: value })} />
          <Field label="Mano de obra" value={form.mano_obra} onChange={(value) => setForm({ ...form, mano_obra: value })} />
          <Field label="Impuestos" value={form.impuestos} onChange={(value) => setForm({ ...form, impuestos: value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metodo de pago</label>
            <select value={form.metodo_pago} onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })} className="w-full border p-2 rounded-lg">
              <option value="">Seleccione metodo</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div className="text-sm text-gray-500">Subtotal</div>
            <div className="font-semibold">C$ {subtotal.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">Total</div>
            <div className="font-semibold">C$ {total.toFixed(2)}</div>
          </div>
        </div>
        <button type="submit" disabled={loading} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-60">
          Crear Factura
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Cargando...</div> : <Table columns={columnas} data={facturas} />}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className="w-full border p-2 rounded-lg" />
  </div>
);

export default FacturacionPage;
