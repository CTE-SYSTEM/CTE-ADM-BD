// controllers/JefeTecnico/DiagnosticoController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getDiagnosticosPendientes = async (req, res) => {
  try {
    const diagnosticos = await prisma.diagnosticos.findMany({
      where: {
        tecnico_id: null,
        estado_del_diagnostico: "PENDIENTE"
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
        estado_del_diagnostico: "EN_REVISION" 
      }
    });
    res.json({ data: actualizado });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar técnico al diagnóstico' });
  }
};