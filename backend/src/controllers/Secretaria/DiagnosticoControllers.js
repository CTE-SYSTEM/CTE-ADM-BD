// backend/src/controllers/Secretaria/diagnosticosController.js
import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';
import {
  DIAGNOSTICO_ESTADOS,
  PRIORIDADES,
  assertInList,
  parseNonNegativeMoney,
  parsePositiveId,
} from '../../utils/domainValidation.js';

export const getDiagnosticos = async (req, res) => {
  try {
    const rows = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_diagnosticos_formateados()`);
    const diagnosticos = rows.map((row) => row.data);
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

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT data FROM crear_diagnostico_proc(
        ${equipoId},
        ${tecnico_id ? parsePositiveId(tecnico_id) : null},
        ${falla_reportada.trim()},
        ${diagnostico_real || null},
        ${presupuesto_estimado ? parseNonNegativeMoney(presupuesto_estimado, 'Presupuesto estimado') : null},
        ${assertInList(prioridad || 'Normal', PRIORIDADES, 'Prioridad')},
        ${assertInList(estado_del_diagnostico || 'PENDIENTE', DIAGNOSTICO_ESTADOS, 'Estado del diagnostico')},
        ${Estado_aprobacion || 'Pendiente'},
        ${deja_cargador === true || deja_cargador === 'true'},
        ${enciende === true || enciende === 'true'},
        ${usa_corriente_ac === true || usa_corriente_ac === 'true'}
      )
    `);
    const diagnostico = row?.data;

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

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT data FROM actualizar_diagnostico_proc(
        ${Number(id)},
        ${equipo_id ? parsePositiveId(equipo_id) : null},
        ${tecnico_id ? parsePositiveId(tecnico_id) : null},
        ${falla_reportada?.trim() || null},
        ${diagnostico_real ?? null},
        ${presupuesto_estimado ? parseNonNegativeMoney(presupuesto_estimado, 'Presupuesto estimado') : null},
        ${prioridad ? assertInList(prioridad, PRIORIDADES, 'Prioridad') : null},
        ${estadoNuevo ? assertInList(estadoNuevo, DIAGNOSTICO_ESTADOS, 'Estado del diagnostico') : null},
        ${Estado_aprobacion ?? null},
        ${deja_cargador === undefined ? null : deja_cargador === true || deja_cargador === 'true'},
        ${enciende === undefined ? null : enciende === true || enciende === 'true'},
        ${usa_corriente_ac === undefined ? null : usa_corriente_ac === true || usa_corriente_ac === 'true'}
      )
    `);
    const diagnostico = row?.data;

    if (!diagnostico) return res.status(404).json({ error: 'Diagnostico no encontrado' });

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

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT data FROM actualizar_diagnostico_proc(${Number(id)}, ${null}, ${null}, ${null}, ${null}, ${null}, ${null}, ${estadoNuevo}, ${null}, ${null}, ${null}, ${null})
    `);
    const diagnostico = row?.data;

    if (!diagnostico) return res.status(404).json({ error: 'Diagnostico no encontrado' });

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
