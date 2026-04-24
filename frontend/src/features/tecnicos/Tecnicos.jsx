import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';

const Tecnicos = () => {
  const [tecnicos, setTecnicos] = useState([]);
  const [form, setForm] = useState({ nombre: '', apellido: '', especialidad: '', email: '', telefono: '' });

  useEffect(() => {
    setTecnicos([
      { id: 1, nombre: 'Carlos', apellido: 'Gómez', especialidad: 'Electrónica', email: 'carlos@example.com', telefono: '123' },
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = { id: Date.now(), ...form };
    setTecnicos((s) => [next, ...s]);
    setForm({ nombre: '', apellido: '', especialidad: '', email: '', telefono: '' });
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Apellido', accessor: 'apellido' },
    { header: 'Especialidad', accessor: 'especialidad' },
    { header: 'Email', accessor: 'email' },
    { header: 'Teléfono', accessor: 'telefono' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Gestión de Técnicos</h1>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Especialidad" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="border p-2 rounded" />
          </div>
          <div className="mt-4">
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Agregar Técnico</button>
          </div>
        </form>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <Table columns={columns} data={tecnicos} />
        </div>
      </div>
    </div>
  );
};

export default Tecnicos;