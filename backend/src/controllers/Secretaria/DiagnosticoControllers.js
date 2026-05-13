// backend/src/controllers/Secretaria/diagnosticosController.js
import prisma from '../../app/prismaClient.js';
import {
  DIAGNOSTICO_ESTADOS,
  PRIORIDADES,
  assertInList,
  parseNonNegativeMoney,
  parsePositiveId,
} from '../../utils/domainValidation.js';

export const getDiagnosticos = async (req, res) => {
  try {
    const diagnosticos = await prisma.diagnosticos.findMany({
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true,
        ordenes: true,
      },
      orderBy: { id_diagnostico: 'desc' },
    });
    res.json({ data: diagnosticos });
  } catch (error) {
    console.error('Error en getDiagnosticos:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener historial', details: error.message });
  }
};

export const createDiagnostico = async (req, res) => {
  try {
    const {
      equipo_id, tecnico_id, falla_reportada, diagnostico_real,
      presupuesto_estimado, prioridad, estado_del_diagnostico, Estado_aprobacion, deja_cargador, enciende, usa_corriente_ac,
    } = req.body;

    if (!falla_reportada?.trim()) {
      return res.status(400).json({ error: 'La falla reportada es obligatoria' });
    }

    const equipoId = parsePositiveId(equipo_id);
    if (!equipoId) {
      return res.status(400).json({ error: 'El equipo es obligatorio' });
    }

    const diagnostico = await prisma.diagnosticos.create({
      data: {
        equipo_id: equipoId,
        tecnico_id: tecnico_id ? parsePositiveId(tecnico_id) : null,
        falla_reportada: falla_reportada.trim(),
        diagnostico_real,
        presupuesto_estimado: presupuesto_estimado ? parseNonNegativeMoney(presupuesto_estimado, 'Presupuesto estimado') : null,
        prioridad: assertInList(prioridad || 'Normal', PRIORIDADES, 'Prioridad'),
        estado_del_diagnostico: assertInList(estado_del_diagnostico || 'PENDIENTE', DIAGNOSTICO_ESTADOS, 'Estado del diagnostico'),
        Estado_aprobacion: Estado_aprobacion || 'Pendiente',
        deja_cargador: deja_cargador === true || deja_cargador === 'true',
        enciende: enciende === true || enciende === 'true',
        usa_corriente_ac: usa_corriente_ac === true || usa_corriente_ac === 'true',
      },
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true,
      },
    });

    res.status(201).json({ data: diagnostico });
  } catch (error) {
    console.error('Error en createDiagnostico:', error.message);
    console.error('Stack:', error.stack);
    if (error.message?.includes('no es valido') || error.message?.includes('debe ser')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al crear', details: error.message });
  }
};

export const updateDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      equipo_id, tecnico_id, falla_reportada, diagnostico_real,
      presupuesto_estimado, prioridad, estado, estado_del_diagnostico,
      Estado_aprobacion, deja_cargador, enciende, usa_corriente_ac,
    } = req.body;

    if (falla_reportada !== undefined && !falla_reportada?.trim()) {
      return res.status(400).json({ error: 'La falla reportada es obligatoria' });
    }

    const estadoNuevo = estado_del_diagnostico || estado;

    const diagnostico = await prisma.diagnosticos.update({
      where: { id_diagnostico: Number(id) },
      data: {
        equipo_id: equipo_id ? parsePositiveId(equipo_id) : undefined,
        tecnico_id: tecnico_id ? parsePositiveId(tecnico_id) : undefined,
        falla_reportada: falla_reportada?.trim(),
        diagnostico_real,
        presupuesto_estimado: presupuesto_estimado ? parseNonNegativeMoney(presupuesto_estimado, 'Presupuesto estimado') : undefined,
        prioridad: prioridad ? assertInList(prioridad, PRIORIDADES, 'Prioridad') : undefined,
        estado_del_diagnostico: estadoNuevo ? assertInList(estadoNuevo, DIAGNOSTICO_ESTADOS, 'Estado del diagnostico') : undefined,
        Estado_aprobacion,
        deja_cargador: deja_cargador === undefined ? undefined : deja_cargador === true || deja_cargador === 'true',
        enciende: enciende === undefined ? undefined : enciende === true || enciende === 'true',
        usa_corriente_ac: usa_corriente_ac === undefined ? undefined : usa_corriente_ac === true || usa_corriente_ac === 'true',
      },
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true,
      },
    });

    res.json({ data: diagnostico });
  } catch (error) {
    console.error('Error en updateDiagnostico:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnostico no encontrado' });
    }
    if (error.message?.includes('no es valido') || error.message?.includes('debe ser')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al cambiar estado', details: error.message });
  }
};

export const updateEstadoDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, estado_del_diagnostico } = req.body;
    const estadoNuevo = assertInList(estado_del_diagnostico || estado, DIAGNOSTICO_ESTADOS, 'Estado del diagnostico');

    const diagnostico = await prisma.diagnosticos.update({
      where: { id_diagnostico: Number(id) },
      data: { estado_del_diagnostico: estadoNuevo },
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true,
      },
    });

    res.json({ data: diagnostico });
  } catch (error) {
    console.error('Error en updateEstadoDiagnostico:', error.message);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnostico no encontrado' });
    }
    if (error.message?.includes('no es valido')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al cambiar estado', details: error.message });
  }
};
