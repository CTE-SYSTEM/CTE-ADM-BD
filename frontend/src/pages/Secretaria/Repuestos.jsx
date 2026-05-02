import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { 
  Plus, Search, Edit, Trash2, Tag, Info, 
  Loader2, AlertCircle, Cpu, Filter
} from 'lucide-react';
import { 
  createRepuesto, deleteRepuesto, getRepuestos, updateRepuesto 
} from '../../services/repuestosService';

const RepuestoForm = ({ onSubmit, onCancel, initialData = null, categorias = [] }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria_nombre: '',
    electronico: '',
    costo_individual: '',
    porcentaje_de_ganacia: '',
  });

  // CORRECCIÓN: Rellenar datos al editar y limpiar al crear
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        categoria_nombre: initialData.categoria?.nombre_tipo || '',
        electronico: initialData.categoria?.electronico || '',
        costo_individual: initialData.costo_individual || '',
        // Conversión decimal a entero para el usuario (0.05 -> 5)
        porcentaje_de_ganacia: initialData.porcentaje_de_ganacia 
          ? (Number(initialData.porcentaje_de_ganacia) * 100).toFixed(0) 
          : '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const electronicosSugeridos = [...new Set(categorias.map(c => c.electronico).filter(Boolean))];

  const handleSubmitInternal = (e) => {
    e.preventDefault();
    // CORRECCIÓN: Conversión a decimal antes de enviar al backend
    const dataToSend = {
      ...formData,
      porcentaje_de_ganacia: parseFloat(formData.porcentaje_de_ganacia || 0) / 100,
      costo_individual: parseFloat(formData.costo_individual || 0)
    };
    onSubmit(dataToSend);
  };

  return (
    <form onSubmit={handleSubmitInternal} className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECCIÓN CLASIFICACIÓN */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3" /> Clasificación del Componente
          </h4>
          
          {/* Categoría */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Categoría</label>
            <div className="flex gap-2">
              <select 
                className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                onChange={(e) => {
                  const val = e.target.value;
                  if(!val) return;
                  const cat = categorias.find(c => c.nombre_tipo === val);
                  setFormData(prev => ({ ...prev, categoria_nombre: val, electronico: cat?.electronico || prev.electronico }));
                }}
                value={categorias.some(c => c.nombre_tipo === formData.categoria_nombre) ? formData.categoria_nombre : ""}
              >
                <option value="">Sugerencias</option>
                {categorias.map(c => <option key={c.id_tipo_repuesto} value={c.nombre_tipo}>{c.nombre_tipo}</option>)}
              </select>
              <input 
                name="categoria_nombre"
                value={formData.categoria_nombre}
                onChange={handleChange}
                placeholder="Nombre"
                className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Tipo de Electrónico - CORREGIDO PARA EVITAR EL "SI" */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo de Electrónico</label>
            <div className="flex gap-2">
              <select 
                className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                onChange={(e) => setFormData(prev => ({ ...prev, electronico: e.target.value }))}
                value={electronicosSugeridos.includes(formData.electronico) ? formData.electronico : ""}
              >
                <option value="">Sugeridos</option>
                {electronicosSugeridos.map((elec, idx) => <option key={idx} value={elec}>{elec}</option>)}
              </select>
              <input 
                name="electronico"
                value={formData.electronico}
                onChange={handleChange}
                placeholder="Ej: Laptop, Celular"
                className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN DATOS TÉCNICOS */}
        <div className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="block text-sm font-bold text-gray-700">Nombre del Repuesto</label>
            <input name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Costo (C$)</label>
              <input name="costo_individual" value={formData.costo_individual} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Ganancia (%)</label>
              <input name="porcentaje_de_ganacia" value={formData.porcentaje_de_ganacia} onChange={handleChange} placeholder="Ej: 20" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 text-left">
          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
            <Info className="w-4 h-4 text-indigo-500" /> Descripción Técnica
          </label>
          <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg">Cancelar</button>
        <button type="submit" className="px-6 py-2 text-white bg-indigo-600 font-bold rounded-lg shadow-lg active:scale-95 transition-all">
          {initialData ? 'Actualizar Repuesto' : 'Guardar Repuesto'}
        </button>
      </div>
    </form>
  );
};

const Repuestos = () => {
  const [repuestos, setRepuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterNombre, setFilterNombre] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getRepuestos();
      const data = response.data.data || [];
      setRepuestos(data);
      const catsUnicas = data.reduce((acc, current) => {
        if (current.categoria && !acc.find(c => c.id_tipo_repuesto === current.categoria.id_tipo_repuesto)) {
          acc.push(current.categoria);
        }
        return acc;
      }, []);
      setCategorias(catsUnicas);
    } catch (err) { setError('Error al cargar datos'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (editingRepuesto) {
        await updateRepuesto(editingRepuesto.id_repuesto, data);
      } else {
        await createRepuesto(data);
      }
      setShowForm(false);
      setEditingRepuesto(null);
      await loadData();
    } catch (err) { setError('Error al procesar solicitud'); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este repuesto?')) return;
    try {
      await deleteRepuesto(id);
      await loadData();
    } catch (err) { setError('Error al eliminar'); }
  };

  const filteredRepuestos = repuestos.filter(r => {
    const matchNombre = r.nombre?.toLowerCase().includes(filterNombre.toLowerCase());
    const matchCat = r.categoria?.nombre_tipo?.toLowerCase().includes(filterCategoria.toLowerCase());
    return matchNombre && matchCat;
  });

  const columnas = [
    { header: 'Info Repuesto', render: (row) => (
      <div className="flex items-center gap-3 text-left">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Cpu className="w-5 h-5" /></div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 leading-tight">{row.nombre}</span>
          <span className="text-[11px] text-gray-400 italic">{row.descripcion || 'Sin detalles'}</span>
        </div>
      </div>
    )},
    { header: 'Categoría', render: (row) => (
      <div className="flex flex-col text-left">
        <span className="text-sm font-semibold text-gray-700">{row.categoria?.nombre_tipo}</span>
        <span className="text-[10px] text-indigo-500 font-bold uppercase">{row.categoria?.electronico}</span>
      </div>
    )},
    { header: 'Costo', render: (row) => <span className="font-mono text-gray-600">C$ {Number(row.costo_individual || 0).toFixed(2)}</span> },
    { header: 'Ganancia', render: (row) => (
      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-black">
        {(Number(row.porcentaje_de_ganacia) * 100).toFixed(0)}%
      </span>
    )},
    { header: 'Acciones', render: (row) => (
      <div className="flex gap-1">
        <button onClick={() => { setEditingRepuesto(row); setShowForm(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(row.id_repuesto)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div className="text-left">
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Inventario de Repuestos</h2>
          <p className="text-gray-500 font-medium italic text-sm">Gestión de componentes y stock para CTE</p>
        </div>
        <button 
          onClick={() => { setEditingRepuesto(null); setShowForm(true); }} 
          className="flex items-center gap-2 px-6 py-3 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xl font-bold transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Agregar Repuesto
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2 rounded"><AlertCircle className="w-5 h-5" /> {error}</div>}

      {showForm && (
        <div className="mb-8 bg-white rounded-2xl shadow-xl border border-indigo-100 p-8 animate-in fade-in zoom-in duration-200">
           <RepuestoForm categorias={categorias} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingRepuesto(null); }} initialData={editingRepuesto} />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-gray-500 mr-2"><Filter className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider">Filtros:</span></div>
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Buscar por Nombre..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" value={filterNombre} onChange={(e) => setFilterNombre(e.target.value)} />
            </div>
            <div className="relative flex-1 min-w-[200px]">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Filtrar por Categoría..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} />
            </div>
        </div>
        {loading ? <div className="p-12 flex justify-center items-center gap-3 text-indigo-600"><Loader2 className="w-6 h-6 animate-spin" /><span className="font-bold">Sincronizando...</span></div> : <Table columns={columnas} data={filteredRepuestos} />}
      </div>
    </div>
  );
};

export default Repuestos;