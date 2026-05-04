import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const diagnosticoInclude = {
  equipo: {
    include: { cliente: true },
  },
  tecnico: true,
};

const shapeDiagnostico = (diagnostico) => ({
  ...diagnostico,
  cliente: diagnostico.equipo?.cliente || null,
  estado: diagnostico.estado_del_diagnostico,
});

export const getDiagnosticos = async (req, res) => {
  try {
    const diagnosticos = await prisma.diagnosticos.findMany({
      include: diagnosticoInclude,
      orderBy: { id_diagnostico: 'desc' },
    });

    res.json({ data: diagnosticos.map(shapeDiagnostico) });
  } catch (error) {
    console.error('Error al obtener diagnosticos:', error);
    res.status(500).json({ error: 'Error al obtener el historial de diagnosticos', details: error.message });
  }
};

export const createDiagnostico = async (req, res) => {
  try {
    const {
      equipo_id,
      tecnico_id,
      falla_reportada,
      diagnostico_real,
      estado_del_diagnostico,
      Estado_aprobacion,
      deja_cargador,
      enciende,
      usa_corriente_ac,
    } = req.body;

    if (!equipo_id) {
      return res.status(400).json({ error: 'El equipo es obligatorio' });
    }

    const diagnostico = await prisma.diagnosticos.create({
      data: {
        equipo_id: Number(equipo_id),
        tecnico_id: tecnico_id ? Number(tecnico_id) : null,
        falla_reportada: falla_reportada || null,
        diagnostico_real: diagnostico_real || null,
        estado_del_diagnostico: estado_del_diagnostico || 'PENDIENTE',
        Estado_aprobacion: Estado_aprobacion || 'Pendiente',
        deja_cargador: deja_cargador === true || deja_cargador === 'true',
        enciende: enciende === true || enciende === 'true',
        usa_corriente_ac: usa_corriente_ac === true || usa_corriente_ac === 'true',
      },
      include: diagnosticoInclude,
    });

    res.status(201).json({ data: shapeDiagnostico(diagnostico) });
  } catch (error) {
    console.error('Error al crear diagnostico:', error);
    res.status(500).json({ error: 'Error al procesar el ingreso del equipo', details: error.message });
  }
};

export const updateDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      equipo_id,
      tecnico_id,
      falla_reportada,
      diagnostico_real,
      estado_del_diagnostico,
      Estado_aprobacion,
      deja_cargador,
      enciende,
      usa_corriente_ac,
    } = req.body;

    const diagnostico = await prisma.diagnosticos.update({
      where: { id_diagnostico: Number(id) },
      data: {
        equipo_id: Number(equipo_id),
        tecnico_id: tecnico_id ? Number(tecnico_id) : null,
        falla_reportada: falla_reportada || null,
        diagnostico_real: diagnostico_real || null,
        estado_del_diagnostico,
        Estado_aprobacion,
        deja_cargador: deja_cargador === true || deja_cargador === 'true',
        enciende: enciende === true || enciende === 'true',
        usa_corriente_ac: usa_corriente_ac === true || usa_corriente_ac === 'true',
      },
      include: diagnosticoInclude,
    });

    res.json({ data: shapeDiagnostico(diagnostico) });
  } catch (error) {
    console.error('Error al actualizar diagnostico:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Registro de diagnostico no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar el registro', details: error.message });
  }
};

export const updateEstadoDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const diagnostico = await prisma.diagnosticos.update({
      where: { id_diagnostico: Number(id) },
      data: { estado_del_diagnostico: estado },
      include: diagnosticoInclude,
    });

    res.json({ data: shapeDiagnostico(diagnostico) });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'No se pudo actualizar el estado del diagnostico', details: error.message });
  }
};
