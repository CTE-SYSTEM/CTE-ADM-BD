import { X } from 'lucide-react';

export const initialFormState = {
  cliente_id: '',
  equipo_id: '',
  falla_reportada: '',
  prioridad: 'Normal',
  estado: 'INGRESADO',
  deja_cargador: false,
  enciende: false,
  usa_corriente_ac: false,
};

export const tourSteps = [
  {
    target: 'header',
    title: '1. Diagnostico de ingreso',
    text: 'Esta pantalla registra la revision inicial del equipo que trae el cliente. Si vienes desde Equipos, cliente y equipo ya quedan seleccionados.',
  },
  {
    target: 'owner',
    title: '2. Cliente y contacto',
    text: 'Selecciona el cliente y confirma telefono e ID. Esto evita generar un diagnostico para la persona equivocada.',
  },
  {
    target: 'equipment',
    title: '3. Equipo correcto',
    text: 'El selector muestra solo los equipos del cliente elegido. Al seleccionar uno, el tipo se muestra automaticamente como verificacion.',
  },
  {
    target: 'priority',
    title: '4. Prioridad y accesorios',
    text: 'Marca la prioridad de atencion y los datos de recepcion: cargador, si enciende y si usa corriente AC.',
  },
  {
    target: 'failure',
    title: '5. Falla reportada',
    text: 'Este campo es obligatorio. Si intentas guardar sin escribir la falla, el sistema muestra una alerta y bloquea el guardado.',
  },
  {
    target: 'actions',
    title: '6. Guardar diagnostico',
    text: 'Generar Diagnostico de Ingreso crea el registro. En modo edicion, el boton guarda cambios y Cancelar descarta la edicion.',
  },
  {
    target: 'table',
    title: '7. Revisar registros',
    text: 'La tabla tiene scroll interno y encabezado fijo para trabajar mejor con muchas filas o pantallas pequenas.',
  },
  {
    target: 'table',
    title: '8. Editar diagnosticos',
    text: 'Usa el boton de lapiz en una fila para cargar ese diagnostico en el formulario superior. Si ya tiene tecnico asignado, no podra editarse.',
  },
];

export const tourHighlightClass = (isActive) =>
  isActive
    ? 'relative z-[60] rounded-xl bg-white ring-4 ring-indigo-400 ring-offset-4 ring-offset-white shadow-2xl transition-all'
    : '';

export const GuidedTour = ({ stepIndex, onBack, onClose, onNext }) => {
  const step = tourSteps[stepIndex];
  const isLast = stepIndex === tourSteps.length - 1;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-gray-900/55" />
      <div className="fixed bottom-6 right-6 z-[70] w-[min(92vw,390px)] rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Paso {stepIndex + 1} de {tourSteps.length}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{step.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700" title="Cerrar tutorial">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm leading-6 text-gray-600">{step.text}</p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((stepIndex + 1) / tourSteps.length) * 100}%` }} />
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} disabled={stepIndex === 0} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
            Atras
          </button>
          <button type="button" onClick={onNext} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            {isLast ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  );
};
