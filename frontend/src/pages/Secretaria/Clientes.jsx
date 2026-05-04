// frontend/src/pages/Secretaria/Clientes.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importado para la redirección
import Table from '../../components/Table';
import { Plus, Search, Edit, Trash2, ArrowRight } from 'lucide-react';
import { createCliente, deleteCliente, getClientes, updateCliente } from '../../services/secretaria/clientesService';

const emptyCliente = {
  nombre: '',
  telefono: '',
  direccion: '',
  correo: '',
  contacto_secundario: '',
};

// Componente de Formulario actualizado
const ClienteForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    telefono: initialData?.telefono || '',
    direccion: initialData?.direccion || '',
    correo: initialData?.correo || '',
    contacto_secundario: initialData?.contacto_secundario || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
        <Field label="Telefono" name="telefono" value={formData.telefono} onChange={handleChange} />
        <Field label="Correo" name="correo" type="email" value={formData.correo} onChange={handleChange} />
        <Field label="Contacto secundario" name="contacto_secundario" value={formData.contacto_secundario} onChange={handleChange} />
        <Field label="Direccion" name="direccion" value={formData.direccion} onChange={handleChange} className="md:col-span-2" />
      </div>
      
      {/* Pasamos formData a las acciones para manejar los diferentes tipos de submit */}
      <FormActions 
        onCancel={onCancel} 
        isEditing={Boolean(initialData)} 
        onSave={() => onSubmit(formData, 'save')}
        onNext={() => onSubmit(formData, 'next')}
      />
    </form>
  );
};

const Field = ({ label, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    />
  </div>
);

// Acciones del formulario con el nuevo botón
const FormActions = ({ onCancel, isEditing, onSave, onNext }) => (
  <div className="flex flex-wrap justify-end gap-3 pt-4">
    <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
      Cancelar
    </button>
    
    <button 
      type="button" 
      onClick={onSave}
      className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
    >
      {isEditing ? 'Actualizar' : 'Solo Guardar'}
    </button>

    {!isEditing && (
      <button 
        type="button" 
        onClick={onNext}
        className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
      >
        Guardar y Continuar <ArrowRight className="w-4 h-4" />
      </button>
    )}
  </div>
);

const Clientes = () => {
  const navigate = useNavigate(); // Inicializar el hook de navegación
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getClientes();
      setClientes(response.data.data || []);
    } catch {
      setError('No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const columnas = [
    { header: 'ID', accessor: 'id_cliente' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Telefono', accessor: 'telefono' },
    { header: 'Correo', accessor: 'correo' },
    { header: 'Contacto secundario', accessor: 'contacto_secundario' },
    { header: 'Direccion', accessor: 'direccion' },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => { setEditingCliente(row); setShowForm(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row.id_cliente)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredClientes = clientes.filter((cliente) => {
    const term = searchTerm.toLowerCase();
    return [cliente.nombre, cliente.telefono, cliente.correo, cliente.contacto_secundario].some((value) =>
      String(value || '').toLowerCase().includes(term)
    );
  });

  // handleSubmit actualizado para manejar la redirección
  const handleSubmit = async (data, action) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (editingCliente) {
        response = await updateCliente(editingCliente.id_cliente, data);
      } else {
        response = await createCliente(data || emptyCliente);
      }

      // Si la acción es 'next', vamos a la pantalla de equipos enviando el ID del cliente
      if (action === 'next' && response?.data?.data?.id_cliente) {
        const idNuevo = response.data.data.id_cliente;
        navigate('/secretaria/equipos', { state: { clienteId: idNuevo, nombreCliente: data.nombre } });
      } else {
        setShowForm(false);
        setEditingCliente(null);
        await loadClientes();
      }
    } catch (err) {
      setError('Error al guardar el cliente. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que quieres eliminar este cliente?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteCliente(id);
      await loadClientes();
    } catch {
      setError('Error al eliminar el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Gestion de Clientes</h2>
        <p className="text-gray-500">Campos reales: nombre, telefono, direccion, correo y contacto secundario.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar clientes..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
          />
        </div>
        <button onClick={() => { setEditingCliente(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          <ClienteForm onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingCliente(null); }} initialData={editingCliente} />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Cargando...</div> : <Table columns={columnas} data={filteredClientes} />}
      </div>
    </div>
  );
};

export default Clientes;