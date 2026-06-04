import { ChevronDown, ChevronUp, Edit3, Loader2, Monitor, Phone, User, XCircle } from 'lucide-react';
import Autocomplete from '../../Autocomplete';
import { tourHighlightClass } from './constants';

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

const SectionHeader = ({ currentId, isEditing, isFormOpen, onCancelEdit, onToggle }) => (
  <div className="flex items-center justify-between cursor-pointer group select-none" onClick={onToggle}>
    <div className="flex items-center gap-4">
      <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
        {isEditing ? (
          <>
            <Edit3 className="w-5 h-5" /> Editando Registro #{currentId}
          </>
        ) : (
          'Datos del Ingreso'
        )}
      </h3>
      {isEditing && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCancelEdit();
          }}
          className="text-red-500 flex items-center gap-1 text-sm font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors"
        >
          <XCircle className="w-4 h-4" /> Cancelar
        </button>
      )}
    </div>
    <div className="p-1 rounded-full text-indigo-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
      {isFormOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
    </div>
  </div>
);

export const DiagnosticoForm = ({
  activeTourTarget,
  clienteSeleccionado,
  currentId,
  equipoSeleccionado,
  equiposDelCliente,
  formData,
  formRef,
  isEditing,
  isFormOpen,
  loading,
  onCancelEdit,
  onChange,
  onSubmit,
  onToggle,
  clientes,
}) => (
  <section ref={formRef} className="bg-white rounded-xl shadow-md border border-indigo-50 p-6 scroll-mt-6 transition-all duration-300">
    <SectionHeader
      currentId={currentId}
      isEditing={isEditing}
      isFormOpen={isFormOpen}
      onCancelEdit={onCancelEdit}
      onToggle={onToggle}
    />

    {isFormOpen && (
      <form onSubmit={onSubmit} className="space-y-6 mt-6 animate-in slide-in-from-top-2 fade-in duration-200">
        <div data-tour-target="owner" className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${tourHighlightClass(activeTourTarget === 'owner')}`}>
          <Autocomplete
            label="Cliente (Dueno)"
            name="cliente_id"
            value={formData.cliente_id}
            onChange={onChange}
            options={clientes}
            getOptionValue={(cliente) => cliente.id_cliente}
            getOptionLabel={(cliente) => cliente.nombre || `Cliente #${cliente.id_cliente}`}
            getOptionDescription={(cliente) => `ID: ${cliente.id_cliente}${cliente.telefono ? ` | ${cliente.telefono}` : ''}`}
            placeholder="Buscar cliente por nombre, ID o telefono..."
            emptyMessage="No hay clientes con ese criterio"
            required
          />

          {clienteSeleccionado ? (
            <div className="animate-in fade-in zoom-in duration-200">
              <label className="block text-sm font-bold text-indigo-600 mb-1">Contacto del Dueno</label>
              <div className="flex items-center justify-between w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm h-[42px]">
                <div className="flex items-center gap-2 text-indigo-700 font-bold">
                  <Phone className="w-4 h-4" />
                  <span>{clienteSeleccionado.telefono || 'Sin telefono'}</span>
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

        <div data-tour-target="equipment" className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${tourHighlightClass(activeTourTarget === 'equipment')}`}>
          <Autocomplete
            label="Equipo Registrado"
            name="equipo_id"
            value={formData.equipo_id}
            onChange={onChange}
            options={equiposDelCliente}
            getOptionValue={(equipo) => equipo.id_equipo}
            getOptionLabel={(equipo) => [equipo.marca, equipo.modelo].filter(Boolean).join(' ') || `Equipo #${equipo.id_equipo}`}
            getOptionDescription={(equipo) => [equipo.tipo, equipo.numero_serie ? `S/N: ${equipo.numero_serie}` : '', `ID: ${equipo.id_equipo}`].filter(Boolean).join(' | ')}
            placeholder={formData.cliente_id ? 'Buscar equipo por marca, modelo, tipo o serie...' : 'Seleccione un cliente primero'}
            emptyMessage="No hay equipos para ese criterio"
            disabled={!formData.cliente_id}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Electronico</label>
            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-semibold min-h-[42px]">
              {equipoSeleccionado?.tipo || 'Seleccione un equipo para ver el tipo'}
            </div>
            <p className="mt-1 text-xs text-gray-400">Este valor viene del equipo registrado.</p>
          </div>
        </div>

        <div data-tour-target="priority" className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${tourHighlightClass(activeTourTarget === 'priority')}`}>
          <Select label="Prioridad de Atencion" name="prioridad" value={formData.prioridad} onChange={onChange}>
            <option value="Normal">Normal</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
          </Select>

          <div className="flex flex-col justify-end">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Check name="deja_cargador" checked={formData.deja_cargador} onChange={onChange} label="Cargador" />
              <Check name="enciende" checked={formData.enciende} onChange={onChange} label="Enciende" />
              <Check name="usa_corriente_ac" checked={formData.usa_corriente_ac} onChange={onChange} label="Corriente AC" />
            </div>
          </div>
        </div>

        <div data-tour-target="failure" className={tourHighlightClass(activeTourTarget === 'failure')}>
          <label className="block text-sm font-medium text-gray-700 mb-1 italic">Falla reportada por el cliente</label>
          <textarea
            name="falla_reportada"
            value={formData.falla_reportada}
            onChange={onChange}
            required
            rows={3}
            placeholder="Ej: No da imagen, se apaga a los 5 minutos..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none"
          />
        </div>

        <div data-tour-target="actions" className={`flex justify-end pt-4 border-t border-gray-100 ${tourHighlightClass(activeTourTarget === 'actions')}`}>
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 px-8 py-3 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Monitor className="w-5 h-5" />}
            {isEditing ? 'Guardar Cambios' : 'Generar Diagnostico de Ingreso'}
          </button>
        </div>
      </form>
    )}
  </section>
);
