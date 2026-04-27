import React, { useState } from 'react';
import Table from '../../components/Table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

// Componente de formulario para Cliente
const ClienteForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    telefono: initialData?.telefono || '',
    direccion: initialData?.direccion || '',
    cedula: initialData?.cedula || '',
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
            Nombre Completo
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ingrese el nombre"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ingrese el teléfono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ingrese la dirección"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cédula
          </label>
          <input
            type="text"
            name="cedula"
            value={formData.cedula}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ingrese la cédula"
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

// Componente principal de Clientes
const Clientes = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Datos de ejemplo - reemplazar con API
  const [clientes, setClientes] = useState([
    { id: 1, nombre: 'Juan Pérez', telefono: '+505 8888-1111', direccion: 'Managua, Nicaragua', cedula: '001-150195-0000S' },
    { id: 2, nombre: 'María García', telefono: '+505 8888-2222', direccion: 'León, Nicaragua', cedula: '001-280295-0001S' },
    { id: 3, nombre: 'Carlos López', telefono: '+505 8888-3333', direccion: 'Granada, Nicaragua', cedula: '001-120388-0002S' },
  ]);

  const columnas = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Teléfono', accessor: 'telefono' },
    { header: 'Dirección', accessor: 'direccion' },
    { header: 'Cédula', accessor: 'cedula' },
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

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cedula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      // Simulación de API - reemplazar con llamada real
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      if (editingCliente) {
        setClientes((prev) =>
          prev.map((c) => (c.id === editingCliente.id ? { ...data, id: c.id } : c))
        );
      } else {
        setClientes((prev) => [...prev, { ...data, id: Date.now() }]);
      }
      setShowForm(false);
      setEditingCliente(null);
    } catch (err) {
      setError('Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setClientes((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        setError('Error al eliminar el cliente');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Gestión de Clientes</h2>
        <p className="text-gray-500">Administra los clientes del centro técnico</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Barra de búsqueda y botón agregar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            setEditingCliente(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h3>
          <ClienteForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingCliente(null);
            }}
            initialData={editingCliente}
          />
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            Cargando...
          </div>
        ) : (
          <Table columns={columnas} data={filteredClientes} />
        )}
      </div>
    </div>
  );
};

export default Clientes;