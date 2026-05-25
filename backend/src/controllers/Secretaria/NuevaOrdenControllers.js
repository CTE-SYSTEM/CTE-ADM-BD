import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';
import { ORDEN_ESTADOS, PRIORIDADES, assertInList, parsePositiveId } from '../../utils/domainValidation.js';

export const getOrdenes = async (req, res) => {
  try {
    const rows = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_ordenes_secretaria()`);
    const ordenes = rows.map((row) => row.data);

    res.json({ data: ordenes });
  } catch (error) {
    console.error('Error al obtener ordenes:', error);
    res.status(500).json({ error: 'Error al obtener ordenes', details: error.message });
  }
};

export const getDiagnosticosListosParaOrden = async (req, res) => {
  try {
    const [rows, counts] = await Promise.all([
      prisma.$queryRaw(Prisma.sql`SELECT data FROM get_diagnosticos_listos_orden()`),
      prisma.$queryRaw(Prisma.sql`
        SELECT
          COUNT(*) FILTER (WHERE estado_del_diagnostico IN ('COMPLETADO', 'DIAGNOSTICADO'))::int AS completados,
          COUNT(*) FILTER (
            WHERE estado_del_diagnostico IN ('COMPLETADO', 'DIAGNOSTICADO')
            AND EXISTS (SELECT 1 FROM "Ordenes" o WHERE o.diagnostico_id = d.id_diagnostico)
          )::int AS "completadosConOrden",
          COUNT(*) FILTER (WHERE estado_del_diagnostico IN ('PENDIENTE', 'INGRESADO', 'EN_REVISION'))::int AS "enRevision"
        FROM "Diagnosticos" d
      `),
    ]);
    const diagnosticos = rows.map((row) => row.data);

    res.json({
      data: diagnosticos,
      meta: {
        completados: counts[0]?.completados || 0,
        completadosConOrden: counts[0]?.completadosConOrden || 0,
        listosParaOrden: diagnosticos.length,
        enRevision: counts[0]?.enRevision || 0,
      },
    });
  } catch (error) {
    console.error('Error al obtener diagnosticos listos para orden:', error);
    res.status(500).json({ error: 'Error al obtener diagnosticos listos para orden', details: error.message });
  }
};

export const createOrden = async (req, res) => {
  try {
    const { diagnostico_id, tecnico_id, prioridad, estado } = req.body;
    const diagnosticoId = parsePositiveId(diagnostico_id);

    if (!diagnosticoId) {
      return res.status(400).json({ error: 'El diagnostico es obligatorio' });
    }

    const [diagRow] = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_diagnostico_validacion_orden(${diagnosticoId})`);
    const diagnostico = diagRow?.data;

    if (!diagnostico) {
      return res.status(404).json({ error: 'Diagnostico no encontrado' });
    }

    const estadoDiagnostico = (diagnostico.estado_del_diagnostico || '').toUpperCase();
    const estadosListos = ['COMPLETADO', 'DIAGNOSTICADO'];

    if (!estadosListos.includes(estadoDiagnostico)) {
      return res.status(409).json({ error: 'Solo se pueden crear ordenes desde diagnosticos completados' });
    }

    if (!diagnostico.equipo?.cliente?.id_cliente || !diagnostico.equipo?.id_equipo) {
      return res.status(400).json({ error: 'El diagnostico no tiene cliente o equipo valido' });
    }

    if (!diagnostico.diagnostico_real || Number(diagnostico.presupuesto_estimado || 0) <= 0) {
      return res.status(400).json({ error: 'Complete informe tecnico y presupuesto antes de crear la orden' });
    }

    if (diagnostico.orden_existente) {
      return res.status(409).json({ error: 'Ya existe una orden para este diagnostico' });
    }

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT data FROM crear_orden_secretaria_proc(
        ${diagnosticoId},
        ${tecnico_id ? parsePositiveId(tecnico_id) : null},
        ${assertInList(prioridad || 'Normal', PRIORIDADES, 'Prioridad')},
        ${assertInList(estado || 'PENDIENTE', ORDEN_ESTADOS, 'Estado de la orden')}
      )
    `);
    const orden = row?.data;

    res.status(201).json({ data: orden });
  } catch (error) {
    console.error('Error al crear orden:', error);
    if (error.message?.includes('no es valido')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al crear orden', details: error.message });
  }
};

export const updateOrden = async (req, res) => {
  try {
    const { tecnico_id, prioridad, estado } = req.body;

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT data FROM actualizar_orden_secretaria_proc(
        ${Number(req.params.id)},
        ${tecnico_id ? parsePositiveId(tecnico_id) : null},
        ${prioridad ? assertInList(prioridad, PRIORIDADES, 'Prioridad') : null},
        ${estado ? assertInList(estado, ORDEN_ESTADOS, 'Estado de la orden') : null}
      )
    `);
    const orden = row?.data;

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    res.json({ data: orden });
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    if (error.message?.includes('no es valido')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al actualizar orden', details: error.message });
  }
};

export const deleteOrden = async (req, res) => {
  try {
    await prisma.$executeRaw(Prisma.sql`SELECT eliminar_orden_secretaria_proc(${Number(req.params.id)})`);

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: 'Error al eliminar orden', details: error.message });
  }
};
