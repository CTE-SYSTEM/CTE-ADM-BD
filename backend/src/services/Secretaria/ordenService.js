import { Prisma } from '@prisma/client';
import prisma from '../../app/prismaClient.js';
import { ORDEN_ESTADOS, PRIORIDADES, assertInList, parsePositiveId } from '../../utils/domainValidation.js';

export const listarOrdenes = async () => {
  const rows = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_ordenes_secretaria()`);
  return rows.map((row) => row.data);
};

export const listarDiagnosticosListosParaOrden = async () => {
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

  return {
    diagnosticos,
    meta: {
      completados: counts[0]?.completados || 0,
      completadosConOrden: counts[0]?.completadosConOrden || 0,
      listosParaOrden: diagnosticos.length,
      enRevision: counts[0]?.enRevision || 0,
    },
  };
};

export const obtenerDiagnosticoParaOrden = async (diagnosticoId) => {
  const [diagRow] = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM get_diagnostico_validacion_orden(${diagnosticoId}::int)
  `);

  return diagRow?.data;
};

export const crearOrden = async ({ diagnostico_id, tecnico_id, prioridad, estado, requiere_piezas }) => {
  const diagnosticoId = parsePositiveId(diagnostico_id);
  const [row] = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM crear_orden_secretaria_proc(
      ${diagnosticoId}::int,
      ${tecnico_id ? parsePositiveId(tecnico_id) : null}::int,
      ${assertInList(prioridad || 'Normal', PRIORIDADES, 'Prioridad')},
      ${assertInList(estado || 'PENDIENTE', ORDEN_ESTADOS, 'Estado de la orden')},
      ${requiere_piezas === undefined ? null : requiere_piezas === true || requiere_piezas === 'true'}
    )
  `);

  return row?.data;
};

export const actualizarOrden = async (id, { tecnico_id, prioridad, estado, requiere_piezas }) => {
  const [row] = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM actualizar_orden_secretaria_proc(
      ${Number(id)}::int,
      ${tecnico_id ? parsePositiveId(tecnico_id) : null}::int,
      ${prioridad ? assertInList(prioridad, PRIORIDADES, 'Prioridad') : null},
      ${estado ? assertInList(estado, ORDEN_ESTADOS, 'Estado de la orden') : null},
      ${requiere_piezas === undefined ? null : requiere_piezas === true || requiere_piezas === 'true'}
    )
  `);

  return row?.data;
};

export const eliminarOrden = (id) =>
  prisma.$executeRaw(Prisma.sql`SELECT eliminar_orden_secretaria_proc(${Number(id)}::int)`);

export const validarOrdenDiagnosticoId = parsePositiveId;

export default {
  listarOrdenes,
  listarDiagnosticosListosParaOrden,
  obtenerDiagnosticoParaOrden,
  crearOrden,
  actualizarOrden,
  eliminarOrden,
  validarOrdenDiagnosticoId,
};
