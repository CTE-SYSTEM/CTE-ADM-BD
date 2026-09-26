import prisma from '../../app/prismaClient.js';
import { ORDEN_ESTADOS, PRIORIDADES, assertInList, parsePositiveId } from '../../utils/domainValidation.js';

const ordenInclude = {
  diagnostico: {
    include: {
      equipo: { include: { cliente: true } },
    },
  },
  tecnico: true,
};

const shapeOrden = (orden) => ({
  ...orden,
  diagnostico: orden.diagnostico
    ? {
        ...orden.diagnostico,
        presupuesto_estimado: orden.diagnostico.presupuesto_estimado === null
          ? null
          : Number(orden.diagnostico.presupuesto_estimado),
      }
    : null,
});

const parseBoolean = (value) => value === true || value === 'true';

export const listarOrdenes = async () => {
  const ordenes = await prisma.ordenes.findMany({
    include: ordenInclude,
    orderBy: { id_orden: 'desc' },
  });
  return ordenes.map(shapeOrden);
};

export const listarDiagnosticosListosParaOrden = async () => {
  const estadosListos = ['COMPLETADO', 'DIAGNOSTICADO'];
  const whereListos = {
    estado_del_diagnostico: { in: estadosListos },
    ordenes: { none: {} },
  };
  const [diagnosticos, completados, completadosConOrden, enRevision] = await Promise.all([
    prisma.diagnosticos.findMany({
      where: whereListos,
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true,
      },
      orderBy: { id_diagnostico: 'desc' },
    }),
    prisma.diagnosticos.count({ where: { estado_del_diagnostico: { in: estadosListos } } }),
    prisma.diagnosticos.count({
      where: {
        estado_del_diagnostico: { in: estadosListos },
        ordenes: { some: {} },
      },
    }),
    prisma.diagnosticos.count({
      where: { estado_del_diagnostico: { in: ['PENDIENTE', 'INGRESADO', 'EN_REVISION'] } },
    }),
  ]);

  return {
    diagnosticos: diagnosticos.map((diagnostico) => ({
      id_diagnostico: diagnostico.id_diagnostico,
      falla_reportada: diagnostico.falla_reportada,
      diagnostico_real: diagnostico.diagnostico_real,
      presupuesto_estimado: diagnostico.presupuesto_estimado === null ? null : Number(diagnostico.presupuesto_estimado),
      prioridad: diagnostico.prioridad,
      estado_del_diagnostico: diagnostico.estado_del_diagnostico,
      fecha_hora: diagnostico.fecha_hora,
      equipo: diagnostico.equipo,
      tecnico: diagnostico.tecnico,
      ordenes: [],
    })),
    meta: {
      completados,
      completadosConOrden,
      listosParaOrden: diagnosticos.length,
      enRevision,
    },
  };
};

export const obtenerDiagnosticoParaOrden = async (diagnosticoId) => {
  const id = parsePositiveId(diagnosticoId);
  if (!id) return null;
  const diagnostico = await prisma.diagnosticos.findUnique({
    where: { id_diagnostico: id },
    include: {
      equipo: { include: { cliente: true } },
    },
  });
  if (!diagnostico) return null;

  return {
    id_diagnostico: diagnostico.id_diagnostico,
    estado_del_diagnostico: diagnostico.estado_del_diagnostico,
    diagnostico_real: diagnostico.diagnostico_real,
    presupuesto_estimado: diagnostico.presupuesto_estimado === null ? null : Number(diagnostico.presupuesto_estimado),
    equipo: diagnostico.equipo,
    orden_existente: await prisma.ordenes.count({ where: { diagnostico_id: id } }) > 0,
  };
};

export const crearOrden = async ({ diagnostico_id, tecnico_id, prioridad, estado, requiere_piezas }) => {
  const diagnosticoId = parsePositiveId(diagnostico_id);
  if (!diagnosticoId) throw new Error('El diagnostico es inválido');
  const tecnicoId = tecnico_id ? parsePositiveId(tecnico_id) : null;
  if (tecnico_id && !tecnicoId) throw new Error('El técnico es inválido');
  const prioridadNormalizada = assertInList(prioridad || 'Normal', PRIORIDADES, 'Prioridad');
  const estadoNormalizado = assertInList(estado || 'PENDIENTE', ORDEN_ESTADOS, 'Estado de la orden');

  const orden = await prisma.$transaction(async (tx) => {
    const diagnostico = await tx.diagnosticos.findUnique({
      where: { id_diagnostico: diagnosticoId },
      include: { equipo: { include: { cliente: true } } },
    });
    if (!diagnostico) throw new Error('Diagnostico no encontrado');
    if (!['COMPLETADO', 'DIAGNOSTICADO'].includes(diagnostico.estado_del_diagnostico)) {
      throw new Error('Solo se pueden crear ordenes desde diagnosticos completados');
    }
    if (!diagnostico.diagnostico_real || Number(diagnostico.presupuesto_estimado || 0) <= 0) {
      throw new Error('Complete informe tecnico y presupuesto antes de crear la orden');
    }
    const ordenExistente = await tx.ordenes.findFirst({ where: { diagnostico_id: diagnosticoId } });
    if (ordenExistente) throw new Error('Ya existe una orden para este diagnostico');
    if (tecnicoId) await tx.tecnicos.findFirstOrThrow({ where: { id_tecnico: tecnicoId, activo: true } });

    return tx.ordenes.create({
      data: {
        diagnostico_id: diagnosticoId,
        tecnico_id: tecnicoId,
        prioridad: prioridadNormalizada,
        estado: estadoNormalizado,
        requiere_piezas: requiere_piezas === undefined ? true : parseBoolean(requiere_piezas),
        fecha_asignacion: tecnicoId ? new Date() : null,
      },
      include: ordenInclude,
    });
  });

  return shapeOrden(orden);
};

export const actualizarOrden = async (id, { tecnico_id, prioridad, estado, requiere_piezas }) => {
  const ordenId = parsePositiveId(id);
  if (!ordenId) throw new Error('El ID de la orden es inválido');
  const existente = await prisma.ordenes.findUniqueOrThrow({ where: { id_orden: ordenId } });
  const data = {};

  if (tecnico_id !== undefined) {
    const tecnicoId = tecnico_id === null || tecnico_id === '' ? null : parsePositiveId(tecnico_id);
    if (tecnico_id && !tecnicoId) throw new Error('El técnico es inválido');
    if (tecnicoId) await prisma.tecnicos.findFirstOrThrow({ where: { id_tecnico: tecnicoId, activo: true } });
    data.tecnico_id = tecnicoId;
    data.fecha_asignacion = tecnicoId && !existente.fecha_asignacion ? new Date() : existente.fecha_asignacion;
  }
  if (prioridad !== undefined) data.prioridad = assertInList(prioridad, PRIORIDADES, 'Prioridad');
  if (estado !== undefined) data.estado = assertInList(estado, ORDEN_ESTADOS, 'Estado de la orden');
  if (requiere_piezas !== undefined) data.requiere_piezas = parseBoolean(requiere_piezas);
  const estadoFinal = data.estado || existente.estado;
  if (['FINALIZADO', 'IRREPARABLE'].includes(estadoFinal)) data.fecha_finalizacion = existente.fecha_finalizacion || new Date();
  if (estadoFinal === 'ENTREGADO') data.fecha_cierre = existente.fecha_cierre || new Date();

  const orden = await prisma.ordenes.update({
    where: { id_orden: ordenId },
    data,
    include: ordenInclude,
  });
  return shapeOrden(orden);
};

export const eliminarOrden = (id) => {
  const ordenId = parsePositiveId(id);
  if (!ordenId) throw new Error('El ID de la orden es inválido');
  return prisma.ordenes.delete({ where: { id_orden: ordenId } });
};

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
