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

const toBoolean = (value) => value === true || value === 'true';

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
  if (estadoNuevo === 'ESPERANDO_PIEZA') {
    const error = new Error('El estado Esperando Piezas solo puede activarse automaticamente cuando existe una solicitud de repuesto');
    error.statusCode = 400;
    throw error;
  }

  const estadoCierre = estadoNuevo === 'FINALIZADO';
  const estadoIrreparable = estadoNuevo === 'IRREPARABLE';

  const [ordenActual] = await prisma.$queryRaw(Prisma.sql`
    SELECT id_orden, estado, requiere_piezas
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

  if (estadoCierre && ordenActual.requiere_piezas !== false) {
    const [resumenPiezas] = await prisma.$queryRaw(Prisma.sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE estado_aprobacion = 'APROBADO'
            AND estado_entrega = 'ENTREGADO'
        )::int AS aprobadas_entregadas,
        COUNT(*) FILTER (
          WHERE COALESCE(estado_aprobacion, 'PENDIENTE') IN ('PENDIENTE', 'EN_REVISION')
            OR (
              estado_aprobacion = 'APROBADO'
              AND (
                COALESCE(estado_entrega, 'PENDIENTE') <> 'ENTREGADO'
                OR repuesto_id IS NULL
              )
            )
        )::int AS pendientes
      FROM "Ordenes_Repuestos"
      WHERE orden_id = ${Number(ordenId)}
    `);

    const totalPiezas = Number(resumenPiezas?.total || 0);
    const piezasAprobadasEntregadas = Number(resumenPiezas?.aprobadas_entregadas || 0);
    const piezasPendientes = Number(resumenPiezas?.pendientes || 0);

    if (totalPiezas > 0 && (piezasAprobadasEntregadas === 0 || piezasPendientes > 0)) {
      const error = new Error('No se puede finalizar: las piezas solicitadas deben estar aprobadas y entregadas, sin solicitudes pendientes');
      error.statusCode = 409;
      throw error;
    }
  }

  const observacion = String(observacion_final || '').trim();

  if (estadoCierre) {
    if (!observacion) {
      const error = new Error('La observacion final es obligatoria para cerrar la orden');
      error.statusCode = 400;
      throw error;
    }
  }

  if (estadoIrreparable && !observacion) {
    const error = new Error('La justificacion de irreparabilidad es obligatoria');
    error.statusCode = 400;
    throw error;
  }

  const rows = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM actualizar_estado_orden_tecnico_proc(
      ${Number(ordenId)},
      ${estadoNuevo},
      ${estadoCierre || estadoIrreparable ? assertInList(resultado_final || (estadoIrreparable ? 'IRREPARABLE' : 'REPARADO'), RESULTADOS_ORDEN, 'Resultado final') : null},
      ${estadoCierre || estadoIrreparable ? toBoolean(enciende_salida) : null},
      ${estadoCierre || estadoIrreparable ? toBoolean(usa_corriente_ac_salida) : null},
      ${estadoCierre || estadoIrreparable ? observacion : null}
    )
  `);

  return rows[0]?.data;
};

export const solicitarRepuesto = async (ordenId, payload, username) => {
  const { repuesto_id, repuesto, cantidad, solicitar_sin_registro } = payload;
  const cantidadUsada = Math.max(Number(cantidad) || 1, 1);
  let nombreSolicitado = String(repuesto || '').trim();
  let repuestoId = Number(repuesto_id) || null;
  const esSolicitudSinRegistro = solicitar_sin_registro === true || solicitar_sin_registro === 'true';

  const tecnico = await getTecnicoActivoByUsername(username);
  if (!tecnico) {
    const error = new Error('Tecnico no encontrado o inactivo');
    error.statusCode = 403;
    throw error;
  }

  const orden = await prisma.ordenes.findUnique({
    where: { id_orden: Number(ordenId) },
    include: {
      tecnico: true,
      diagnostico: { include: { tecnico: true } },
    },
  });

  if (!orden) {
    const error = new Error('Orden no encontrada');
    error.statusCode = 404;
    throw error;
  }

  const tecnicoOrdenId = orden.tecnico_id || orden.diagnostico?.tecnico_id;
  if (Number(tecnicoOrdenId) !== Number(tecnico.id_tecnico)) {
    const error = new Error('No puede solicitar repuestos para una orden que no tiene asignado este tecnico');
    error.statusCode = 403;
    throw error;
  }

  if (orden.requiere_piezas === false) {
    const error = new Error('Esta orden fue marcada como servicio sin piezas y no permite solicitar repuestos');
    error.statusCode = 409;
    throw error;
  }

  if (!orden.tecnico_id) {
    await prisma.ordenes.update({
      where: { id_orden: Number(ordenId) },
      data: { tecnico_id: tecnico.id_tecnico },
    });
  }

  if (!nombreSolicitado && !repuestoId) {
    const error = new Error('Indique que pieza necesita solicitar');
    error.statusCode = 400;
    throw error;
  }

  if (!repuestoId && nombreSolicitado) {
    const repuestoEncontrado = await prisma.repuestos.findFirst({
      where: {
        nombre: { equals: nombreSolicitado, mode: 'insensitive' },
        descontinuada: false,
      },
      select: { id_repuesto: true },
    });

    if (repuestoEncontrado) {
      repuestoId = repuestoEncontrado.id_repuesto;
    } else if (!esSolicitudSinRegistro) {
      const error = new Error('esta pieza no existe');
      error.statusCode = 404;
      error.code = 'PIEZA_NO_EXISTE';
      throw error;
    }
  }

  const rows = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM solicitar_pieza_orden_tecnico_proc(
      ${Number(ordenId)},
      ${repuestoId},
      ${nombreSolicitado || null},
      ${cantidadUsada}
    )
  `);

  const solicitudId = Number(rows[0]?.data?.id_detalle_repuesto);
  if (!solicitudId) return rows[0]?.data;

  return prisma.ordenes_Repuestos.findUnique({
    where: { id_detalle_repuesto: solicitudId },
    include: {
      repuesto: { select: repuestoSafeSelect },
      orden: {
        include: {
          tecnico: true,
          diagnostico: { include: { tecnico: true } },
        },
      },
    },
  });
};
