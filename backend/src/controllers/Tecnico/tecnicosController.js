import { notifyJefeTecnico } from '../../services/notifications.js';
import {
  actualizarEstadoOrden as actualizarEstadoOrdenService,
  completarDiagnostico,
  createTecnico as createTecnicoService,
  findTecnicos,
  getDatabaseMessage,
  getMisDiagnosticos as getMisDiagnosticosService,
  getMisOrdenes as getMisOrdenesService,
  solicitarRepuesto as solicitarRepuestoService,
} from '../../services/Tecnico/tecnicoService.js';

const sendControllerError = (res, error, fallbackMessage = 'Error interno del servidor') => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  if (error.code === 'P2010') {
    return res.status(409).json({ error: getDatabaseMessage(error) });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }
  if (error.message?.includes('no es valido')) {
    return res.status(400).json({ error: error.message });
  }
  return res.status(500).json({ error: fallbackMessage, details: error.message });
};

export const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await findTecnicos();
    res.json({ data: tecnicos });
  } catch (error) {
    console.error('Error al obtener tecnicos:', error);
    sendControllerError(res, error);
  }
};

export const createTecnico = async (req, res) => {
  try {
    const tecnico = await createTecnicoService(req.body);
    res.status(201).json({ data: tecnico });
  } catch (error) {
    console.error('Error al crear tecnico:', error);
    sendControllerError(res, error);
  }
};

export const getMisDiagnosticos = async (req, res) => {
  try {
    const result = await getMisDiagnosticosService(req.params.username);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener diagnosticos del tecnico:', error);
    sendControllerError(res, error);
  }
};

export const getMisOrdenes = async (req, res) => {
  try {
    const result = await getMisOrdenesService(req.params.username);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener ordenes del tecnico:', error);
    sendControllerError(res, error);
  }
};

export const actualizarDiagnosticoAsignado = async (req, res) => {
  try {
    const diagnostico = await completarDiagnostico(req.params.id, req.body);

    notifyJefeTecnico({
      type: 'diagnostico_completado',
      title: 'Diagnostico completado',
      message: `Diagnostico #${req.params.id} quedo listo para revision/aprobacion`,
      severity: 'success',
      entity: { kind: 'diagnostico', id: Number(req.params.id) },
    });

    res.json({ data: diagnostico });
  } catch (error) {
    console.error('Error al actualizar diagnostico asignado:', error);
    sendControllerError(res, error);
  }
};

export const actualizarEstadoOrden = async (req, res) => {
  try {
    const orden = await actualizarEstadoOrdenService(req.params.id, req.body);
    const estadoNuevo = String(orden.estado || '').toUpperCase();
    const estadoCierre = ['FINALIZADO', 'IRREPARABLE'].includes(estadoNuevo);

    notifyJefeTecnico({
      type: estadoCierre ? 'orden_cerrada' : 'orden_estado',
      title: estadoCierre ? 'Orden cerrada' : 'Cambio de estado',
      message: `Orden #${orden.id_orden} cambio a ${orden.estado}`,
      severity: estadoNuevo === 'IRREPARABLE' ? 'warning' : 'info',
      entity: { kind: 'orden', id: orden.id_orden },
    });

    res.json({ data: orden });
  } catch (error) {
    console.error('Error al actualizar estado de orden:', error);
    sendControllerError(res, error);
  }
};

export const solicitarRepuesto = async (req, res) => {
  try {
    const solicitud = await solicitarRepuestoService(req.params.id, req.body);

    notifyJefeTecnico({
      type: 'repuesto_solicitado',
      title: 'Solicitud de repuesto',
      message: `Nueva solicitud de pieza para orden #${req.params.id}`,
      severity: 'warning',
      entity: { kind: 'orden', id: Number(req.params.id) },
    });

    res.status(201).json({ data: solicitud, message: 'Solicitud de pieza enviada al jefe tecnico' });
  } catch (error) {
    console.error('Error al solicitar repuesto:', error);
    sendControllerError(res, error);
  }
};
