import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', direccion: '' });

  // Simular fetch de datos
  useEffect(() => {
    setClientes([
      { id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com', telefono: '123456789' },
      { id: 2, nombre: 'María', apellido: 'García', email: 'maria@example.com', telefono: '987654321' },
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = { id: Date.now(), ...form };
    setClientes((s) => [next, ...s]);
    setForm({ nombre: '', apellido: '', email: '', telefono: '', direccion: '' });
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Apellido', accessor: 'apellido' },
    { header: 'Email', accessor: 'email' },
    { header: 'Teléfono', accessor: 'telefono' },
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Agregar Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="border p-2 rounded col-span-2" />
          </div>
          <div className="mt-4">
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Agregar</button>
          </div>
        </form>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Clientes Recientes</h2>
          <Table columns={columns} data={clientes} />
        </div>
      </div>
    </div>
  );
};

export default Clientes;