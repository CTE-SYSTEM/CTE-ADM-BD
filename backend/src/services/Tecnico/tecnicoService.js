import prisma from '../../app/prismaClient.js';
import { ORDEN_ESTADOS, RESULTADOS_ORDEN, assertInList } from '../../utils/domainValidation.js';

const ordenInclude = {
  tecnico: true,
  diagnostico: {
    include: {
      equipo: { include: { cliente: true } },
      tecnico: true,
    },
  },
  repuestos_usados: {
    include: { repuesto: true },
    orderBy: { id_detalle_repuesto: 'desc' },
  },
};

const getRowsData = (rows) => rows.map((row) => row.data);

export const getDatabaseMessage = (error) => {
  const message = error?.meta?.message || error?.message || '';
  const match = message.match(/ERROR:\s*(.*)$/m);
  return match?.[1] || message;
};

export const findTecnicos = () => prisma.tecnicos.findMany();

export const createTecnico = (data) => prisma.tecnicos.create({ data });

export const getTecnicoActivoByUsername = (username) =>
  prisma.tecnicos.findFirst({
    where: {
      usuario: { nombre_usuario: username },
      activo: true,
    },
  });

export const getMisDiagnosticos = async (username) => {
  const [tecnico, rows] = await Promise.all([
    getTecnicoActivoByUsername(username),
    prisma.$queryRaw`SELECT data FROM get_mis_diagnosticos_tecnico(${username})`,
  ]);

  return { tecnico, data: tecnico ? getRowsData(rows) : [] };
};

export const getMisOrdenes = async (username) => {
  const tecnico = await getTecnicoActivoByUsername(username);
  if (!tecnico) return { tecnico: null, data: [] };

  const ordenes = await prisma.ordenes.findMany({
    where: { tecnico_id: tecnico.id_tecnico },
    include: ordenInclude,
    orderBy: [
      { fecha_ingreso: 'desc' },
      { id_orden: 'desc' },
    ],
  });

  const ordenesFinalizadas = ordenes.filter((orden) => (orden.estado || '').toUpperCase() === 'FINALIZADO');
  const rankFinalizadas = new Map(ordenesFinalizadas.map((orden, index) => [orden.id_orden, index + 1]));
  const ayer = Date.now() - 24 * 60 * 60 * 1000;

  const data = ordenes.map((orden) => {
    const estado = (orden.estado || '').toUpperCase();
    const fechaIngreso = orden.fecha_ingreso ? new Date(orden.fecha_ingreso).getTime() : 0;
    return {
      ...orden,
      puede_editar_completada:
        !['FINALIZADO', 'IRREPARABLE', 'ENTREGADO'].includes(estado)
        || ((rankFinalizadas.get(orden.id_orden) || 999) <= 5 && fechaIngreso >= ayer),
    };
  });

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

  const ordenActual = await prisma.ordenes.findUnique({
    where: { id_orden: Number(ordenId) },
    include: { repuestos_usados: true },
  });

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
    const piezasSinAprobar = ordenActual.repuestos_usados.some((item) => item.estado_aprobacion !== 'APROBADO');
    if (piezasSinAprobar) {
      const error = new Error('No se puede finalizar: todas las piezas solicitadas deben estar aprobadas');
      error.statusCode = 409;
      throw error;
    }
  }

  const data = { estado: estadoNuevo };

  if (estadoCierre) {
    const resultado = assertInList(resultado_final || (estadoNuevo === 'IRREPARABLE' ? 'IRREPARABLE' : 'REPARADO'), RESULTADOS_ORDEN, 'Resultado final');
    const observacion = String(observacion_final || '').trim();

    if (!observacion) {
      const error = new Error('La observacion final es obligatoria para cerrar la orden');
      error.statusCode = 400;
      throw error;
    }

    data.resultado_final = resultado;
    data.enciende_salida = enciende_salida === true || enciende_salida === 'true';
    data.usa_corriente_ac_salida = usa_corriente_ac_salida === true || usa_corriente_ac_salida === 'true';
    data.observacion_final = observacion;
    data.fecha_cierre = new Date();
  }

  return prisma.ordenes.update({
    where: { id_orden: Number(ordenId) },
    data,
    include: ordenInclude,
  });
};

export const solicitarRepuesto = async (ordenId, payload) => {
  const { repuesto_id, repuesto, cantidad } = payload;
  const cantidadUsada = Math.max(Number(cantidad) || 1, 1);
  let nombreSolicitado = String(repuesto || '').trim();

  const orden = await prisma.ordenes.findUnique({ where: { id_orden: Number(ordenId) } });
  if (!orden) {
    const error = new Error('Orden no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (!nombreSolicitado && !Number(repuesto_id)) {
    const error = new Error('Indique que pieza necesita solicitar');
    error.statusCode = 400;
    throw error;
  }

  if (!nombreSolicitado && Number(repuesto_id)) {
    const repuestoEncontrado = await prisma.repuestos.findUnique({
      where: { id_repuesto: Number(repuesto_id) },
      select: { nombre: true },
    });
    nombreSolicitado = repuestoEncontrado?.nombre || '';
  }

  const piezaSolicitada = nombreSolicitado || String(repuesto_id);
  const rows = await prisma.$queryRaw`
    SELECT data FROM solicitar_pieza_orden_tecnico_proc(${Number(ordenId)}, ${piezaSolicitada}, ${cantidadUsada})
  `;

  return rows[0]?.data;
};
