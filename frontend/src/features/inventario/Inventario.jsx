import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';

const Inventario = () => {
  const [repuestos, setRepuestos] = useState([]);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', stock: '', minimoStock: '', proveedorId: '' });

  useEffect(() => {
    setRepuestos([
      { id: 1, nombre: 'Pantalla LCD', descripcion: 'Pantalla para celular', precio: 50.0, stock: 20, minimoStock: 5 },
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = { id: Date.now(), ...form };
    setRepuestos((s) => [next, ...s]);
    setForm({ nombre: '', descripcion: '', precio: '', stock: '', minimoStock: '', proveedorId: '' });
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Descripción', accessor: 'descripcion' },
    { header: 'Precio', accessor: 'precio' },
    { header: 'Stock', accessor: 'stock' },
    { header: 'Mínimo Stock', accessor: 'minimoStock' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Inventario de Repuestos</h1>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Precio" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Mínimo Stock" value={form.minimoStock} onChange={(e) => setForm({ ...form, minimoStock: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Proveedor ID" value={form.proveedorId} onChange={(e) => setForm({ ...form, proveedorId: e.target.value })} className="border p-2 rounded" />
          </div>
          <div className="mt-4">
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Agregar Repuesto</button>
          </div>
        </form>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <Table columns={columns} data={repuestos} />
        </div>
      </div>
    </div>
  );
};

export default Inventario;