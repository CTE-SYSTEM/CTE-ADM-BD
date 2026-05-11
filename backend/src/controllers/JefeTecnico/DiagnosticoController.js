// backend/src/controllers/JefeTecnico/DiagnosticoController.js
import prisma from '../../app/prismaClient.js';

// Obtener diagnósticos pendientes
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
    console.error('❌ Error en getDiagnosticosPendientes:', error.message);
    console.error('Stack:', error.stack);
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

    if (!diagnostico) {
      return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    }

    res.json({ data: diagnostico });
  } catch (error) {
    console.error('❌ Error en getDiagnosticoById:', error.message);
    res.status(500).json({ error: 'Error al obtener diagnóstico', details: error.message });
  }
};

// Asignar técnico a diagnóstico
export const asignarTecnicoADiagnostico = async (req, res) => {
  const { id } = req.params;
  const { id_tecnico } = req.body;

  try {
    if (!id_tecnico) {
      return res.status(400).json({ error: 'El ID del técnico es obligatorio' });
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

    res.json({ message: 'Técnico asignado correctamente', data: diagnostico });
  } catch (error) {
    console.error('❌ Error en asignarTecnicoADiagnostico:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    }
    res.status(500).json({ error: 'Error al asignar técnico al diagnóstico', details: error.message });
  }
};

// Obtener listado de técnicos
export const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await prisma.tecnicos.findMany({
      where: {
        activo: true,
        usuario_id: { not: null },
      },
      select: {
        id_tecnico: true,
        nombre: true,
        especialidad: true,
        horario: true,
        contacto: true
      },
      orderBy: { nombre: 'asc' }
    });
    res.json({ data: tecnicos });
  } catch (error) {
    console.error('❌ Error en getTecnicos:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener técnicos', details: error.message });
  }
};

// Obtener repuestos
export const getRepuestos = async (req, res) => {
  try {
    const repuestos = await prisma.repuestos.findMany({
      where: { descontinuada: false },
      orderBy: { nombre: 'asc' }
    });
    res.json({ data: repuestos });
  } catch (error) {
    console.error('❌ Error en getRepuestos:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener repuestos', details: error.message });
  }
};

// Obtener Orden por ID
export const getOrdenById = async (req, res) => {
  const { id } = req.params;
  try {
    const orden = await prisma.ordenes.findUnique({
      where: { id_orden: parseInt(id) },
      include: {
        tecnico: true,
        diagnostico: {
          include: {
            equipo: { include: { cliente: true } },
            tecnico: true
          }
        }
      }
    });
    
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ data: orden });
  } catch (error) {
    console.error('❌ Error en getOrdenById:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener orden', details: error.message });
  }
};

export const getOrdenesPendientes = async (req, res) => {
  try {
    return getOrdenesAprobadas(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes', details: error.message });
  }
};

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
    console.error('Error en getOrdenesAprobadas:', error.message);
    res.status(500).json({ error: 'Error al obtener ordenes aprobadas', details: error.message });
  }
};

export const asignarTecnicoAOrden = async (req, res) => {
  const { id } = req.params;
  const { id_tecnico } = req.body;

  try {
    if (!id_tecnico) {
      return res.status(400).json({ error: 'El ID del tecnico es obligatorio' });
    }

    const orden = await prisma.ordenes.update({
      where: { id_orden: Number(id) },
      data: {
        tecnico_id: Number(id_tecnico),
        estado: 'EN_REPARACION'
      },
      include: {
        tecnico: true,
        diagnostico: {
          include: {
            equipo: { include: { cliente: true } },
            tecnico: true
          }
        }
      }
    });

    res.json({ message: 'Orden asignada correctamente', data: orden });
  } catch (error) {
    console.error('Error en asignarTecnicoAOrden:', error.message);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.status(500).json({ error: 'Error al asignar tecnico a la orden', details: error.message });
  }
};

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
              include: {
                tecnico: true,
                equipo: { include: { cliente: true } }
              }
            }
          }
        }
      },
      orderBy: { id_detalle_repuesto: 'asc' }
    });

    res.json({ data: solicitudes });
  } catch (error) {
    console.error('Error en getRepuestosPendientesAprobacion:', error.message);
    res.status(500).json({ error: 'Error al obtener solicitudes de repuestos', details: error.message });
  }
};

const actualizarEstadoSolicitudRepuesto = async (req, res, estado_aprobacion) => {
  try {
    const solicitud = await prisma.ordenes_Repuestos.update({
      where: { id_detalle_repuesto: Number(req.params.id) },
      data: { estado_aprobacion },
      include: {
        repuesto: true,
        orden: {
          include: {
            tecnico: true,
            diagnostico: {
              include: {
                tecnico: true,
                equipo: { include: { cliente: true } }
              }
            }
          }
        }
      }
    });

    res.json({ data: solicitud });
  } catch (error) {
    console.error('Error al actualizar solicitud de repuesto:', error.message);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Solicitud de repuesto no encontrada' });
    }
    res.status(500).json({ error: 'Error al actualizar solicitud de repuesto', details: error.message });
  }
};

export const aprobarSolicitudRepuesto = (req, res) =>
  actualizarEstadoSolicitudRepuesto(req, res, 'APROBADO');

export const rechazarSolicitudRepuesto = (req, res) =>
  actualizarEstadoSolicitudRepuesto(req, res, 'DENEGADO');
