import React, { useState } from 'react';
import Table from '../../components/Table';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';

// Formulario para Asignar Repuestos a Proveedor
const CompraForm = ({ onSubmit, onCancel, initialData = null, proveedores = [], repuestos = [] }) => {
  const [formData, setFormData] = useState({
    proveedorId: initialData?.proveedorId || '',
    repuestoIds: initialData?.repuestoIds || [],
  });

  const handleProveedorChange = (e) => {
    setFormData((prev) => ({ ...prev, proveedorId: e.target.value }));
  };

  const handleRepuestoToggle = (repuestoId) => {
    setFormData((prev) => {
      const current = prev.repuestoIds || [];
      if (current.includes(repuestoId)) {
        return { ...prev, repuestoIds: current.filter((id) => id !== repuestoId) };
      } else {
        return { ...prev, repuestoIds: [...current, repuestoId] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectedProveedor = proveedores.find((p) => p.id === parseInt(formData.proveedorId));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Proveedor
        </label>
        <select
          name="proveedorId"
          value={formData.proveedorId}
          onChange={handleProveedorChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Seleccione un proveedor</option>
          {proveedores.map((proveedor) => (
            <option key={proveedor.id} value={proveedor.id}>
              {proveedor.nombre}
            </option>
          ))}
        </select>
      </div>

      {formData.proveedorId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repuestos que surte este proveedor
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {repuestos.map((repuesto) => (
              <label
                key={repuesto.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.repuestoIds.includes(repuesto.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.repuestoIds.includes(repuesto.id)}
                  onChange={() => handleRepuestoToggle(repuesto.id)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-800">{repuesto.nombre}</div>
                  <div className="text-xs text-gray-500">{repuesto.categoria}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

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
          disabled={formData.repuestoIds.length === 0}
          className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {initialData ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

// Componente principal de Compras (Proveedor-Repuesto)
const Compras = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCompra, setEditingCompra] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [proveedores] = useState([
    { id: 1, nombre: 'TechParts Nicaragua' },
    { id: 2, nombre: 'Electrónica Central' },
    { id: 3, nombre: 'Repuestos Express' },
  ]);

  const [repuestos] = useState([
    { id: 1, nombre: 'Pantalla HP 15.6"', categoria: 'Pantallas' },
    { id: 2, nombre: 'Batería Dell Inspiron', categoria: 'Baterías' },
    { id: 3, nombre: 'Cargador Lenovo', categoria: 'Cargadores' },
    { id: 4, nombre: 'Teclado Samsung', categoria: 'Teclados' },
    { id: 5, nombre: 'Disco SSD 256GB', categoria: 'Discos Duros' },
    { id: 6, nombre: 'Memoria RAM 8GB', categoria: 'Memoria RAM' },
  ]);

  // Datos de ejemplo - relación muchos a muchos
  const [compras, setCompras] = useState([
    { 
      id: 1, 
      proveedor: 'TechParts Nicaragua', 
      repuestos: ['Pantalla HP 15.6"', 'Batería Dell Inspiron', 'Cargador Lenovo'],
      cantidad: 3,
      fecha: '2026-04-20'
    },
    { 
      id: 2, 
      proveedor: 'Electrónica Central', 
      repuestos: ['Teclado Samsung', 'Disco SSD 256GB'],
      cantidad: 2,
      fecha: '2026-04-18'
    },
    { 
      id: 3, 
      proveedor: 'Repuestos Express', 
      repuestos: ['Memoria RAM 8GB', 'Cargador Lenovo'],
      cantidad: 2,
      fecha: '2026-04-15'
    },
  ]);

  const columnas = [
    { header: 'ID', accessor: 'id' },
    { header: 'Proveedor', accessor: 'proveedor' },
    { 
      header: 'Repuestos', 
      accessor: 'repuestos',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.repuestos.map((rep, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded-full">
              {rep}
            </span>
          ))}
        </div>
      ),
    },
    { header: 'Cantidad', accessor: 'cantidad' },
    { header: 'Fecha', accessor: 'fecha' },
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

  const filteredCompras = compras.filter((compra) =>
    compra.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    compra.repuestos.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const proveedor = proveedores.find((p) => p.id === parseInt(data.proveedorId));
      const repuestosAsignados = repuestos.filter((r) => data.repuestoIds.includes(r.id));
      const repuestosNombres = repuestosAsignados.map((r) => r.nombre);

      const compraData = {
        proveedor: proveedor?.nombre || '',
        repuestos: repuestosNombres,
        cantidad: repuestosNombres.length,
        fecha: new Date().toISOString().split('T')[0],
      };

      if (editingCompra) {
        setCompras((prev) =>
          prev.map((c) => (c.id === editingCompra.id ? { ...compraData, id: c.id } : c))
        );
      } else {
        setCompras((prev) => [...prev, { ...compraData, id: Date.now() }]);
      }
      setShowForm(false);
      setEditingCompra(null);
    } catch (err) {
      setError('Error al guardar la compra');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (compra) => {
    setEditingCompra(compra);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta relación?')) {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCompras((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        setError('Error al eliminar la compra');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Gestión de Compras</h2>
        <p className="text-gray-500">Administra qué proveedores surten qué repuestos</p>
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
            placeholder="Buscar compras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            setEditingCompra(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Relación
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCompra ? 'Editar Relación' : 'Nueva Relación Proveedor-Repuesto'}
          </h3>
          <CompraForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingCompra(null);
            }}
            initialData={editingCompra}
            proveedores={proveedores}
            repuestos={repuestos}
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
          <Table columns={columnas} data={filteredCompras} />
        )}
      </div>
    </div>
  );
};

export default Compras;