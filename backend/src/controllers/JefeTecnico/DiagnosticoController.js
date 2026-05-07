// backend/src/controllers/JefeTecnico/DiagnosticoController.js
import prisma from '../../app/prismaClient.js';

// Obtener diagnósticos pendientes
export const getDiagnosticosPendientes = async (req, res) => {
  try {
    const diagnosticos = await prisma.diagnosticos.findMany({
      where: { estado_del_diagnostico: 'PENDIENTE' },
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
        fecha_asignacion: new Date()
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
      where: { activo: true },
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
      where: { activo: true },
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