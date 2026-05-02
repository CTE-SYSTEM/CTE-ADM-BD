import React, { useEffect, useState } from 'react';
import { Loader2, Phone, User, Monitor, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getClientes } from '../../services/clientesService';
import { getEquipos } from '../../services/equiposService';
import { createDiagnostico } from '../../services/diagnosticoService';

// COMPONENTE PARA MOSTRAR LA PRIORIDAD
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

// COMPONENTE PARA MOSTRAR EL ESTADO
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

const Diagnostico = () => {
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [formData, setFormData] = useState({
    cliente_id: '',
    equipo_id: '',
    falla_reportada: '',
    prioridad: 'Normal',
    estado: 'INGRESADO',
    tipo_equipo: '',
    deja_cargador: false,
    enciende: false,
    usa_corriente_ac: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const sugerenciasTipo = ["Laptop", "Celular", "Impresora", "Monitor", "Tablet", "PC Escritorio", "Consola"];

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientesResponse, equiposResponse] = await Promise.all([getClientes(), getEquipos()]);
      setClientes(clientesResponse.data.data || []);
      setEquipos(equiposResponse.data.data || []);
    } catch {
      setError('No se pudieron cargar los datos necesarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // EFECTO PARA LIMPIAR EL MENSAJE AUTOMÁTICAMENTE
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000); // Desaparece en 5 segundos
      return () => clearTimeout(timer);
    }
  }, [message]);

  const clienteSeleccionado = clientes.find(c => String(c.id_cliente) === String(formData.cliente_id));

  const equiposDelCliente = formData.cliente_id
    ? equipos.filter((equipo) => Number(equipo.cliente_id) === Number(formData.cliente_id))
    : [];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'cliente_id' ? { equipo_id: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await createDiagnostico(formData);
      
      // Mensaje de éxito y scroll hacia arriba
      setMessage('Diagnóstico de ingreso generado correctamente');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Resetear el formulario
      setFormData({
        cliente_id: '', equipo_id: '', falla_reportada: '', prioridad: 'Normal',
        estado: 'INGRESADO', tipo_equipo: '', deja_cargador: false,
        enciende: false, usa_corriente_ac: false,
      });
    } catch {
      setError('Error al procesar el diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Diagnóstico de Ingreso</h2>
        <p className="text-gray-500 font-medium">Recepción técnica de equipos para revisión inicial.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}
      
      {message && (
        <div className="mb-4 p-3 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2 font-medium animate-pulse">
          <CheckCircle2 className="w-5 h-5" /> {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-indigo-50 p-6 space-y-6 max-w-5xl">
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
                className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm" 
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex items-center gap-2 px-8 py-3 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 font-bold shadow-indigo-200 shadow-lg transition-all active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Monitor className="w-5 h-5" />}
            Generar Diagnóstico de Ingreso
          </button>
        </div>
      </form>
    </div>
  );
};

const Select = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 transition-all">
      {children}
    </select>
  </div>
);

const Check = ({ label, ...props }) => (
  <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
    <input type="checkbox" {...props} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
    {label}
  </label>
);

export default Diagnostico;