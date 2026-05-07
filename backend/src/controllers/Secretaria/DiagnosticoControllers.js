// backend/src/controllers/Secretaria/diagnosticosController.js
import prisma from '../../app/prismaClient.js';

export const getDiagnosticos = async (req, res) => {
  try {
    const diagnosticos = await prisma.diagnosticos.findMany({
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true
      },
      orderBy: { id_diagnostico: 'desc' }
    });
    res.json({ data: diagnosticos });
  } catch (error) {
    console.error('❌ Error en getDiagnosticos:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener historial', details: error.message });
  }
};

export const createDiagnostico = async (req, res) => {
  try {
    const {
      equipo_id, tecnico_id, falla_reportada, diagnostico_real,
      estado_del_diagnostico, Estado_aprobacion, deja_cargador, enciende, usa_corriente_ac
    } = req.body;

    const diagnostico = await prisma.diagnosticos.create({
      data: {
        equipo_id: Number(equipo_id),
        tecnico_id: tecnico_id ? Number(tecnico_id) : null,
        falla_reportada,
        diagnostico_real,
        estado_del_diagnostico: estado_del_diagnostico || 'PENDIENTE',
        Estado_aprobacion: Estado_aprobacion || 'Pendiente',
        deja_cargador: deja_cargador === true || deja_cargador === 'true',
        enciende: enciende === true || enciende === 'true',
        usa_corriente_ac: usa_corriente_ac === true || usa_corriente_ac === 'true'
      },
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true
      }
    });

    res.status(201).json({ data: diagnostico });
  } catch (error) {
    console.error('❌ Error en createDiagnostico:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al crear', details: error.message });
  }
};

export const updateDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const diagnostico = await prisma.diagnosticos.update({
      where: { id_diagnostico: Number(id) },
      data: { estado_del_diagnostico: estado },
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true
      }
    });

    res.json({ data: diagnostico });
  } catch (error) {
    console.error('❌ Error en updateDiagnostico:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    }
    res.status(500).json({ error: 'Error al cambiar estado', details: error.message });
  }
};