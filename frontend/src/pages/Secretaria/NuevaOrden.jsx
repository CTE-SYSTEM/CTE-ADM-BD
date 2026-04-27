import React, { useState } from 'react';
import { Plus, Search, X, Loader2 } from 'lucide-react';

// Badge para estados de orden
export const EstadoBadge = ({ estado }) => {
  const getEstadoConfig = (est) => {
    const config = {
      'PENDIENTE': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'PENDIENTE_ASIGNACION': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente de Asignación' },
      'ASIGNADO': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Asignado' },
      'EN_REPARACION': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Reparación' },
      'APROBADO': { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado' },
      'RECHAZADO': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' },
      'COMPLETADO': { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Completado' },
      'ENTREGADO': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Entregado' },
    };
    return config[est] || { bg: 'bg-gray-100', text: 'text-gray-800', label: est };
  };

  const { bg, text, label } = getEstadoConfig(estado);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// Badge para prioridad
export const PrioridadBadge = ({ prioridad }) => {
  const getPrioridadConfig = (pri) => {
    const config = {
      'BAJA': { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Baja' },
      'MEDIA': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Media' },
      'ALTA': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Alta' },
      'URGENTE': { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgente' },
    };
    return config[pri] || { bg: 'bg-gray-100', text: 'text-gray-600', label: pri };
  };

  const { bg, text, label } = getPrioridadConfig(prioridad);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  );
};

// Componente de búsqueda de cliente
const ClienteSearch = ({ clientes, onSelect, selectedCliente }) => {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredClientes = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.cedula?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Cliente *
      </label>
      {selectedCliente ? (
        <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex-1">
            <div className="font-medium text-gray-800">{selectedCliente.nombre}</div>
            <div className="text-sm text-gray-500">{selectedCliente.cedula}</div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre o cédula..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {showDropdown && search && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredClientes.length > 0 ? (
                filteredClientes.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => {
                      onSelect(cliente);
                      setSearch('');
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-800">{cliente.nombre}</div>
                    <div className="text-sm text-gray-500">{cliente.cedula} • {cliente.telefono}</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No se encontraron clientes
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Formulario de Nueva Orden de Servicio
const NuevaOrdenForm = ({ onSubmit, onCancel, clientes = [], equipos = [], loading }) => {
  const [formData, setFormData] = useState({
    clienteId: '',
    equipoId: '',
    fallaReportada: '',
    prioridad: 'MEDIA',
  });
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleClienteSelect = (cliente) => {
    setSelectedCliente(cliente);
    setFormData((prev) => ({ ...prev, clienteId: cliente?.id || '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.clienteId) newErrors.clienteId = 'Seleccione un cliente';
    if (!formData.equipoId) newErrors.equipoId = 'Seleccione un equipo';
    if (!formData.fallaReportada.trim()) newErrors.fallaReportada = 'Describa la falla reportada';
    if (formData.fallaReportada.length < 10) newErrors.fallaReportada = 'Descripción muy corta';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const ordenData = {
      ...formData,
      cliente: selectedCliente,
      estado: 'PENDIENTE_ASIGNACION',
      fechaIngreso: new Date().toISOString().split('T')[0],
    };
    onSubmit(ordenData);
  };

  // Equipos del cliente seleccionado
  const equiposDelCliente = selectedCliente
    ? equipos.filter((e) => e.clienteId === selectedCliente.id)
    : equipos;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cliente */}
      <ClienteSearch
        clientes={clientes}
        onSelect={handleClienteSelect}
        selectedCliente={selectedCliente}
      />
      {errors.clienteId && <p className="text-sm text-red-500">{errors.clienteId}</p>}

      {/* Equipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Equipo *
        </label>
        {selectedCliente ? (
          equiposDelCliente.length > 0 ? (
            <select
              name="equipoId"
              value={formData.equipoId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Seleccione un equipo</option>
              {equiposDelCliente.map((equipo) => (
                <option key={equipo.id} value={equipo.id}>
                  {equipo.marca} {equipo.modelo} - {equipo.numeroSerie}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
              Este cliente no tiene equipos registrados.
            </p>
          )
        ) : (
          <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
            Seleccione un cliente para ver sus equipos.
          </p>
        )}
        {errors.equipoId && <p className="text-sm text-red-500">{errors.equipoId}</p>}
      </div>

      {/* Falla Reportada */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Falla Reportada por el Cliente *
        </label>
        <textarea
          name="fallaReportada"
          value={formData.fallaReportada}
          onChange={handleChange}
          rows={4}
          placeholder="Describa la falla o problema reportado por el cliente..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {errors.fallaReportada && <p className="text-sm text-red-500">{errors.fallaReportada}</p>}
      </div>

      {/* Prioridad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prioridad
        </label>
        <select
          name="prioridad"
          value={formData.prioridad}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="BAJA">Baja</option>
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </select>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Crear Orden de Servicio
        </button>
      </div>
    </form>
  );
};

// Componente principal de Nueva Orden
const NuevaOrden = ({ onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo - reemplazar con API
  const [clientes] = useState([
    { id: 1, nombre: 'Juan Pérez', cedula: '001-150195-0000S', telefono: '+505 8888-1111' },
    { id: 2, nombre: 'María García', cedula: '001-280295-0001S', telefono: '+505 8888-2222' },
    { id: 3, nombre: 'Carlos López', cedula: '001-120388-0002S', telefono: '+505 8888-3333' },
    { id: 4, nombre: 'Ana Martínez', cedula: '001-050495-0003S', telefono: '+505 8888-4444' },
  ]);

  const [equipos] = useState([
    { id: 1, clienteId: 1, marca: 'HP', modelo: 'Pavilion', numeroSerie: 'SN-001-2024' },
    { id: 2, clienteId: 2, marca: 'Dell', modelo: 'Inspiron', numeroSerie: 'SN-002-2024' },
    { id: 3, clienteId: 3, marca: 'Samsung', modelo: 'Galaxy Tab', numeroSerie: 'SN-003-2024' },
    { id: 4, clienteId: 1, marca: 'Lenovo', modelo: 'ThinkPad', numeroSerie: 'SN-004-2024' },
    { id: 5, clienteId: 4, marca: 'Apple', modelo: 'MacBook Pro', numeroSerie: 'SN-005-2024' },
  ]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      // Simulación de API - reemplazar con llamada real
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSubmit(data);
    } catch (error) {
      console.error('Error al crear orden:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Nueva Orden de Servicio
      </h3>
      <NuevaOrdenForm
        onSubmit={handleSubmit}
        onCancel={onCancel}
        clientes={clientes}
        equipos={equipos}
        loading={loading}
      />
    </div>
  );
};

export default NuevaOrden;
export { NuevaOrdenForm, ClienteSearch };