import { GuidedTour as SharedGuidedTour, tourHighlightClass } from '../shared/GuidedTour';

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

export { tourHighlightClass };

export const GuidedTour = (props) => <SharedGuidedTour steps={tourSteps} {...props} />;
