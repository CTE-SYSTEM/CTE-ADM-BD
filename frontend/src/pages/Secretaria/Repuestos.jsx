import React, { useState } from 'react';
import Table from '../../components/Table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

// Formulario para Repuesto
const RepuestoForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    descripcion: initialData?.descripcion || '',
    precio: initialData?.precio || '',
    stock: initialData?.stock || '0',
    categoria: initialData?.categoria || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Repuesto
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Nombre del repuesto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Seleccione categoría</option>
            <option value="Pantallas">Pantallas</option>
            <option value="Baterías">Baterías</option>
            <option value="Cargadores">Cargadores</option>
            <option value="Teclados">Teclados</option>
            <option value="Discos Duros">Discos Duros</option>
            <option value="Memoria RAM">Memoria RAM</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio (C$)
          </label>
          <input
            type="number"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Cantidad en stock"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Descripción del repuesto"
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

// Componente principal de Repuestos
const Repuestos = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [repuestos, setRepuestos] = useState([
    { id: 1, nombre: 'Pantalla HP 15.6"', descripcion: 'Pantalla LED para HP Pavilion', precio: 2500, stock: 5, categoria: 'Pantallas' },
    { id: 2, nombre: 'Batería Dell Inspiron', descripcion: 'Batería original Dell 6 celdas', precio: 1800, stock: 12, categoria: 'Baterías' },
    { id: 3, nombre: 'Cargador Lenovo', descripcion: 'Cargador 65W original', precio: 850, stock: 8, categoria: 'Cargadores' },
    { id: 4, nombre: 'Teclado Samsung', descripcion: 'Teclado para Samsung NP300', precio: 1200, stock: 3, categoria: 'Teclados' },
  ]);

  const columnas = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Categoría', accessor: 'categoria' },
    { header: 'Descripción', accessor: 'descripcion' },
    { header: 'Precio', accessor: 'precio', render: (row) => `C$ ${row.precio.toFixed(2)}` },
    { header: 'Stock', accessor: 'stock' },
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

  const filteredRepuestos = repuestos.filter((repuesto) =>
    repuesto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repuesto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repuesto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      if (editingRepuesto) {
        setRepuestos((prev) =>
          prev.map((r) => (r.id === editingRepuesto.id ? { ...data, id: r.id } : r))
        );
      } else {
        setRepuestos((prev) => [...prev, { ...data, id: Date.now() }]);
      }
      setShowForm(false);
      setEditingRepuesto(null);
    } catch (err) {
      setError('Error al guardar el repuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (repuesto) => {
    setEditingRepuesto(repuesto);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este repuesto?')) {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setRepuestos((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        setError('Error al eliminar el repuesto');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Gestión de Repuestos</h2>
        <p className="text-gray-500">Administra el inventario de repuestos</p>
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
            placeholder="Buscar repuestos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            setEditingRepuesto(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Repuesto
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingRepuesto ? 'Editar Repuesto' : 'Nuevo Repuesto'}
          </h3>
          <RepuestoForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingRepuesto(null);
            }}
            initialData={editingRepuesto}
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
          <Table columns={columnas} data={filteredRepuestos} />
        )}
      </div>
    </div>
  );
};

export default Repuestos;