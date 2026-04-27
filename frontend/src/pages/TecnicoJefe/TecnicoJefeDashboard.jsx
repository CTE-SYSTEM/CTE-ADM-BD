import React, { useState } from 'react';
import { Users, Wrench, Package, AlertCircle, CheckCircle, Clock, UserPlus } from 'lucide-react';
import { EstadoBadge, PrioridadBadge } from '../Secretaria/NuevaOrden';
import Table from '../../components/Table';

// Modal para asignar técnico
const AsignarTecnicoModal = ({ orden, tecnicos, onClose, onAsignar }) => {
  const [selectedTecnico, setSelectedTecnico] = useState('');
  const [prioridad, setPrioridad] = useState(orden?.prioridad || 'MEDIA');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTecnico) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onAsignar({
        ordenId: orden.id,
        tecnicoId: selectedTecnico,
        prioridad,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Asignar Técnico</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Info de la orden */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-500">Orden</div>
            <div className="font-medium text-gray-800">{orden?.id}</div>
            <div className="text-sm text-gray-600">{orden?.cliente} - {orden?.equipo}</div>
          </div>

          {/* Selección de técnico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Técnico *
            </label>
            <select
              value={selectedTecnico}
              onChange={(e) => setSelectedTecnico(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Seleccione un técnico</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nombre} - {tecnico.especialidad}
                </option>
              ))}
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedTecnico || loading}
              className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para aprobar reparación
const AprobarReparacionModal = ({ orden, repuestos, onClose, onAprobar, onRechazar }) => {
  const [loading, setLoading] = useState(false);

  const handleAprobar = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onAprobar(orden.id);
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onRechazar(orden.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Aprobar Reparación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Info de la orden */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-500">Orden</div>
            <div className="font-medium text-gray-800">{orden?.id}</div>
            <div className="text-sm text-gray-600">{orden?.cliente} - {orden?.equipo}</div>
            <div className="mt-2"><EstadoBadge estado={orden?.estado} /></div>
          </div>

          {/* Repuestos asociados */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Repuestos a utilizar</h4>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {repuestos.length > 0 ? (
                repuestos.map((rep, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">{rep.nombre}</div>
                      <div className="text-sm text-gray-500">{rep.categoria}</div>
                    </div>
                    <div className="text-sm text-gray-600">C$ {rep.precio}</div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No hay repuestos asociados
                </div>
              )}
            </div>
          </div>

          {/* Total estimado */}
          <div className="bg-indigo-50 rounded-lg p-3 flex justify-between items-center">
            <span className="font-medium text-gray-800">Total estimado:</span>
            <span className="text-lg font-bold text-indigo-600">
              C$ {repuestos.reduce((sum, r) => sum + (r.precio || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleRechazar}
            disabled={loading}
            className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            Rechazar
          </button>
          <button
            onClick={handleAprobar}
            disabled={loading}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Aprobar Reparación'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard del Técnico Jefe
const TecnicoJefeDashboard = () => {
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [showAprobarModal, setShowAprobarModal] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  // Datos de ejemplo
  const [ordenesPorAsignar, setOrdenesPorAsignar] = useState([
    { id: 'ORD-001', cliente: 'Juan Pérez', equipo: 'HP Pavilion', fallaReportada: 'No enciende', prioridad: 'ALTA', estado: 'PENDIENTE_ASIGNACION', fecha: '2026-04-26' },
    { id: 'ORD-002', cliente: 'María García', equipo: 'Dell Inspiron', fallaReportada: 'Pantalla azul', prioridad: 'URGENTE', estado: 'PENDIENTE_ASIGNACION', fecha: '2026-04-26' },
    { id: 'ORD-003', cliente: 'Carlos López', equipo: 'Samsung Tab', fallaReportada: 'Batería no carga', prioridad: 'MEDIA', estado: 'PENDIENTE_ASIGNACION', fecha: '2026-04-25' },
  ]);

  const [ordenesAsignadas, setOrdenesAsignadas] = useState([
    { id: 'ORD-004', cliente: 'Ana Martínez', equipo: 'MacBook Pro', tecnico: 'Pedro Rivera', prioridad: 'ALTA', estado: 'ASIGNADO', fecha: '2026-04-24' },
    { id: 'ORD-005', cliente: 'Luis Hernández', equipo: 'Lenovo ThinkPad', tecnico: 'Maria López', prioridad: 'MEDIA', estado: 'EN_REPARACION', fecha: '2026-04-23' },
  ]);

  const [tecnicos] = useState([
    { id: 1, nombre: 'Pedro Rivera', especialidad: 'Computadoras' },
    { id: 2, nombre: 'Maria López', especialidad: 'Móviles' },
    { id: 3, nombre: 'Jorge Campos', especialidad: 'Impresoras' },
  ]);

  const [repuestosOrden] = useState([
    { nombre: 'Pantalla HP 15.6"', categoria: 'Pantallas', precio: 2500 },
    { nombre: 'Batería Dell', categoria: 'Baterías', precio: 1800 },
  ]);

  const columnasPorAsignar = [
    { header: 'ID', accessor: 'id' },
    { header: 'Cliente', accessor: 'cliente' },
    { header: 'Equipo', accessor: 'equipo' },
    { header: 'Falla', accessor: 'fallaReportada' },
    { header: 'Prioridad', accessor: 'prioridad', render: (row) => <PrioridadBadge prioridad={row.prioridad} /> },
    { header: 'Fecha', accessor: 'fecha' },
    {
      header: 'Acción',
      accessor: 'accion',
      render: (row) => (
        <button
          onClick={() => {
            setOrdenSeleccionada(row);
            setShowAsignarModal(true);
          }}
          className="px-3 py-1 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Asignar
        </button>
      ),
    },
  ];

  const columnasAsignadas = [
    { header: 'ID', accessor: 'id' },
    { header: 'Cliente', accessor: 'cliente' },
    { header: 'Equipo', accessor: 'equipo' },
    { header: 'Técnico', accessor: 'tecnico' },
    { header: 'Prioridad', accessor: 'prioridad', render: (row) => <PrioridadBadge prioridad={row.prioridad} /> },
    { header: 'Estado', accessor: 'estado', render: (row) => <EstadoBadge estado={row.estado} /> },
    {
      header: 'Acción',
      accessor: 'accion',
      render: (row) => (
        <button
          onClick={() => {
            setOrdenSeleccionada(row);
            setShowAprobarModal(true);
          }}
          className="px-3 py-1 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          Ver / Aprobar
        </button>
      ),
    },
  ];

  const handleAsignar = (data) => {
    // Mover orden de "por asignar" a "asignadas"
    const orden = ordenesPorAsignar.find((o) => o.id === data.ordenId);
    const tecnico = tecnicos.find((t) => t.id === parseInt(data.tecnicoId));

    if (orden && tecnico) {
      setOrdenesAsignadas((prev) => [
        ...prev,
        { ...orden, tecnico: tecnico.nombre, prioridad: data.prioridad, estado: 'ASIGNADO' },
      ]);
      setOrdenesPorAsignar((prev) => prev.filter((o) => o.id !== data.ordenId));
    }
    setShowAsignarModal(false);
    setOrdenSeleccionada(null);
  };

  const handleAprobar = (ordenId) => {
    setOrdenesAsignadas((prev) =>
      prev.map((o) => (o.id === ordenId ? { ...o, estado: 'APROBADO' } : o))
    );
    setShowAprobarModal(false);
    setOrdenSeleccionada(null);
  };

  const handleRechazar = (ordenId) => {
    setOrdenesAsignadas((prev) =>
      prev.map((o) => (o.id === ordenId ? { ...o, estado: 'RECHAZADO' } : o))
    );
    setShowAprobarModal(false);
    setOrdenSeleccionada(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Panel Técnico Jefe
        </h1>
        <p className="text-gray-500">
          Centro Técnico Electrónico - Gestión de Órdenes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{ordenesPorAsignar.length}</div>
              <div className="text-sm text-gray-500">Por Asignar</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{ordenesAsignadas.length}</div>
              <div className="text-sm text-gray-500">En Taller</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">12</div>
              <div className="text-sm text-gray-500">Completadas</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{tecnicos.length}</div>
              <div className="text-sm text-gray-500">Técnicos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Órdenes por Asignar */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <h2 className="text-xl font-semibold text-gray-800">Órdenes por Asignar</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {ordenesPorAsignar.length > 0 ? (
            <Table columns={columnasPorAsignar} data={ordenesPorAsignar} />
          ) : (
            <div className="p-8 text-center text-gray-500">
              No hay órdenes pendientes de asignación
            </div>
          )}
        </div>
      </div>

      {/* Órdenes Asignadas */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Órdenes en Taller</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table columns={columnasAsignadas} data={ordenesAsignadas} />
        </div>
      </div>

      {/* Modales */}
      {showAsignarModal && (
        <AsignarTecnicoModal
          orden={ordenSeleccionada}
          tecnicos={tecnicos}
          onClose={() => {
            setShowAsignarModal(false);
            setOrdenSeleccionada(null);
          }}
          onAsignar={handleAsignar}
        />
      )}

      {showAprobarModal && (
        <AprobarReparacionModal
          orden={ordenSeleccionada}
          repuestos={repuestosOrden}
          onClose={() => {
            setShowAprobarModal(false);
            setOrdenSeleccionada(null);
          }}
          onAprobar={handleAprobar}
          onRechazar={handleRechazar}
        />
      )}
    </div>
  );
};

export default TecnicoJefeDashboard;