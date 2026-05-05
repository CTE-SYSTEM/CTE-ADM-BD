import React, { useState, useEffect } from 'react';

const Facturacion = () => {
  const [facturas, setFacturas] = useState([]);
  const [form, setForm] = useState({ numeroFactura: '', subtotal: '', iva: '', total: '', estado: 'PENDIENTE', clienteId: '', ordenId: '' });

  useEffect(() => {
    setFacturas([
      { id: 1, numeroFactura: 'FAC001', subtotal: 100.00, iva: 16.00, total: 116.00, estado: 'PENDIENTE', clienteId: 1 },
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Crear factura:', form);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Facturación</h1>
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Número Factura" value={form.numeroFactura} onChange={(e) => setForm({...form, numeroFactura: e.target.value})} className="border p-2 rounded" />
          <input type="number" step="0.01" placeholder="Subtotal" value={form.subtotal} onChange={(e) => setForm({...form, subtotal: e.target.value})} className="border p-2 rounded" />
          <input type="number" step="0.01" placeholder="IVA" value={form.iva} onChange={(e) => setForm({...form, iva: e.target.value})} className="border p-2 rounded" />
          <input type="number" step="0.01" placeholder="Total" value={form.total} onChange={(e) => setForm({...form, total: e.target.value})} className="border p-2 rounded" />
          <select value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value})} className="border p-2 rounded">
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
          <input type="number" placeholder="Cliente ID" value={form.clienteId} onChange={(e) => setForm({...form, clienteId: e.target.value})} className="border p-2 rounded" />
          <input type="number" placeholder="Orden ID" value={form.ordenId} onChange={(e) => setForm({...form, ordenId: e.target.value})} className="border p-2 rounded" />
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Crear Factura</button>
      </form>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Número Factura</th>
            <th className="p-2">Subtotal</th>
            <th className="p-2">IVA</th>
            <th className="p-2">Total</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Cliente ID</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {facturas.map(factura => (
            <tr key={factura.id}>
              <td className="p-2">{factura.numeroFactura}</td>
              <td className="p-2">${factura.subtotal}</td>
              <td className="p-2">${factura.iva}</td>
              <td className="p-2">${factura.total}</td>
              <td className="p-2">{factura.estado}</td>
              <td className="p-2">{factura.clienteId}</td>
              <td className="p-2">
                <button className="text-blue-500 mr-2">Editar</button>
                <button className="text-red-500">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Facturacion;