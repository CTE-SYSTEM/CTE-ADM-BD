import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';
import { ORDEN_ESTADOS, RESULTADOS_ORDEN, assertInList } from '../../utils/domainValidation.js';

const repuestoSafeSelect = {
  id_repuesto: true,
  tipo_repuesto_id: true,
  proveedor_id: true,
  nombre: true,
  descripcion: true,
  costo_individual: true,
  porcentaje_de_ganacia: true,
  ganancia_cordobas: true,
  activo: true,
  descontinuada: true,
};

const ordenInclude = {
  tecnico: true,
  diagnostico: {
    include: {
      equipo: { include: { cliente: true } },
      tecnico: true,
    },
  },
  repuestos_usados: {
    include: { repuesto: { select: repuestoSafeSelect } },
    orderBy: { id_detalle_repuesto: 'desc' },
  },
};

export const getDatabaseMessage = (error) => {
  const message = error?.meta?.message || error?.message || '';
  const match = message.match(/ERROR:\s*(.*)$/m);
  return match?.[1] || message;
};

export const findTecnicos = () => prisma.tecnicos.findMany();

export const createTecnico = async (data) => {
  const rows = await prisma.$queryRaw(Prisma.sql`
    SELECT crear_tecnico_proc(
      ${data.nombre},
      ${data.especialidad || null},
      ${data.horario || null},
      ${data.contacto || null},
      ${data.usuario_id ? Number(data.usuario_id) : null},
      ${data.activo === undefined ? true : Boolean(data.activo)}
    ) AS data
  `);

  return rows[0]?.data;
};

export const getTecnicoActivoByUsername = (username) =>
  prisma.tecnicos.findFirst({
    where: {
      usuario: { nombre_usuario: username },
      activo: true,
    },
  });

export const getMisDiagnosticos = async (username) => {
  const tecnico = await getTecnicoActivoByUsername(username);
  if (!tecnico) return { tecnico: null, data: [] };

  const rows = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_mis_diagnosticos_tecnico(${username})`);
  const diagnosticos = rows.map((row) => row.data);

  return { tecnico, data: diagnosticos };
};

export const getMisOrdenes = async (username) => {
  const tecnico = await getTecnicoActivoByUsername(username);
  if (!tecnico) return { tecnico: null, data: [] };

  const rows = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_mis_ordenes_tecnico(${username})`);
  const data = rows.map((row) => row.data);

  return { tecnico, data };
};

export const completarDiagnostico = async (diagnosticoId, payload) => {
  const diagnosticoReal = String(payload.diagnostico_real || '').trim();
  if (!diagnosticoReal) {
    const error = new Error('El informe tecnico es obligatorio');
    error.statusCode = 400;
    throw error;
  }

  const rows = await prisma.$queryRaw`
    SELECT data FROM completar_diagnostico_tecnico_proc(
      ${Number(diagnosticoId)},
      ${diagnosticoReal},
      ${payload.presupuesto_estimado ? Number(payload.presupuesto_estimado) : null}
    )
  `;

  return rows[0]?.data;
};

export const actualizarEstadoOrden = async (ordenId, payload) => {
  const { estado, resultado_final, enciende_salida, usa_corriente_ac_salida, observacion_final } = payload;
  if (!estado) {
    const error = new Error('El estado es obligatorio');
    error.statusCode = 400;
    throw error;
  }

  const estadoNuevo = assertInList(String(estado).toUpperCase(), ORDEN_ESTADOS, 'Estado de la orden');
  const estadoCierre = ['FINALIZADO', 'IRREPARABLE'].includes(estadoNuevo);

  const [ordenActual] = await prisma.$queryRaw(Prisma.sql`
    SELECT id_orden, estado
    FROM "Ordenes"
    WHERE id_orden = ${Number(ordenId)}
  `);

  if (!ordenActual) {
    const error = new Error('Orden no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (['FINALIZADO', 'ENTREGADO', 'IRREPARABLE'].includes((ordenActual.estado || '').toUpperCase())) {
    const error = new Error('Esta orden ya esta cerrada');
    error.statusCode = 409;
    throw error;
  }

  if (estadoNuevo === 'FINALIZADO') {
    // La validacion de piezas aprobadas vive en actualizar_estado_orden_tecnico_proc.
  }

  if (estadoCierre) {
    const observacion = String(observacion_final || '').trim();

    if (!observacion) {
      const error = new Error('La observacion final es obligatoria para cerrar la orden');
      error.statusCode = 400;
      throw error;
    }
  }

  const rows = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM actualizar_estado_orden_tecnico_proc(
      ${Number(ordenId)},
      ${estadoNuevo},
      ${estadoCierre ? assertInList(resultado_final || (estadoNuevo === 'IRREPARABLE' ? 'IRREPARABLE' : 'REPARADO'), RESULTADOS_ORDEN, 'Resultado final') : null},
      ${estadoCierre ? enciende_salida === true || enciende_salida === 'true' : null},
      ${estadoCierre ? usa_corriente_ac_salida === true || usa_corriente_ac_salida === 'true' : null},
      ${estadoCierre ? String(observacion_final || '').trim() : null}
    )
  `);

  return rows[0]?.data;
};

export const solicitarRepuesto = async (ordenId, payload) => {
  const { repuesto_id, repuesto, cantidad } = payload;
  const cantidadUsada = Math.max(Number(cantidad) || 1, 1);
  let nombreSolicitado = String(repuesto || '').trim();
  const repuestoId = Number(repuesto_id) || null;

  const [orden] = await prisma.$queryRaw(Prisma.sql`
    SELECT id_orden
    FROM "Ordenes"
    WHERE id_orden = ${Number(ordenId)}
  `);
  if (!orden) {
    const error = new Error('Orden no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (!nombreSolicitado && !repuestoId) {
    const error = new Error('Indique que pieza necesita solicitar');
    error.statusCode = 400;
    throw error;
  }

  const rows = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM solicitar_pieza_orden_tecnico_proc(
      ${Number(ordenId)},
      ${repuestoId},
      ${nombreSolicitado || null},
      ${cantidadUsada}
    )
  `);

  return rows[0]?.data;
};
