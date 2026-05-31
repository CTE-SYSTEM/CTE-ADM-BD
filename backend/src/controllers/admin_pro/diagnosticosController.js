import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';
import { DIAGNOSTICO_ESTADOS } from '../../utils/domainValidation.js';

export const getDiagnosticosAdmin = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const where = {};

    if (search) {
      const isNumeric = /^\d+$/.test(search);
      where.OR = [
        ...(isNumeric ? [{ id_diagnostico: Number(search) }] : []),
        { falla_reportada: { contains: search, mode: 'insensitive' } },
        { diagnostico_real: { contains: search, mode: 'insensitive' } },
        { estado_del_diagnostico: { contains: search, mode: 'insensitive' } },
        { Estado_aprobacion: { contains: search, mode: 'insensitive' } },
        { prioridad: { contains: search, mode: 'insensitive' } },
        { equipo: { marca: { contains: search, mode: 'insensitive' } } },
        { equipo: { modelo: { contains: search, mode: 'insensitive' } } },
        { equipo: { numero_serie: { contains: search, mode: 'insensitive' } } },
        { equipo: { cliente: { nombre: { contains: search, mode: 'insensitive' } } } },
        { tecnico: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const diagnosticos = await prisma.diagnosticos.findMany({
      where,
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true,
        ordenes: { include: { tecnico: true }, orderBy: { id_orden: 'desc' } },
      },
      orderBy: { fecha_hora: 'desc' },
    });

    res.json({ data: diagnosticos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener diagnosticos', details: error.message });
  }
};

export const updateDiagnosticoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tecnico_id,
      falla_reportada,
      diagnostico_real,
      presupuesto_estimado,
      prioridad,
      estado_del_diagnostico,
      Estado_aprobacion,
    } = req.body;

    const data = {};
    if (tecnico_id !== undefined) data.tecnico_id = tecnico_id ? Number(tecnico_id) : null;
    if (falla_reportada !== undefined) data.falla_reportada = String(falla_reportada).trim() || null;
    if (diagnostico_real !== undefined) data.diagnostico_real = String(diagnostico_real).trim() || null;
    if (presupuesto_estimado !== undefined) data.presupuesto_estimado = presupuesto_estimado === '' || presupuesto_estimado === null ? null : Number(presupuesto_estimado);
    if (prioridad !== undefined) data.prioridad = String(prioridad).trim() || 'Normal';
    if (estado_del_diagnostico !== undefined) {
      if (!DIAGNOSTICO_ESTADOS.includes(estado_del_diagnostico)) {
        return res.status(400).json({ error: 'Estado de diagnostico invalido', estados_validos: DIAGNOSTICO_ESTADOS });
      }
      data.estado_del_diagnostico = estado_del_diagnostico;
    }
    if (Estado_aprobacion !== undefined) data.Estado_aprobacion = String(Estado_aprobacion).trim() || 'Pendiente';

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    const diagnostico = await prisma.diagnosticos.update({
      where: { id_diagnostico: Number(id) },
      data,
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true,
        ordenes: { include: { tecnico: true }, orderBy: { id_orden: 'desc' } },
      },
    });

    res.json({ data: diagnostico });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnostico no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar diagnostico', details: error.message });
  }
};

export const updateDiagnosticoEstadoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_del_diagnostico } = req.body;

    if (!estado_del_diagnostico || !DIAGNOSTICO_ESTADOS.includes(estado_del_diagnostico)) {
      return res.status(400).json({
        error: 'Estado de diagnóstico inválido',
        estados_validos: DIAGNOSTICO_ESTADOS,
      });
    }

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT admin_pro.actualizar_estado_diagnostico(${Number(id)}, ${estado_del_diagnostico}) AS data
    `);
    const diagnostico = row?.data;

    if (diagnostico?.error) return res.status(404).json({ error: diagnostico.error });

    res.json({ data: diagnostico });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar estado del diagnóstico', details: error.message });
  }
};
