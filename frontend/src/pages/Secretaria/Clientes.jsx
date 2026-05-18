// frontend/src/pages/Secretaria/Clientes.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importado para la redirección
import Table from '../../components/Table';
import { Plus, Search, Edit, ArrowRight, HelpCircle, X } from 'lucide-react';
import { createCliente, getClientes, updateCliente } from '../../services/secretaria/clientesService';

const emptyCliente = {
  nombre: '',
  telefono: '',
  direccion: '',
  correo: '',
  contacto_secundario: '',
};

const formatPhone = (value = '') => {
  const rawDigits = String(value).replace(/\D/g, '');
  const digits = rawDigits.length > 8 ? rawDigits.slice(-8) : rawDigits;
  return digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : digits;
};

const normalizePhone = (value = '') => {
  const digits = String(value).replace(/\D/g, '');
  return digits.length > 8 ? digits.slice(-8) : digits;
};

const sanitizeInternationalPhone = (value = '') => String(value).replace(/[^\d+\-()./\s]/g, '');

const normalizeClientePayload = (data = emptyCliente) => ({
  ...emptyCliente,
  ...data,
  nombre: data.nombre,
  telefono: normalizePhone(data.telefono),
  contacto_secundario: data.contacto_secundario,
});

const tourSteps = [
  {
    target: 'create',
    title: '1. Crear un cliente',
    text: 'Usa Nuevo Cliente para abrir el formulario. Desde aqui la secretaria registra a la persona antes de asociarle equipos u ordenes.',
  },
  {
    target: 'entries',
    title: '2. Datos del cliente',
    text: 'Registra nombre, telefono y contacto secundario. El contacto secundario acepta formatos internacionales sin letras y conserva el formato escrito.',
  },
  {
    target: 'actions',
    title: '3. Guardar o continuar',
    text: 'Solo Guardar registra al cliente y deja el formulario limpio para capturar otro. Guardar y Continuar registra al cliente y abre Equipos para anotar el aparato que trae.',
  },
  {
    target: 'search',
    title: '4. Buscar rapido',
    text: 'Este buscador filtra la tabla en tiempo real por nombre o telefono. Es util cuando la lista de clientes crece mucho.',
  },
  {
    target: 'table',
    title: '5. Revisar, editar o cancelar',
    text: 'La tabla muestra los clientes registrados. Al tocar editar se abre el formulario con los datos del cliente y el boton cambia a Actualizar. Cancelar descarta la edicion y evita guardar cambios por error.',
  },
];

const tourHighlightClass = (isActive) =>
  isActive
    ? 'relative z-[60] rounded-xl bg-white ring-4 ring-indigo-400 ring-offset-4 ring-offset-white shadow-2xl transition-all'
    : '';

// Componente de Formulario actualizado
const ClienteForm = ({ onSubmit, onCancel, initialData = null, activeTourTarget = '' }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    telefono: formatPhone(initialData?.telefono || ''),
    direccion: initialData?.direccion || '',
    correo: initialData?.correo || '',
    contacto_secundario: initialData?.contacto_secundario || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === 'telefono') {
      nextValue = formatPhone(value);
    }

    if (name === 'contacto_secundario') {
      nextValue = sanitizeInternationalPhone(value);
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  return (
    <form className="space-y-4">
      <div
        data-tour-target="entries"
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${tourHighlightClass(activeTourTarget === 'entries')}`}
      >
        <Field label="Nombre Completo" name="nombre" value={formData.nombre} onChange={handleChange} required />
        <Field label="Telefono" name="telefono" value={formData.telefono} onChange={handleChange} inputMode="numeric" maxLength={9} />
        <Field label="Correo" name="correo" type="email" value={formData.correo} onChange={handleChange} />
        <Field label="Contacto secundario" name="contacto_secundario" value={formData.contacto_secundario} onChange={handleChange} inputMode="tel" placeholder="+1-212-555-0198" />
        <Field label="Direccion" name="direccion" value={formData.direccion} onChange={handleChange} className="md:col-span-2" />
      </div>
      
      {/* Pasamos formData a las acciones para manejar los diferentes tipos de submit */}
      <FormActions 
        onCancel={onCancel} 
        isEditing={Boolean(initialData)} 
        activeTourTarget={activeTourTarget}
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
const FormActions = ({ onCancel, isEditing, activeTourTarget, onSave, onNext }) => (
  <div
    data-tour-target="actions"
    className={`flex flex-wrap justify-end gap-3 pt-4 ${tourHighlightClass(activeTourTarget === 'actions')}`}
  >
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

const GuidedTour = ({ stepIndex, onBack, onClose, onNext }) => {
  const step = tourSteps[stepIndex];
  const isLast = stepIndex === tourSteps.length - 1;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-gray-900/55" />
      <div className="fixed bottom-6 right-6 z-[70] w-[min(92vw,380px)] rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Paso {stepIndex + 1} de {tourSteps.length}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{step.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title="Cerrar tutorial"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm leading-6 text-gray-600">{step.text}</p>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${((stepIndex + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={stepIndex === 0}
            className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Atras
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            {isLast ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  );
};

const Clientes = () => {
  const navigate = useNavigate(); // Inicializar el hook de navegación
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [formKey, setFormKey] = useState(0);
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

  const activeTourTarget = showHelp ? tourSteps[tourStep].target : '';

  useEffect(() => {
    if (!showHelp || !activeTourTarget) return;

    const scrollTimer = window.setTimeout(() => {
      document
        .querySelector(`[data-tour-target="${activeTourTarget}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [activeTourTarget, showHelp]);

  const startTour = () => {
    setEditingCliente(null);
    setShowForm(true);
    setTourStep(0);
    setShowHelp(true);
  };

  const closeTour = () => {
    setShowHelp(false);
    setTourStep(0);
  };

  const goToNextTourStep = () => {
    if (tourStep === tourSteps.length - 1) {
      closeTour();
      return;
    }

    setTourStep((step) => step + 1);
  };

  const goToPreviousTourStep = () => {
    setTourStep((step) => Math.max(step - 1, 0));
  };

  const columnas = [
    { header: 'ID', accessor: 'id_cliente', contentClassName: 'whitespace-nowrap leading-relaxed' },
    { header: 'Nombre', accessor: 'nombre', contentClassName: 'whitespace-nowrap leading-relaxed' },
    { header: 'Telefono', accessor: 'telefono', contentClassName: 'whitespace-nowrap leading-relaxed', render: (row) => formatPhone(row.telefono) || '-' },
    { header: 'Correo', accessor: 'correo' },
    { header: 'Contacto secundario', accessor: 'contacto_secundario', contentClassName: 'whitespace-nowrap leading-relaxed', render: (row) => row.contacto_secundario || '-' },
    { header: 'Direccion', accessor: 'direccion', contentClassName: 'max-w-[360px] whitespace-normal break-words leading-relaxed' },
    {
      header: 'Acciones',
      accessor: 'acciones',
      contentClassName: 'whitespace-nowrap leading-relaxed',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => { setEditingCliente(row); setShowForm(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredClientes = clientes.filter((cliente) => {
    const term = searchTerm.trim().toLowerCase();
    const phoneTerm = normalizePhone(term);
    const telefono = normalizePhone(cliente.telefono);
    const contactoSecundario = normalizePhone(cliente.contacto_secundario);

    return (
      String(cliente.nombre || '').toLowerCase().includes(term) ||
      String(cliente.contacto_secundario || '').toLowerCase().includes(term) ||
      (phoneTerm && (telefono.includes(phoneTerm) || contactoSecundario.includes(phoneTerm)))
    );
  });

  // handleSubmit actualizado para manejar la redirección
  const handleSubmit = async (data, action) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      const payload = normalizeClientePayload(data);
      if (editingCliente) {
        response = await updateCliente(editingCliente.id_cliente, payload);
      } else {
        response = await createCliente(payload);
      }

      // Si la acción es 'next', vamos a la pantalla de equipos enviando el ID del cliente
      if (action === 'next' && response?.data?.data?.id_cliente) {
        const idNuevo = response.data.data.id_cliente;
        navigate('/secretaria/equipos', { state: { clienteId: idNuevo, nombreCliente: payload.nombre } });
      } else if (action === 'save' && !editingCliente) {
        setShowForm(true);
        setEditingCliente(null);
        setFormKey((key) => key + 1);
        await loadClientes();
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showHelp && (
        <GuidedTour
          stepIndex={tourStep}
          onBack={goToPreviousTourStep}
          onClose={closeTour}
          onNext={goToNextTourStep}
        />
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Gestion de Clientes</h2>
          <p className="text-gray-500">Campos reales: nombre, telefono, direccion, correo y contacto secundario.</p>
        </div>

        <div
          data-tour-target="create"
          className={`flex flex-wrap gap-3 ${tourHighlightClass(activeTourTarget === 'create')}`}
        >
          <button
            type="button"
            onClick={startTour}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50"
            title="Iniciar tutorial guiado"
          >
            <HelpCircle className="w-4 h-4" /> Ayuda
          </button>
          <button onClick={() => { setEditingCliente(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          <ClienteForm
            key={formKey}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingCliente(null); }}
            initialData={editingCliente}
            activeTourTarget={activeTourTarget}
          />
        </div>
      )}

      <div
        data-tour-target="search"
        className={`mb-6 ${tourHighlightClass(activeTourTarget === 'search')}`}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o telefono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div
        data-tour-target="table"
        className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${tourHighlightClass(activeTourTarget === 'table')}`}
      >
        {loading ? <div className="p-8 text-center text-gray-500">Cargando...</div> : <Table columns={columnas} data={filteredClientes} />}
      </div>
    </div>
  );
};

export default Clientes;
