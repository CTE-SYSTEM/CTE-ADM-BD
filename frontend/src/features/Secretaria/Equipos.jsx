import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';

const Equipos = () => {
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState({ tipo: '', marca: '', modelo: '', serial: '', descripcion: '', clienteId: '' });

  useEffect(() => {
    setEquipos([
      { id: 1, tipo: 'Celular', marca: 'Samsung', modelo: 'Galaxy S21', serial: '12345', clienteId: 1 },
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = { id: Date.now(), ...form };
    setEquipos((s) => [next, ...s]);
    setForm({ tipo: '', marca: '', modelo: '', serial: '', descripcion: '', clienteId: '' });
  };

  const columns = [
    { header: 'Tipo', accessor: 'tipo' },
    { header: 'Marca', accessor: 'marca' },
    { header: 'Modelo', accessor: 'modelo' },
    { header: 'Serial', accessor: 'serial' },
    { header: 'Cliente ID', accessor: 'clienteId' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Gestión de Equipos</h1>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Marca" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Serial" value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="border p-2 rounded col-span-2" />
            <input placeholder="Cliente ID" value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} className="border p-2 rounded" />
          </div>
          <div className="mt-4">
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Agregar Equipo</button>
          </div>
        </form>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <Table columns={columns} data={equipos} />
        </div>
      </div>
    </div>
  );
};

export default Equipos;