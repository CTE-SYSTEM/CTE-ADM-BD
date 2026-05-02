import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { createProveedor, deleteProveedor, getProveedores, updateProveedor } from '../../services/proveedoresService';

const ProveedorForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    telefono: initialData?.telefono || '',
    direccion: initialData?.direccion || '',
    correo: initialData?.correo || '',
    web: initialData?.web || '',
    notas: initialData?.notas || '',
  });

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
        <Field label="Telefono" name="telefono" value={formData.telefono} onChange={handleChange} />
        <Field label="Correo" name="correo" type="email" value={formData.correo} onChange={handleChange} />
        <Field label="Web" name="web" value={formData.web} onChange={handleChange} />
        <Field label="Direccion" name="direccion" value={formData.direccion} onChange={handleChange} className="md:col-span-2" />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea name="notas" value={formData.notas} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">{initialData ? 'Actualizar' : 'Guardar'}</button>
      </div>
    </form>
  );
};

const Field = ({ label, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
  </div>
);

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProveedores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProveedores();
      setProveedores(response.data.data || []);
    } catch {
      setError('No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProveedores();
  }, []);

  const columnas = [
    { header: 'ID', accessor: 'id_proveedor' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Telefono', accessor: 'telefono' },
    { header: 'Correo', accessor: 'correo' },
    { header: 'Web', accessor: 'web' },
    { header: 'Direccion', accessor: 'direccion' },
    { header: 'Notas', accessor: 'notas' },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => { setEditingProveedor(row); setShowForm(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(row.id_proveedor)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const filteredProveedores = proveedores.filter((proveedor) => {
    const term = searchTerm.toLowerCase();
    return [proveedor.nombre, proveedor.telefono, proveedor.correo, proveedor.web, proveedor.notas].some((value) =>
      String(value || '').toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      if (editingProveedor) await updateProveedor(editingProveedor.id_proveedor, data);
      else await createProveedor(data);
      setShowForm(false);
      setEditingProveedor(null);
      await loadProveedores();
    } catch {
      setError('Error al guardar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que quieres eliminar este proveedor?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteProveedor(id);
      await loadProveedores();
    } catch {
      setError('Error al eliminar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Gestion de Proveedores</h2>
        <p className="text-gray-500">Campos reales: nombre, telefono, direccion, correo, web y notas.</p>
      </div>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar proveedores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={() => { setEditingProveedor(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>
      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
          <ProveedorForm onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingProveedor(null); }} initialData={editingProveedor} />
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Cargando...</div> : <Table columns={columnas} data={filteredProveedores} />}
      </div>
    </div>
  );
};

export default Proveedores;
