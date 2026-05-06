// controllers/JefeTecnico/DiagnosticoController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const estadosPendientes = ['PENDIENTE', 'Pendiente', 'pendiente', 'INGRESADO', 'Ingresado', 'ingresado'];

export const getDiagnosticosPendientes = async (req, res) => {
  try {
    const diagnosticos = await prisma.diagnosticos.findMany({
      where: {
        tecnico_id: null,
        estado_del_diagnostico: { in: estadosPendientes }
      },
      include: {
        equipo: {
          include: {
            cliente: true
          }
        }
      },
      orderBy: { fecha_hora: 'asc' }
    });
    res.json({ data: diagnosticos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener diagnósticos', details: error.message });
  }
};

export const asignarTecnicoADiagnostico = async (req, res) => {
  const { id } = req.params;
  const { id_tecnico } = req.body;

  try {
    const actualizado = await prisma.diagnosticos.update({
      where: { id_diagnostico: parseInt(id) },
      data: { 
        tecnico_id: parseInt(id_tecnico),
        fecha_asignacion: new Date(),
        estado_del_diagnostico: "EN_REVISION" 
      }
    });
    res.json({ data: actualizado });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar técnico al diagnóstico' });
  }
};

export const asignarTecnicoAOrden = async (req, res) => {
  const { id } = req.params;
  const { id_tecnico } = req.body;

  try {
    const actualizado = await prisma.ordenes.update({
      where: { id_orden: parseInt(id) },
      data: { tecnico_id: parseInt(id_tecnico) }
    });
    res.json({ data: actualizado });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar técnico a la orden' });
  }
};

// Agregar funciones faltantes para el dashboard
export const getTodos = async (req, res) => {
  try {
    const diagnosticos = await prisma.diagnosticos.findMany({
      where: {
        estado_del_diagnostico: { not: "COMPLETADO" }
      },
      include: {
        equipo: {
          include: {
            cliente: true
          }
        }
      },
      orderBy: { fecha_hora: 'asc' }
    });
    res.json({ data: diagnosticos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener todos los diagnósticos', details: error.message });
  }
};

export const getOrdenes = async (req, res) => {
  try {
    const ordenes = await prisma.ordenes.findMany({
      where: {
        estado: { in: estadosPendientes }
      },
      include: {
        diagnostico: {
          include: {
            equipo: {
              include: {
                cliente: true
              }
            }
          }
        }
      },
      orderBy: { fecha_ingreso: 'asc' }
    });
    res.json({ data: ordenes });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes', details: error.message });
  }
};

export const getRepuestos = async (req, res) => {
  try {
    const repuestos = await prisma.Ordenes_Repuestos.findMany({
      where: {
        estado_aprobacion: "PENDIENTE"
      },
      include: {
        orden: {
          include: {
            diagnostico: {
              include: {
                equipo: true
              }
            }
          }
        },
        repuesto: true
      },
      orderBy: { orden: { fecha_ingreso: 'asc' } }
    });
    res.json({ data: repuestos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener repuestos', details: error.message });
  }
};

export const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await prisma.tecnicos.findMany({
      select: {
        id_tecnico: true,
        nombre: true,
        especialidad: true
      }
    });
    res.json({ data: tecnicos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener técnicos', details: error.message });
  }
};

export const getOrdenById = async (req, res) => {
  const { id } = req.params;

  try {
    const orden = await prisma.ordenes.findUnique({
      where: { id_orden: parseInt(id) },
      include: {
        diagnostico: {
          include: {
            equipo: {
              include: {
                cliente: true
              }
            }
          }
        },
        tecnico: true
      }
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json({ data: orden });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener orden', details: error.message });
  }
};

export const updateOrden = async (req, res) => {
  const { id } = req.params;
  const { tecnico_id, prioridad, estado, tipo_equipo } = req.body;

  try {
    const orden = await prisma.ordenes.update({
      where: { id_orden: parseInt(id) },
      data: {
        tecnico_id: tecnico_id ? parseInt(tecnico_id) : undefined,
        prioridad,
        estado,
        tipo_equipo
      },
      include: {
        diagnostico: {
          include: {
            equipo: {
              include: {
                cliente: true
              }
            }
          }
        },
        tecnico: true
      }
    });

    res.json({ data: orden });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.status(500).json({ error: 'Error al actualizar orden', details: error.message });
  }
};

export const getDiagnosticoById = async (req, res) => {
  const { id } = req.params;
  try {
    const diagnostico = await prisma.diagnosticos.findUnique({
      where: { id_diagnostico: parseInt(id) },
      include: {
        equipo: {
          include: {
            cliente: true
          }
        },
        tecnico: true,
        ordenes: true
      }
    });
    if (!diagnostico) {
      return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    }
    res.json({ data: diagnostico });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener diagnóstico', details: error.message });
  }
};
