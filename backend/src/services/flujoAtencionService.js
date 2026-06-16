import prisma from '../app/prismaClient.js';

const upper = (value) => String(value || '').trim().toUpperCase();

const getFiltroFlujo = ({ diagnostico, orden, repuestosPendientes, factura, garantia }) => {
  const estadoDiagnostico = upper(diagnostico?.estado_del_diagnostico);
  const estadoOrden = upper(orden?.estado);
  const tieneFactura = Boolean(factura?.id_factura);
  const tieneGarantia = Boolean(garantia?.id_garantia);

  if (tieneFactura && tieneGarantia) return 'con-garantia';
  if (tieneFactura) return 'entregados';

  if (orden) {
    if (estadoOrden === 'ENTREGADO') return 'entregados';
    if (['FINALIZADO', 'IRREPARABLE'].includes(estadoOrden)) return 'listos-facturar';
    if (estadoOrden === 'ESPERANDO_PIEZA' || repuestosPendientes > 0) return 'esperando-pieza';
    if (['EN_REPARACION', 'APROBADO'].includes(estadoOrden)) return 'en-reparacion';
    if (estadoOrden === 'PENDIENTE' || !estadoOrden) return 'pendientes';
    return 'pendientes';
  }

  if (['COMPLETADO', 'DIAGNOSTICADO', 'APROBADO'].includes(estadoDiagnostico)) return 'listos-orden';
  if (estadoDiagnostico === 'EN_REVISION') return 'en-revision';
  if (estadoDiagnostico === 'RECHAZADO') return 'rechazados';
  return 'pendientes';
};

const buildResumen = (items) => items.reduce((acc, item) => {
  acc[item.filtro] = (acc[item.filtro] || 0) + 1;
  acc.todos += 1;
  return acc;
}, { todos: 0 });

const normalizeOrdenEstado = (estado) => {
  const normalized = upper(estado);
  if (normalized === 'ENTREGADO') return 'ENTREGADO';
  if (normalized === 'FINALIZADO') return 'FINALIZADO';
  if (normalized === 'IRREPARABLE') return 'IRREPARABLE';
  if (normalized === 'ESPERANDO_PIEZA') return 'ESPERANDO_PIEZA';
  if (normalized === 'EN_REPARACION') return 'EN_REPARACION';
  if (normalized === 'APROBADO') return 'APROBADO';
  if (normalized === 'PENDIENTE') return 'PENDIENTE';
  return 'PENDIENTE';
};

const mapOrden = (orden) => {
  if (!orden) return null;

  const repuestos = orden.repuestos_usados || [];
  const repuestosPendientes = repuestos.filter(
    (detalle) => upper(detalle.estado_aprobacion) === 'PENDIENTE'
  ).length;
  const repuestosAprobados = repuestos.filter(
    (detalle) => upper(detalle.estado_aprobacion) === 'APROBADO'
  ).length;
  const factura = orden.facturas?.[0] || null;
  const garantia = factura?.garantias?.[0] || null;

  return {
    orden: {
      id_orden: orden.id_orden,
      estado: normalizeOrdenEstado(orden.estado),
      prioridad: orden.prioridad,
      fecha_ingreso: orden.fecha_ingreso,
      tecnico: orden.tecnico,
    },
    repuestos: {
      total: repuestos.length,
      pendientes: repuestosPendientes,
      aprobados: repuestosAprobados,
    },
    factura: factura
      ? {
          id_factura: factura.id_factura,
          fecha_emision: factura.fecha_emision,
          total: factura.total,
          metodo_pago: factura.metodo_pago,
        }
      : null,
    garantia: garantia
      ? {
          id_garantia: garantia.id_garantia,
          fecha_inicio: garantia.fecha_inicio,
          fecha_vencimiento: garantia.fecha_vencimiento,
          duracion_meses: garantia.duracion_meses,
        }
      : null,
  };
};

export const obtenerFlujoAtencion = async ({ filtro = 'todos', search = '' } = {}) => {
  const equipos = await prisma.equipos.findMany({
    include: {
      cliente: true,
      diagnosticos: {
        orderBy: { id_diagnostico: 'desc' },
        include: {
          tecnico: true,
          ordenes: {
            orderBy: { id_orden: 'desc' },
            include: {
              tecnico: true,
              repuestos_usados: true,
              facturas: {
                include: { garantias: true },
              },
            },
          },
        },
      },
    },
    orderBy: { id_equipo: 'desc' },
  });

  const normalizedSearch = search.trim().toLowerCase();

  const items = equipos.map((equipo) => {
    const diagnostico = equipo.diagnosticos?.[0] || null;
    const ordenData = mapOrden(diagnostico?.ordenes?.[0]);
    const repuestosPendientes = ordenData?.repuestos?.pendientes || 0;
    const filtroFlujo = getFiltroFlujo({
      diagnostico,
      orden: ordenData?.orden,
      repuestosPendientes,
      factura: ordenData?.factura,
      garantia: ordenData?.garantia,
    });

    return {
      id: `equipo-${equipo.id_equipo}`,
      filtro: filtroFlujo,
      cliente: equipo.cliente || null,
      equipo,
      diagnostico: diagnostico ? {
        id_diagnostico: diagnostico.id_diagnostico,
        estado: diagnostico.estado_del_diagnostico,
        aprobacion: diagnostico.Estado_aprobacion,
        falla_reportada: diagnostico.falla_reportada,
        diagnostico_real: diagnostico.diagnostico_real,
        prioridad: diagnostico.prioridad,
        fecha_hora: diagnostico.fecha_hora,
        tecnico: diagnostico.tecnico,
      } : null,
      orden: ordenData?.orden || null,
      repuestos: ordenData?.repuestos || { total: 0, pendientes: 0, aprobados: 0 },
      factura: ordenData?.factura || null,
      garantia: ordenData?.garantia || null,
    };
  });

  const resumen = buildResumen(items);
  const data = items.filter((item) => {
    const matchesFiltro = filtro === 'todos' || item.filtro === filtro;
    if (!matchesFiltro) return false;
    if (!normalizedSearch) return true;

    const haystack = [
      item.cliente?.nombre,
      item.cliente?.telefono,
      item.equipo?.marca,
      item.equipo?.modelo,
      item.equipo?.tipo,
      item.equipo?.numero_serie,
      item.diagnostico?.falla_reportada,
      item.diagnostico?.estado,
      item.diagnostico?.aprobacion,
      item.orden?.id_orden,
      item.orden?.estado,
      item.factura?.id_factura,
      item.filtro,
    ].filter(Boolean).join(' ').toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  return { data, resumen };
};

export default {
  obtenerFlujoAtencion,
};
