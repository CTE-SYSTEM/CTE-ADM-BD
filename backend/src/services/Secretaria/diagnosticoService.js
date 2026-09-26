import prisma from '../../app/prismaClient.js';
import {
  DIAGNOSTICO_ESTADOS,
  PRIORIDADES,
  assertInList,
  parseNonNegativeMoney,
  parsePositiveId,
} from '../../utils/domainValidation.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';

const APPROVAL_STATES = ['Pendiente', 'Aprobado', 'Rechazado'];

const diagnosticoInclude = {
  tecnico: true,
  equipo: { include: { cliente: true } },
};

const booleanOrNull = (value) => {
  if (value === undefined) return null;
  return value === true || value === 'true';
};

const shapeDiagnostico = (diagnostico) => ({
  ...diagnostico,
  presupuesto_estimado: diagnostico.presupuesto_estimado === null
    ? null
    : Number(diagnostico.presupuesto_estimado),
  estado: diagnostico.estado_del_diagnostico,
  cliente: diagnostico.equipo?.cliente || null,
});

export const listarDiagnosticos = async (query = {}) => {
  const { page, pageSize, offset } = parsePagination(query);
  const search = String(query.search || '').trim();
  const numericSearch = Number.isInteger(Number(search)) && Number(search) > 0 ? Number(search) : null;
  const filterTecnico = String(query.filterTecnico || 'TODOS').toUpperCase();
  const searchWhere = search
    ? {
        OR: [
          ...(numericSearch ? [{ id_diagnostico: numericSearch }] : []),
          { equipo: { cliente: { nombre: { contains: search, mode: 'insensitive' } } } },
          { equipo: { modelo: { contains: search, mode: 'insensitive' } } },
          { equipo: { tipo: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};
  const tecnicoWhere = filterTecnico === 'SIN_ASIGNAR'
    ? { tecnico_id: null }
    : filterTecnico === 'ASIGNADOS'
      ? { tecnico_id: { not: null } }
      : {};
  const where = { ...searchWhere, ...tecnicoWhere };
  const [rows, total] = await Promise.all([
    prisma.diagnosticos.findMany({
      where,
      include: diagnosticoInclude,
      orderBy: { id_diagnostico: 'desc' },
      skip: offset,
      take: pageSize,
    }),
    prisma.diagnosticos.count({ where }),
  ]);

  return {
    data: rows.map(shapeDiagnostico),
    meta: buildPaginationMeta({ page, pageSize, total }),
  };
};

export const crearDiagnostico = async (data) => {
  const equipoId = parsePositiveId(data.equipo_id);
  if (!equipoId) throw new Error('El equipo es obligatorio');
  const tecnicoId = data.tecnico_id ? parsePositiveId(data.tecnico_id) : null;
  if (data.tecnico_id && !tecnicoId) throw new Error('El técnico es inválido');
  const falla = String(data.falla_reportada || '').trim();
  if (!falla) throw new Error('La falla reportada es obligatoria');
  const estado = assertInList(data.estado_del_diagnostico || 'PENDIENTE', DIAGNOSTICO_ESTADOS, 'Estado del diagnostico');
  const aprobacion = assertInList(data.Estado_aprobacion || 'Pendiente', APPROVAL_STATES, 'Estado de aprobacion');

  const [equipo, tecnico] = await Promise.all([
    prisma.equipos.findUniqueOrThrow({ where: { id_equipo: equipoId } }),
    tecnicoId ? prisma.tecnicos.findFirstOrThrow({ where: { id_tecnico: tecnicoId, activo: true } }) : null,
  ]);

  const diagnostico = await prisma.diagnosticos.create({
    data: {
      equipo_id: equipo.id_equipo,
      tecnico_id: tecnico?.id_tecnico || null,
      falla_reportada: falla,
      diagnostico_real: data.diagnostico_real?.trim() || null,
      presupuesto_estimado: data.presupuesto_estimado === undefined || data.presupuesto_estimado === null || data.presupuesto_estimado === ''
        ? null
        : parseNonNegativeMoney(data.presupuesto_estimado, 'Presupuesto estimado'),
      prioridad: assertInList(data.prioridad || 'Normal', PRIORIDADES, 'Prioridad'),
      estado_del_diagnostico: estado,
      Estado_aprobacion: aprobacion,
      deja_cargador: data.deja_cargador === true || data.deja_cargador === 'true',
      enciende: data.enciende === true || data.enciende === 'true',
      usa_corriente_ac: data.usa_corriente_ac === true || data.usa_corriente_ac === 'true',
      fecha_asignacion: tecnico ? new Date() : null,
      fecha_completado: ['COMPLETADO', 'DIAGNOSTICADO'].includes(estado) ? new Date() : null,
    },
    include: diagnosticoInclude,
  });

  return shapeDiagnostico(diagnostico);
};

export const actualizarDiagnostico = async (id, data) => {
  const estadoNuevo = data.estado_del_diagnostico || data.estado;
  const diagnosticoId = parsePositiveId(id);
  if (!diagnosticoId) throw new Error('El ID del diagnostico es inválido');
  const existente = await prisma.diagnosticos.findUniqueOrThrow({ where: { id_diagnostico: diagnosticoId } });
  const updateData = {};

  if (data.equipo_id !== undefined) {
    const equipoId = parsePositiveId(data.equipo_id);
    if (!equipoId) throw new Error('El equipo es inválido');
    await prisma.equipos.findUniqueOrThrow({ where: { id_equipo: equipoId } });
    updateData.equipo_id = equipoId;
  }
  if (data.tecnico_id !== undefined) {
    const tecnicoId = data.tecnico_id === null || data.tecnico_id === '' ? null : parsePositiveId(data.tecnico_id);
    if (data.tecnico_id && !tecnicoId) throw new Error('El técnico es inválido');
    if (tecnicoId) await prisma.tecnicos.findFirstOrThrow({ where: { id_tecnico: tecnicoId, activo: true } });
    updateData.tecnico_id = tecnicoId;
    updateData.fecha_asignacion = tecnicoId && !existente.fecha_asignacion ? new Date() : existente.fecha_asignacion;
  }
  if (data.falla_reportada !== undefined) {
    const falla = String(data.falla_reportada || '').trim();
    if (!falla) throw new Error('La falla reportada es obligatoria');
    updateData.falla_reportada = falla;
  }
  if (data.diagnostico_real !== undefined) updateData.diagnostico_real = data.diagnostico_real?.trim() || null;
  if (data.presupuesto_estimado !== undefined) updateData.presupuesto_estimado = parseNonNegativeMoney(data.presupuesto_estimado, 'Presupuesto estimado');
  if (data.prioridad !== undefined) updateData.prioridad = assertInList(data.prioridad, PRIORIDADES, 'Prioridad');
  if (estadoNuevo !== undefined) updateData.estado_del_diagnostico = assertInList(estadoNuevo, DIAGNOSTICO_ESTADOS, 'Estado del diagnostico');
  if (data.Estado_aprobacion !== undefined) updateData.Estado_aprobacion = assertInList(data.Estado_aprobacion, APPROVAL_STATES, 'Estado de aprobacion');
  for (const field of ['deja_cargador', 'enciende', 'usa_corriente_ac']) {
    const value = booleanOrNull(data[field]);
    if (value !== null) updateData[field] = value;
  }
  const estadoFinal = updateData.estado_del_diagnostico || existente.estado_del_diagnostico;
  if (estadoFinal === 'COMPLETADO' || estadoFinal === 'DIAGNOSTICADO') {
    updateData.fecha_completado = existente.fecha_completado || new Date();
  }

  const diagnostico = await prisma.diagnosticos.update({
    where: { id_diagnostico: diagnosticoId },
    data: updateData,
    include: diagnosticoInclude,
  });

  return shapeDiagnostico(diagnostico);
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
