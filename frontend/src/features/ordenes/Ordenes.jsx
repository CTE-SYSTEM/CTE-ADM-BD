import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';

const Ordenes = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [form, setForm] = useState({ numeroOrden: '', estado: 'PENDIENTE', clienteId: '', tecnicoId: '', equipoId: '' });

  useEffect(() => {
    setOrdenes([
      { id: 1, numeroOrden: 'ORD001', estado: 'PENDIENTE', clienteId: 1, tecnicoId: 1, equipoId: 1 },
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = { id: Date.now(), ...form };
    setOrdenes((s) => [next, ...s]);
    setForm({ numeroOrden: '', estado: 'PENDIENTE', clienteId: '', tecnicoId: '', equipoId: '' });
  };

  const columns = [
    { header: 'Número Orden', accessor: 'numeroOrden' },
    { header: 'Estado', accessor: 'estado' },
    { header: 'Cliente ID', accessor: 'clienteId' },
    { header: 'Técnico ID', accessor: 'tecnicoId' },
    { header: 'Equipo ID', accessor: 'equipoId' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Gestión de Órdenes de Trabajo</h1>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Número de Orden" value={form.numeroOrden} onChange={(e) => setForm({ ...form, numeroOrden: e.target.value })} className="border p-2 rounded" />
            <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="border p-2 rounded">
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="TERMINADA">Terminada</option>
            </select>
            <input placeholder="Cliente ID" value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Técnico ID" value={form.tecnicoId} onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })} className="border p-2 rounded" />
            <input placeholder="Equipo ID" value={form.equipoId} onChange={(e) => setForm({ ...form, equipoId: e.target.value })} className="border p-2 rounded" />
          </div>
          <div className="mt-4">
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Crear Orden</button>
          </div>
        </form>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <Table columns={columns} data={ordenes} />
        </div>
      </div>
    </div>
  );
};

export default Ordenes;