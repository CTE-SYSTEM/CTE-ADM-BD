import { Prisma } from '@prisma/client';
import prisma from '../../app/prismaClient.js';
import {
  DIAGNOSTICO_ESTADOS,
  PRIORIDADES,
  assertInList,
  parseNonNegativeMoney,
  parsePositiveId,
} from '../../utils/domainValidation.js';

const booleanOrNull = (value) => {
  if (value === undefined) return null;
  return value === true || value === 'true';
};

export const listarDiagnosticos = async () => {
  const rows = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_diagnosticos_formateados()`);
  return rows.map((row) => row.data);
};

export const crearDiagnostico = async (data) => {
  const equipoId = parsePositiveId(data.equipo_id);
  const [row] = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM crear_diagnostico_proc(
      ${equipoId}::int,
      ${data.tecnico_id ? parsePositiveId(data.tecnico_id) : null}::int,
      ${data.falla_reportada.trim()},
      ${data.diagnostico_real || null},
      ${data.presupuesto_estimado ? parseNonNegativeMoney(data.presupuesto_estimado, 'Presupuesto estimado') : null}::numeric,
      ${assertInList(data.prioridad || 'Normal', PRIORIDADES, 'Prioridad')},
      ${assertInList(data.estado_del_diagnostico || 'PENDIENTE', DIAGNOSTICO_ESTADOS, 'Estado del diagnostico')},
      ${data.Estado_aprobacion || 'Pendiente'},
      ${data.deja_cargador === true || data.deja_cargador === 'true'},
      ${data.enciende === true || data.enciende === 'true'},
      ${data.usa_corriente_ac === true || data.usa_corriente_ac === 'true'}
    )
  `);

  return row?.data;
};

export const actualizarDiagnostico = async (id, data) => {
  const estadoNuevo = data.estado_del_diagnostico || data.estado;
  const [row] = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM actualizar_diagnostico_proc(
      ${Number(id)}::int,
      ${data.equipo_id ? parsePositiveId(data.equipo_id) : null}::int,
      ${data.tecnico_id ? parsePositiveId(data.tecnico_id) : null}::int,
      ${data.falla_reportada?.trim() || null},
      ${data.diagnostico_real ?? null},
      ${data.presupuesto_estimado ? parseNonNegativeMoney(data.presupuesto_estimado, 'Presupuesto estimado') : null}::numeric,
      ${data.prioridad ? assertInList(data.prioridad, PRIORIDADES, 'Prioridad') : null},
      ${estadoNuevo ? assertInList(estadoNuevo, DIAGNOSTICO_ESTADOS, 'Estado del diagnostico') : null},
      ${data.Estado_aprobacion ?? null},
      ${booleanOrNull(data.deja_cargador)},
      ${booleanOrNull(data.enciende)},
      ${booleanOrNull(data.usa_corriente_ac)}
    )
  `);

  return row?.data;
};

export const cambiarEstadoDiagnostico = (id, estado) =>
  actualizarDiagnostico(id, { estado_del_diagnostico: estado });

export const validarEquipoId = parsePositiveId;
export const validarEstadoDiagnostico = (estado) =>
  assertInList(estado, DIAGNOSTICO_ESTADOS, 'Estado del diagnostico');

export default {
  listarDiagnosticos,
  crearDiagnostico,
  actualizarDiagnostico,
  cambiarEstadoDiagnostico,
  validarEquipoId,
  validarEstadoDiagnostico,
};
