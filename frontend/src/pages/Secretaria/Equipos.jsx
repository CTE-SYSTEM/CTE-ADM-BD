import React, { useState } from 'react';
import Table from '../../components/Table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

// Componente de formulario para Equipo
const EquipoForm = ({ onSubmit, onCancel, initialData = null, clientes = [] }) => {
  const [formData, setFormData] = useState({
    clienteId: initialData?.clienteId || '',
    marca: initialData?.marca || '',
    modelo: initialData?.modelo || '',
    numeroSerie: initialData?.numeroSerie || '',
    problemaInicial: initialData?.problemaInicial || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente
          </label>
          <select
            name="clienteId"
            value={formData.clienteId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marca
          </label>
          <input
            type="text"
            name="marca"
            value={formData.marca}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ej: HP, Dell, Samsung"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Modelo
          </label>
          <input
            type="text"
            name="modelo"
            value={formData.modelo}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ej: Pavilion, Inspiron"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Serie
          </label>
          <input
            type="text"
            name="numeroSerie"
            value={formData.numeroSerie}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ingrese el número de serie"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Problema Inicial
          </label>
          <textarea
            name="problemaInicial"
            value={formData.problemaInicial}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describa el problema reportado"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {initialData ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

// Componente principal de Equipos
const Equipos = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Datos de ejemplo - reemplazar con API
  const [clientes] = useState([
    { id: 1, nombre: 'Juan Pérez' },
    { id: 2, nombre: 'María García' },
    { id: 3, nombre: 'Carlos López' },
  ]);

  const [equipos, setEquipos] = useState([
    { id: 1, clienteId: 1, cliente: 'Juan Pérez', marca: 'HP', modelo: 'Pavilion', numeroSerie: 'SN-001-2024', problemaInicial: 'No enciende' },
    { id: 2, clienteId: 2, cliente: 'María García', marca: 'Dell', modelo: 'Inspiron', numeroSerie: 'SN-002-2024', problemaInicial: 'Pantalla azul' },
    { id: 3, clienteId: 3, cliente: 'Carlos López', marca: 'Samsung', modelo: 'Galaxy Tab', numeroSerie: 'SN-003-2024', problemaInicial: 'Batería no carga' },
  ]);

  const columnas = [
    { header: 'ID', accessor: 'id' },
    { header: 'Cliente', accessor: 'cliente' },
    { header: 'Marca', accessor: 'marca' },
    { header: 'Modelo', accessor: 'modelo' },
    { header: 'No. Serie', accessor: 'numeroSerie' },
    { header: 'Problema', accessor: 'problemaInicial' },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredEquipos = equipos.filter((equipo) =>
    equipo.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipo.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const cliente = clientes.find((c) => c.id === parseInt(data.clienteId));
      const equipoData = { ...data, cliente: cliente?.nombre || '' };

      if (editingEquipo) {
        setEquipos((prev) =>
          prev.map((e) => (e.id === editingEquipo.id ? { ...equipoData, id: e.id } : e))
        );
      } else {
        setEquipos((prev) => [...prev, { ...equipoData, id: Date.now() }]);
      }
      setShowForm(false);
      setEditingEquipo(null);
    } catch (err) {
      setError('Error al guardar el equipo');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (equipo) => {
    setEditingEquipo(equipo);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este equipo?')) {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setEquipos((prev) => prev.filter((e) => e.id !== id));
      } catch (err) {
        setError('Error al eliminar el equipo');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Gestión de Equipos</h2>
        <p className="text-gray-500">Administra los equipos de los clientes</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            setEditingEquipo(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Equipo
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingEquipo ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h3>
          <EquipoForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingEquipo(null);
            }}
            initialData={editingEquipo}
            clientes={clientes}
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            Cargando...
          </div>
        ) : (
          <Table columns={columnas} data={filteredEquipos} />
        )}
      </div>
    </div>
  );
};

export default Equipos;