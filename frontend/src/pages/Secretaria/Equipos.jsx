// frontend/src/pages/Secretaria/Equipos.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Table from '../../components/Table';
import { Plus, Search, Edit, Trash2, Phone, User } from 'lucide-react';
import { getClientes } from '../../services/clientesService';
import { createEquipo, deleteEquipo, getEquipos, updateEquipo } from '../../services/equiposService';

const EquipoForm = ({ onSubmit, onCancel, initialData = null, clientes = [], preSelectedClient = null }) => {
  const [formData, setFormData] = useState({
    cliente_id: initialData?.cliente_id || preSelectedClient?.id || '',
    tipo: initialData?.tipo || '',
    marca: initialData?.marca || '',
    modelo: initialData?.modelo || '',
    numero_serie: initialData?.numero_serie || '',
  });

  const clienteInfo = clientes.find(c => String(c.id_cliente) === String(formData.cliente_id));
  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        {/* Selector de Cliente */}
        <div className={clienteInfo ? "md:col-span-1" : "md:col-span-2"}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select 
            name="cliente_id" 
            value={formData.cliente_id} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* Verificación visual en Formulario */}
        {clienteInfo && (
          <div className="animate-in fade-in zoom-in duration-200">
            <label className="block text-sm font-medium text-indigo-600 mb-1 font-bold">Verificación de Usuario</label>
            <div className="flex items-center justify-between w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm h-[42px]">
              <div className="flex items-center gap-2 text-indigo-700">
                <Phone className="w-4 h-4" />
                <span className="text-sm font-semibold">{clienteInfo.telefono || 'Sin número'}</span>
              </div>
              <span className="text-[10px] font-mono bg-indigo-200 px-2 py-0.5 rounded text-indigo-800">
                ID: {clienteInfo.id_cliente}
              </span>
            </div>
          </div>
        )}

        <Field label="Tipo" name="tipo" value={formData.tipo} onChange={handleChange} placeholder="Ej: Laptop" required />
        <Field label="Marca" name="marca" value={formData.marca} onChange={handleChange} placeholder="Ej: HP" required />
        <Field label="Modelo" name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej: Victus 15" required />
        <Field label="Número de Serie" name="numero_serie" value={formData.numero_serie} onChange={handleChange} placeholder="S/N" />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-2">
        <button type="button" onClick={onCancel} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">
          Cancelar
        </button>
        <button type="submit" className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md transition-all font-bold">
          {initialData ? 'Actualizar Equipo' : 'Guardar Equipo'}
        </button>
      </div>
    </form>
  );
};

const Field = ({ label, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
  </div>
);

const Equipos = () => {
  const location = useLocation();
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [showForm, setShowForm] = useState(!!location.state?.clienteId);
  const [editingEquipo, setEditingEquipo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const preSelectedClient = location.state?.clienteId ? {
    id: location.state.clienteId,
    nombre: location.state.nombreCliente
  } : null;

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.all([getClientes(), getEquipos()]);
      setClientes(cRes.data.data || []);
      setEquipos(eRes.data.data || []);
    } catch (err) { console.error("Error al cargar datos"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (editingEquipo) await updateEquipo(editingEquipo.id_equipo, data);
      else await createEquipo(data);
      setShowForm(false);
      setEditingEquipo(null);
      window.history.replaceState({}, document.title);
      await loadData();
    } catch { alert('Error al guardar'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que desea eliminar este equipo?')) return;
    await deleteEquipo(id);
    await loadData();
  };

  // COLUMNAS: Ahora el ID del cliente es visible junto al nombre
  const columnas = [
    { header: 'ID', accessor: 'id_equipo' },
    { 
      header: 'Cliente', 
      accessor: 'cliente', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{row.cliente?.nombre || 'N/A'}</span>
          <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase tracking-tighter">
            ID Cliente: {row.cliente?.id_cliente || 'N/A'}
          </span>
        </div>
      )
    },
    { header: 'Tipo', accessor: 'tipo' },
    { header: 'Marca', accessor: 'marca' },
    { header: 'Modelo', accessor: 'modelo' },
    { header: 'No. Serie', accessor: 'numero_serie' },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => { setEditingEquipo(row); setShowForm(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(row.id_equipo)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const filteredEquipos = equipos.filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      (e.modelo?.toLowerCase().includes(term)) || 
      (e.marca?.toLowerCase().includes(term)) ||
      (e.cliente?.nombre?.toLowerCase().includes(term)) ||
      (e.numero_serie?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 italic">Equipos</h2>
        <p className="text-sm text-gray-500">Listado general de dispositivos recibidos.</p>
      </div>

      {showForm && (
        <div className="mb-8 bg-white rounded-xl shadow-md p-6 border border-indigo-100 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
             <User className="w-5 h-5 text-indigo-600" />
             {editingEquipo ? 'Editar Equipo' : 'Registro de Nuevo Equipo'}
          </h3>
          <EquipoForm 
            onSubmit={handleSubmit} 
            onCancel={() => { setShowForm(false); setEditingEquipo(null); }} 
            initialData={editingEquipo} 
            clientes={clientes}
            preSelectedClient={preSelectedClient}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por modelo de equipo..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>
        <button 
          onClick={() => { setEditingEquipo(null); setShowForm(true); }} 
          className="flex items-center justify-center gap-2 px-5 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Nuevo Equipo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && !equipos.length ? (
          <div className="p-10 text-center text-gray-500 italic">Consultando servidor...</div>
        ) : (
          <Table columns={columnas} data={filteredEquipos} />
        )}
      </div>
    </div>
  );
};

export default Equipos;