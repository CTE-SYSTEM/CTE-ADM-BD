// frontend/src/pages/Secretaria/Diagnostico.jsx
import React, { useEffect, useState } from 'react';
import { 
  Loader2, Phone, User, Monitor, AlertCircle, 
  CheckCircle2, Search, Edit3, XCircle, LayoutList 
} from 'lucide-react';
import { getClientes } from '../../services/secretaria/clientesService';
import { getEquipos } from '../../services/secretaria/equiposService';
import { 
  createDiagnostico, 
  getDiagnosticos, 
  updateDiagnostico 
} from '../../services/secretaria/diagnosticoService';

// --- COMPONENTES DE APOYO ---

export const PrioridadBadge = ({ prioridad }) => {
  const config = {
    Urgente: 'bg-red-100 text-red-800 border-red-200',
    Alta: 'bg-orange-100 text-orange-800 border-orange-200',
    Normal: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${config[prioridad] || 'bg-gray-100 text-gray-800'}`}>
      {prioridad}
    </span>
  );
};

export const EstadoBadge = ({ estado }) => {
  const config = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    REPARACION: 'bg-purple-100 text-purple-800',
    FINALIZADO: 'bg-emerald-100 text-emerald-800',
    INGRESADO: 'bg-blue-100 text-blue-800',
    ENTREGADO: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[estado] || 'bg-gray-100 text-gray-800'}`}>
      {estado || 'PENDIENTE'}
    </span>
  );
};

// --- COMPONENTE PRINCIPAL ---

const Diagnostico = () => {
  // Estados de datos
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [diagnosticos, setDiagnosticos] = useState([]);
  
  // Estados de UI/Control
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const initialFormState = {
    cliente_id: '',
    equipo_id: '',
    falla_reportada: '',
    prioridad: 'Normal',
    estado: 'INGRESADO',
    tipo_equipo: '',
    deja_cargador: false,
    enciende: false,
    usa_corriente_ac: false,
  };

  const [formData, setFormData] = useState(initialFormState);

  const sugerenciasTipo = ["Laptop", "Celular", "Impresora", "Monitor", "Tablet", "PC Escritorio", "Consola"];

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resC, resE, resD] = await Promise.all([
        getClientes(),
        getEquipos(),
        getDiagnosticos()
      ]);
      setClientes(resC.data.data || []);
      setEquipos(resE.data.data || []);
      setDiagnosticos(resD.data.data || []);
    } catch (err) {
      setError('Error al sincronizar datos con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Manejadores
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'cliente_id' ? { equipo_id: '' } : {}),
    }));
  };

  const handleEdit = (diag) => {
    setIsEditing(true);
    setCurrentId(diag.id_diagnostico);
    setFormData({
      cliente_id: String(diag.cliente_id || ''),
      equipo_id: String(diag.equipo_id || ''),
      falla_reportada: diag.falla_reportada || '',
      prioridad: diag.prioridad || 'Normal',
      estado: diag.estado || 'INGRESADO',
      tipo_equipo: diag.tipo_equipo || '',
      deja_cargador: Boolean(diag.deja_cargador),
      enciende: Boolean(diag.enciende),
      usa_corriente_ac: Boolean(diag.usa_corriente_ac),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEditing) {
        await updateDiagnostico(currentId, formData);
        setMessage('Diagnóstico actualizado correctamente');
      } else {
        await createDiagnostico(formData);
        setMessage('Diagnóstico de ingreso generado con éxito');
      }
      
      cancelEdit();
      loadData();
    } catch (err) {
      setError('Ocurrió un error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de tabla
  const filteredDiagnosticos = diagnosticos.filter(d => 
    d.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.equipo?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(d.id_diagnostico).includes(searchTerm)
  );

  const clienteSeleccionado = clientes.find(c => String(c.id_cliente) === String(formData.cliente_id));
  const equiposDelCliente = formData.cliente_id
    ? equipos.filter((e) => Number(e.cliente_id) === Number(formData.cliente_id))
    : [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      {/* CABECERA */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Diagnóstico de Ingreso</h2>
          <p className="text-gray-500 font-medium">Gestión de recepción y revisión técnica inicial.</p>
        </div>
        <LayoutList className="w-8 h-8 text-indigo-200" />
      </div>

      {/* ALERTAS */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 font-medium border border-red-200">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}
      
      {message && (
        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" /> {message}
        </div>
      )}

      {/* SECCIÓN FORMULARIO */}
      <section className="bg-white rounded-xl shadow-md border border-indigo-50 p-6">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
            {isEditing ? <><Edit3 className="w-5 h-5"/> Editando Registro #{currentId}</> : '📝 Datos del Ingreso'}
           </h3>
           {isEditing && (
             <button onClick={cancelEdit} className="text-red-500 flex items-center gap-1 text-sm font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">
               <XCircle className="w-4 h-4"/> Cancelar
             </button>
           )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Cliente (Dueño)" name="cliente_id" value={formData.cliente_id} onChange={handleChange} required>
              <option value="">Seleccione el cliente</option>
              {clientes.map((c) => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
            </Select>

            {clienteSeleccionado ? (
              <div className="animate-in fade-in zoom-in duration-200">
                <label className="block text-sm font-bold text-indigo-600 mb-1">Contacto del Dueño</label>
                <div className="flex items-center justify-between w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm h-[42px]">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold">
                    <Phone className="w-4 h-4" />
                    <span>{clienteSeleccionado.telefono || 'Sin teléfono'}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-200 px-2 py-0.5 rounded text-indigo-900">ID: {clienteSeleccionado.id_cliente}</span>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center text-gray-400 text-xs italic pt-6">
                <User className="w-4 h-4 mr-1" /> Seleccione un cliente para validar datos
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Equipo Registrado" name="equipo_id" value={formData.equipo_id} onChange={handleChange} required disabled={!formData.cliente_id}>
              <option value="">Seleccione el equipo</option>
              {equiposDelCliente.map((e) => (
                <option key={e.id_equipo} value={e.id_equipo}>
                  {e.marca} {e.modelo} ({e.numero_serie})
                </option>
              ))}
            </Select>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Electrónico</label>
              <div className="flex gap-2">
                <select 
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-400"
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo_equipo: e.target.value }))}
                  value=""
                >
                  <option value="">Sugerencias</option>
                  {sugerenciasTipo.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input 
                  name="tipo_equipo"
                  value={formData.tipo_equipo}
                  onChange={handleChange}
                  placeholder="Escriba el tipo..."
                  className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Prioridad de Atención" name="prioridad" value={formData.prioridad} onChange={handleChange}>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </Select>
            
            <div className="flex flex-col justify-end">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Check name="deja_cargador" checked={formData.deja_cargador} onChange={handleChange} label="Cargador" />
                <Check name="enciende" checked={formData.enciende} onChange={handleChange} label="Enciende" />
                <Check name="usa_corriente_ac" checked={formData.usa_corriente_ac} onChange={handleChange} label="Corriente AC" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 italic">Falla reportada por el cliente</label>
            <textarea 
              name="falla_reportada" 
              value={formData.falla_reportada} 
              onChange={handleChange} 
              required 
              rows={3} 
              placeholder="Ej: No da imagen, se apaga a los 5 minutos..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" 
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={loading} 
              className={`flex items-center gap-2 px-8 py-3 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Monitor className="w-5 h-5" />}
              {isEditing ? 'Guardar Cambios' : 'Generar Diagnóstico de Ingreso'}
            </button>
          </div>
        </form>
      </section>

      {/* SECCIÓN TABLA DE REVISIÓN */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-700">Registros Recientes</h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar por ID, cliente o modelo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-bold">ID</th>
                  <th className="px-4 py-3 font-bold">Cliente</th>
                  <th className="px-4 py-3 font-bold">Equipo</th>
                  <th className="px-4 py-3 font-bold">Falla</th>
                  <th className="px-4 py-3 font-bold text-center">Prioridad</th>
                  <th className="px-4 py-3 font-bold text-center">Estado</th>
                  <th className="px-4 py-3 font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDiagnosticos.length > 0 ? (
                  filteredDiagnosticos.map((d) => (
                    <tr key={d.id_diagnostico} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">#{d.id_diagnostico}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{d.cliente?.nombre}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-700">{d.equipo?.modelo}</span>
                          <span className="text-[10px] uppercase text-gray-400">{d.equipo?.marca}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">{d.falla_reportada}</td>
                      <td className="px-4 py-3 text-center"><PrioridadBadge prioridad={d.prioridad} /></td>
                      <td className="px-4 py-3 text-center"><EstadoBadge estado={d.estado} /></td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleEdit(d)} 
                          className="p-2 text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-indigo-200 transition-all shadow-sm hover:shadow"
                          title="Editar Registro"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-gray-400 italic bg-gray-50/50">
                      {loading ? 'Cargando datos...' : 'No se encontraron diagnósticos registrados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- SUB-COMPONENTES DE UI ---

const Select = ({ label, children, ...props }) => (
  <div className="flex flex-col">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 transition-all outline-none">
      {children}
    </select>
  </div>
);

const Check = ({ label, ...props }) => (
  <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-xs text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all shadow-sm">
    <input type="checkbox" {...props} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
    {label}
  </label>
);

export default Diagnostico;