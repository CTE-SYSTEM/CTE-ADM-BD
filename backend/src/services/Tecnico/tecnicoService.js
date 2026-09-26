import prisma from '../../app/prismaClient.js';
import { ORDEN_ESTADOS, RESULTADOS_ORDEN, assertInList, parseNonNegativeMoney, parsePositiveId } from '../../utils/domainValidation.js';

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

const diagnosticoInclude = {
  equipo: { include: { cliente: true } },
  tecnico: true,
};

const toBoolean = (value) => value === true || value === 'true';

export const getDatabaseMessage = (error) => {
  const message = error?.meta?.message || error?.message || '';
  const match = message.match(/ERROR:\s*(.*)$/m);
  return match?.[1] || message;
};

export const findTecnicos = () => prisma.tecnicos.findMany({ orderBy: { id_tecnico: 'asc' } });

export const createTecnico = async (data) => {
  const nombre = String(data.nombre || '').trim();
  if (!nombre) {
    const error = new Error('El nombre del tecnico es obligatorio');
    error.statusCode = 400;
    throw error;
  }
  const usuarioId = data.usuario_id === undefined || data.usuario_id === null || data.usuario_id === ''
    ? null
    : parsePositiveId(data.usuario_id);
  if (data.usuario_id !== undefined && data.usuario_id !== null && data.usuario_id !== '' && !usuarioId) {
    const error = new Error('El usuario seleccionado no es valido');
    error.statusCode = 400;
    throw error;
  }
  if (usuarioId) await prisma.usuarios.findUniqueOrThrow({ where: { id_usuario: usuarioId } });

  return prisma.tecnicos.create({
    data: {
      nombre,
      especialidad: data.especialidad?.trim() || null,
      horario: data.horario?.trim() || null,
      contacto: data.contacto?.trim() || null,
      usuario_id: usuarioId,
      activo: data.activo === undefined ? true : Boolean(data.activo),
    },
  });
};

export const getTecnicoActivoByUsername = (username) =>
  prisma.tecnicos.findFirst({
    where: { usuario: { nombre_usuario: username }, activo: true },
  });

export const getMisDiagnosticos = async (username) => {
  const tecnico = await getTecnicoActivoByUsername(username);
  if (!tecnico) return { tecnico: null, data: [] };

  const diagnosticos = await prisma.diagnosticos.findMany({
    where: { tecnico_id: tecnico.id_tecnico, ordenes: { none: {} } },
    include: diagnosticoInclude,
    orderBy: [{ fecha_asignacion: 'desc' }, { fecha_hora: 'desc' }],
  });
  return { tecnico, data: diagnosticos };
};

export const getMisOrdenes = async (username) => {
  const tecnico = await getTecnicoActivoByUsername(username);
  if (!tecnico) return { tecnico: null, data: [] };

  const ordenes = await prisma.ordenes.findMany({
    where: {
      OR: [
        { tecnico_id: tecnico.id_tecnico },
        { tecnico_id: null, diagnostico: { tecnico_id: tecnico.id_tecnico } },
      ],
    },
    include: ordenInclude,
    orderBy: [{ fecha_ingreso: 'desc' }, { id_orden: 'desc' }],
  });
  const finalizadas = ordenes.filter((orden) => String(orden.estado || '').toUpperCase() === 'FINALIZADO');
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const data = ordenes.map((orden) => {
    const posicionFinalizada = finalizadas.findIndex((item) => item.id_orden === orden.id_orden);
    const puedeEditarCompletada = String(orden.estado || '').toUpperCase() !== 'FINALIZADO'
      || (posicionFinalizada >= 0 && posicionFinalizada < 5 && orden.fecha_ingreso && new Date(orden.fecha_ingreso).getTime() >= cutoff);
    return { ...orden, puede_editar_completada: Boolean(puedeEditarCompletada) };
  });
  return { tecnico, data };
};

export const completarDiagnostico = async (diagnosticoId, payload) => {
  const id = parsePositiveId(diagnosticoId);
  if (!id) {
    const error = new Error('El diagnostico seleccionado no es valido');
    error.statusCode = 400;
    throw error;
  }
  const diagnosticoReal = String(payload.diagnostico_real || '').trim();
  if (!diagnosticoReal) {
    const error = new Error('El informe tecnico es obligatorio');
    error.statusCode = 400;
    throw error;
  }
  const presupuestoEstimado = payload.presupuesto_estimado === '' || payload.presupuesto_estimado === null || payload.presupuesto_estimado === undefined
    ? null
    : parseNonNegativeMoney(payload.presupuesto_estimado, 'El presupuesto estimado');

  const diagnostico = await prisma.$transaction(async (tx) => {
    const actual = await tx.diagnosticos.findUnique({ where: { id_diagnostico: id } });
    if (!actual) {
      const error = new Error('Diagnostico no encontrado');
      error.statusCode = 404;
      throw error;
    }
    if (String(actual.estado_del_diagnostico || '').toUpperCase() === 'COMPLETADO') {
      const error = new Error('Diagnostico ya completado');
      error.statusCode = 409;
      throw error;
    }
    return tx.diagnosticos.update({
      where: { id_diagnostico: id },
      data: {
        diagnostico_real: diagnosticoReal,
        presupuesto_estimado: presupuestoEstimado,
        estado_del_diagnostico: 'COMPLETADO',
        fecha_completado: new Date(),
      },
      include: diagnosticoInclude,
    });
  });
  return diagnostico;
};

export const actualizarEstadoOrden = async (ordenId, payload) => {
  const id = parsePositiveId(ordenId);
  if (!id) {
    const error = new Error('La orden seleccionada no es valida');
    error.statusCode = 400;
    throw error;
  }
  const { estado, resultado_final, enciende_salida, usa_corriente_ac_salida, observacion_final } = payload;
  if (!estado) {
    const error = new Error('El estado es obligatorio');
    error.statusCode = 400;
    throw error;
  }
  const estadoNuevo = String(assertInList(String(estado).toUpperCase(), ORDEN_ESTADOS, 'Estado de la orden')).toUpperCase();
  if (!['EN_REPARACION', 'FINALIZADO', 'IRREPARABLE'].includes(estadoNuevo)) {
    const error = new Error('Este estado solo puede cambiarse desde el flujo del tecnico');
    error.statusCode = 400;
    throw error;
  }
  const estadoCierre = estadoNuevo === 'FINALIZADO';
  const estadoIrreparable = estadoNuevo === 'IRREPARABLE';
  const observacion = String(observacion_final || '').trim();
  if (estadoCierre && !observacion) {
    const error = new Error('La observacion final es obligatoria para cerrar la orden');
    error.statusCode = 400;
    throw error;
  }
  if (estadoIrreparable && !observacion) {
    const error = new Error('La justificacion de irreparabilidad es obligatoria');
    error.statusCode = 400;
    throw error;
  }

  const orden = await prisma.$transaction(async (tx) => {
    const actual = await tx.ordenes.findUnique({
      where: { id_orden: id },
      include: { repuestos_usados: true },
    });
    if (!actual) {
      const error = new Error('Orden no encontrada');
      error.statusCode = 404;
      throw error;
    }
    if (['FINALIZADO', 'ENTREGADO', 'IRREPARABLE'].includes(String(actual.estado || '').toUpperCase())) {
      const error = new Error('Esta orden ya esta cerrada');
      error.statusCode = 409;
      throw error;
    }
    if (estadoCierre && actual.requiere_piezas !== false) {
      const pendientes = actual.repuestos_usados.filter((detalle) =>
        detalle.estado_aprobacion !== 'APROBADO'
        || detalle.estado_entrega !== 'ENTREGADO'
        || !detalle.repuesto_id,
      );
      if (pendientes.length > 0) {
        const error = new Error('No se puede finalizar: todas las piezas solicitadas deben estar aprobadas y entregadas');
        error.statusCode = 409;
        throw error;
      }
    }

    return tx.ordenes.update({
      where: { id_orden: id },
      data: {
        estado: estadoNuevo,
        resultado_final: estadoCierre || estadoIrreparable
          ? assertInList(resultado_final || (estadoIrreparable ? 'IRREPARABLE' : 'REPARADO'), RESULTADOS_ORDEN, 'Resultado final')
          : actual.resultado_final,
        enciende_salida: estadoCierre || estadoIrreparable ? toBoolean(enciende_salida) : actual.enciende_salida,
        usa_corriente_ac_salida: estadoCierre || estadoIrreparable ? toBoolean(usa_corriente_ac_salida) : actual.usa_corriente_ac_salida,
        observacion_final: estadoCierre || estadoIrreparable ? observacion : actual.observacion_final,
        fecha_cierre: estadoCierre ? new Date() : actual.fecha_cierre,
        fecha_finalizacion: estadoCierre ? new Date() : actual.fecha_finalizacion,
        justificacion_irreparable: estadoIrreparable ? observacion : actual.justificacion_irreparable,
        irreparable_estado: estadoIrreparable ? 'PENDIENTE' : actual.irreparable_estado,
      },
      include: ordenInclude,
    });
  });
  return orden;
};

export const solicitarRepuesto = async (ordenId, payload, username) => {
  const id = parsePositiveId(ordenId);
  if (!id) {
    const error = new Error('La orden seleccionada no es valida');
    error.statusCode = 400;
    throw error;
  }
  const { repuesto_id, repuesto, cantidad, solicitar_sin_registro } = payload;
  const cantidadUsada = cantidad === undefined || cantidad === '' ? 1 : Number(cantidad);
  if (!Number.isInteger(cantidadUsada) || cantidadUsada < 1) {
    const error = new Error('La cantidad debe ser un entero mayor a cero');
    error.statusCode = 400;
    throw error;
  }
  const esSolicitudSinRegistro = solicitar_sin_registro === true || solicitar_sin_registro === 'true';
  const tecnico = await getTecnicoActivoByUsername(username);
  if (!tecnico) {
    const error = new Error('Tecnico no encontrado o inactivo');
    error.statusCode = 403;
    throw error;
  }

  const solicitud = await prisma.$transaction(async (tx) => {
    const orden = await tx.ordenes.findUnique({
      where: { id_orden: id },
      include: { tecnico: true, diagnostico: { include: { tecnico: true } } },
    });
    if (!orden) {
      const error = new Error('Orden no encontrada');
      error.statusCode = 404;
      throw error;
    }
    if (['FINALIZADO', 'ENTREGADO', 'IRREPARABLE'].includes(String(orden.estado || '').toUpperCase())) {
      const error = new Error('No se pueden solicitar repuestos para una orden cerrada');
      error.statusCode = 409;
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

    let repuestoId = repuesto_id === undefined || repuesto_id === null || repuesto_id === '' ? null : parsePositiveId(repuesto_id);
    if (repuesto_id && !repuestoId) {
      const error = new Error('El repuesto seleccionado no es valido');
      error.statusCode = 400;
      throw error;
    }
    let repuestoEncontrado = null;
    const nombreSolicitado = String(repuesto || '').trim();
    if (!repuestoId && nombreSolicitado) {
      repuestoEncontrado = await tx.repuestos.findFirst({
        where: { nombre: { equals: nombreSolicitado, mode: 'insensitive' }, descontinuada: false },
      });
      if (repuestoEncontrado) repuestoId = repuestoEncontrado.id_repuesto;
      else if (!esSolicitudSinRegistro) {
        const error = new Error('esta pieza no existe');
        error.statusCode = 404;
        error.code = 'PIEZA_NO_EXISTE';
        throw error;
      }
    }
    if (!repuestoId && !nombreSolicitado) {
      const error = new Error('Indique que pieza necesita solicitar');
      error.statusCode = 400;
      throw error;
    }
    if (repuestoId) {
      const repuestoActual = repuestoEncontrado || await tx.repuestos.findFirst({ where: { id_repuesto: repuestoId, descontinuada: false } });
      if (!repuestoActual) {
        const error = new Error('El repuesto seleccionado no existe o esta descontinuado');
        error.statusCode = 400;
        throw error;
      }
      if (Number(repuestoActual.stock_actual || 0) < cantidadUsada) {
        const error = new Error('Stock insuficiente para solicitar el repuesto');
        error.statusCode = 409;
        throw error;
      }
      if (!nombreSolicitado) repuestoEncontrado = repuestoActual;
    }

    if (!orden.tecnico_id) {
      await tx.ordenes.update({ where: { id_orden: id }, data: { tecnico_id: tecnico.id_tecnico } });
    }
    await tx.ordenes.update({
      where: { id_orden: id },
      data: { estado: 'ESPERANDO_PIEZA' },
    });

    return tx.ordenes_Repuestos.create({
      data: {
        orden_id: id,
        repuesto_id: repuestoId,
        pieza_solicitada: nombreSolicitado || repuestoEncontrado?.nombre || String(repuestoId),
        cantidad_usada: cantidadUsada,
        estado_aprobacion: 'PENDIENTE',
      },
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
  });

  return solicitud;
};
