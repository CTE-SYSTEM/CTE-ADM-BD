// backend/src/controllers/JefeTecnico/DiagnosticoController.js
import prisma from '../../app/prismaClient.js';
import { notifyJefeTecnico, notifyTecnico } from '../../services/notifications.js';

// --- UTILIDADES INTERNAS ---

/**
 * Verifica si han pasado menos de 30 minutos desde una fecha dada.
 */
const esEditablePorTiempo = (fechaReferencia) => {
  if (!fechaReferencia) return true; // Si no hay fecha, es editable (ej. primera asignación)
  const minutosTranscurridos = (new Date() - new Date(fechaReferencia)) / 60000;
  return minutosTranscurridos <= 30;
};

// --- CONTROLADORES DE DIAGNÓSTICO ---

export const getDiagnosticosPendientes = async (req, res) => {
  try {
    const diagnosticos = await prisma.diagnosticos.findMany({
      where: {
        tecnico_id: null,
        estado_del_diagnostico: { in: ['PENDIENTE', 'INGRESADO'] },
      },
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true
      },
      orderBy: { fecha_hora: 'asc' }
    });
    res.json({ data: diagnosticos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener diagnósticos', details: error.message });
  }
};

export const getTodosDiagnosticos = getDiagnosticosPendientes;

export const getDiagnosticoById = async (req, res) => {
  try {
    const diagnostico = await prisma.diagnosticos.findUnique({
      where: { id_diagnostico: Number(req.params.id) },
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true
      }
    });
    if (!diagnostico) return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    res.json({ data: diagnostico });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener diagnóstico', details: error.message });
  }
};

export const asignarTecnicoADiagnostico = async (req, res) => {
  const { id } = req.params;
  const { id_tecnico } = req.body;

  try {
    if (!id_tecnico) return res.status(400).json({ error: 'El ID del técnico es obligatorio' });

    const diagnosticoActual = await prisma.diagnosticos.findUnique({
      where: { id_diagnostico: parseInt(id) }
    });

    if (!diagnosticoActual) return res.status(404).json({ error: 'Diagnóstico no encontrado' });

    // Validación de 30 minutos si ya había una asignación previa
    if (diagnosticoActual.fecha_asignacion && !esEditablePorTiempo(diagnosticoActual.fecha_asignacion)) {
      return res.status(403).json({ error: 'El plazo de 30 minutos para reasignar técnico ha expirado' });
    }

    const diagnostico = await prisma.diagnosticos.update({
      where: { id_diagnostico: parseInt(id) },
      data: { 
        tecnico_id: parseInt(id_tecnico),
        fecha_asignacion: new Date(),
        estado_del_diagnostico: 'EN_REVISION'
      },
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true
      }
    });

    notifyJefeTecnico({
      type: 'diagnostico_asignado',
      title: 'Diagnóstico asignado',
      message: `Diagnóstico #${diagnostico.id_diagnostico} asignado a ${diagnostico.tecnico?.nombre || 'técnico'}`,
      severity: 'info',
      entity: { kind: 'diagnostico', id: diagnostico.id_diagnostico },
    });

    if (diagnostico.tecnico) {
      notifyTecnico(diagnostico.tecnico, {
        type: 'diagnostico_asignado',
        title: 'Nuevo diagnóstico asignado',
        message: `Se te asignó el diagnóstico #${diagnostico.id_diagnostico}`,
        severity: 'info',
        entity: { kind: 'diagnostico', id: diagnostico.id_diagnostico },
      });
    }

    res.json({ message: 'Técnico asignado correctamente', data: diagnostico });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar técnico', details: error.message });
  }
};

// --- CONTROLADORES DE ÓRDENES ---

export const getOrdenesAprobadas = async (req, res) => {
  try {
    const ordenes = await prisma.ordenes.findMany({
      where: {
        tecnico_id: null,
        OR: [
          { estado: { in: ['APROBADO', 'EN_REPARACION', 'PENDIENTE'] } },
          { diagnostico: { estado_del_diagnostico: 'APROBADO' } }
        ]
      },
      include: {
        tecnico: true,
        diagnostico: {
          include: {
            equipo: { include: { cliente: true } },
            tecnico: true
          }
        }
      },
      orderBy: { fecha_ingreso: 'asc' }
    });
    res.json({ data: ordenes });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes aprobadas', details: error.message });
  }
};

export const asignarTecnicoAOrden = async (req, res) => {
  const { id } = req.params;
  const { id_tecnico } = req.body;

  try {
    if (!id_tecnico) return res.status(400).json({ error: 'El ID del técnico es obligatorio' });

    const ordenActual = await prisma.ordenes.findUnique({
      where: { id_orden: Number(id) }
    });

    if (!ordenActual) return res.status(404).json({ error: 'Orden no encontrada' });

    // Validación de 30 minutos desde el ingreso de la orden
    if (!esEditablePorTiempo(ordenActual.fecha_ingreso)) {
      return res.status(403).json({ error: 'La asignación está bloqueada: han pasado más de 30 minutos desde el ingreso' });
    }

    const orden = await prisma.ordenes.update({
      where: { id_orden: Number(id) },
      data: {
        tecnico_id: Number(id_tecnico),
        estado: 'EN_REPARACION'
      },
      include: {
        tecnico: true,
        diagnostico: { include: { equipo: { include: { cliente: true } } } }
      }
    });

    notifyTecnico(orden.tecnico, {
      type: 'orden_asignada',
      title: 'Nueva orden asignada',
      message: `Se te asignó la orden #${orden.id_orden}`,
      severity: 'info',
      entity: { kind: 'orden', id: orden.id_orden },
    });

    res.json({ message: 'Orden asignada correctamente', data: orden });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar técnico a la orden', details: error.message });
  }
};

// --- CONTROLADORES DE REPUESTOS (CON RESTRICCIÓN ESTRICTA) ---

export const getRepuestosPendientesAprobacion = async (req, res) => {
  try {
    const solicitudes = await prisma.ordenes_Repuestos.findMany({
      where: { estado_aprobacion: 'PENDIENTE' },
      include: {
        repuesto: true,
        orden: {
          include: {
            tecnico: true,
            diagnostico: {
              include: { tecnico: true, equipo: { include: { cliente: true } } }
            }
          }
        }
      },
      orderBy: { id_detalle_repuesto: 'asc' }
    });
    res.json({ data: solicitudes });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener solicitudes', details: error.message });
  }
};

const actualizarEstadoSolicitudRepuesto = async (req, res, estado_aprobacion) => {
  try {
    // Solo permitimos APROBADO o DENEGADO (evita volver a PENDIENTE)
    if (!['APROBADO', 'DENEGADO'].includes(estado_aprobacion)) {
      return res.status(400).json({ error: 'Estado de aprobación no permitido' });
    }

    const solicitudPrevia = await prisma.ordenes_Repuestos.findUnique({
      where: { id_detalle_repuesto: Number(req.params.id) },
      include: { orden: true }
    });

    if (!solicitudPrevia) return res.status(404).json({ error: 'Solicitud no encontrada' });

    // Validación de 30 minutos desde que se generó la Orden de Repuestos
    if (!esEditablePorTiempo(solicitudPrevia.orden.fecha_ingreso)) {
      return res.status(403).json({ error: 'No se puede modificar la aprobación: el tiempo límite de 30 min ha expirado' });
    }

    const solicitud = await prisma.ordenes_Repuestos.update({
      where: { id_detalle_repuesto: Number(req.params.id) },
      data: { estado_aprobacion },
      include: {
        repuesto: true,
        orden: {
          include: {
            tecnico: true,
            diagnostico: { include: { tecnico: true, equipo: { include: { cliente: true } } } }
          }
        }
      }
    });

    const tecnico = solicitud.orden?.tecnico || solicitud.orden?.diagnostico?.tecnico;
    const aprobado = estado_aprobacion === 'APROBADO';

    notifyTecnico(tecnico, {
      type: aprobado ? 'repuesto_aprobado' : 'repuesto_rechazado',
      title: aprobado ? 'Pieza aprobada' : 'Pieza rechazada',
      message: `Tu solicitud para la orden #${solicitud.orden_id} fue ${aprobado ? 'aprobada' : 'rechazada'}`,
      severity: aprobado ? 'success' : 'warning',
      entity: { kind: 'repuesto', id: solicitud.id_detalle_repuesto, orden_id: solicitud.orden_id },
    });

    res.json({ message: `Estado actualizado a ${estado_aprobacion}`, data: solicitud });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar solicitud', details: error.message });
  }
};

export const aprobarSolicitudRepuesto = (req, res) =>
  actualizarEstadoSolicitudRepuesto(req, res, 'APROBADO');

export const rechazarSolicitudRepuesto = (req, res) =>
  actualizarEstadoSolicitudRepuesto(req, res, 'DENEGADO');

// --- OTROS MÉTODOS ---

export const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await prisma.tecnicos.findMany({
      where: { activo: true, usuario_id: { not: null } },
      select: { id_tecnico: true, nombre: true, especialidad: true, horario: true, contacto: true },
      orderBy: { nombre: 'asc' }
    });
    res.json({ data: tecnicos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener técnicos', details: error.message });
  }
};

export const getRepuestos = async (req, res) => {
  try {
    const repuestos = await prisma.repuestos.findMany({
      where: { descontinuada: false },
      orderBy: { nombre: 'asc' }
    });
    res.json({ data: repuestos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener repuestos', details: error.message });
  }
};

export const getOrdenById = async (req, res) => {
  const { id } = req.params;
  try {
    const orden = await prisma.ordenes.findUnique({
      where: { id_orden: parseInt(id) },
      include: {
        tecnico: true,
        diagnostico: { include: { equipo: { include: { cliente: true } }, tecnico: true } }
      }
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ data: orden });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener orden', details: error.message });
  }
};

export const getOrdenesPendientes = getOrdenesAprobadas;