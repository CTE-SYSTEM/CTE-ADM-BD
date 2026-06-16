import prisma from './src/app/prismaClient.js';
const upper = (value) => String(value || '').toUpperCase();
const getFiltroFlujo = ({ diagnostico, orden, repuestosPendientes, factura, garantia }) => {
  const estadoDiagnostico = upper(diagnostico?.estado_del_diagnostico);
  const estadoOrden = upper(orden?.estado);

  if (factura && garantia) return 'con-garantia';
  if (factura) return 'entregados';

  if (orden) {
    if (['ENTREGADO'].includes(estadoOrden)) return 'entregados';
    if (['FINALIZADO', 'IRREPARABLE'].includes(estadoOrden)) return 'listos-facturar';
    if (estadoOrden === 'ESPERANDO_PIEZA' || repuestosPendientes > 0) return 'esperando-pieza';
    if (['EN_REPARACION', 'APROBADO'].includes(estadoOrden)) return 'en-reparacion';
    return 'pendientes';
  }

  if (['COMPLETADO', 'DIAGNOSTICADO', 'APROBADO'].includes(estadoDiagnostico)) return 'listos-orden';
  if (estadoDiagnostico === 'EN_REVISION') return 'en-revision';
  if (estadoDiagnostico === 'RECHAZADO') return 'rechazados';
  return 'pendientes';
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
      estado: orden.estado || 'PENDIENTE',
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

(async () => {
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
    take: 20,
  });

  const resumen = {};
  for (const equipo of equipos) {
    const diagnostico = equipo.diagnosticos?.[0] || null;
    const ordenData = mapOrden(diagnostico?.ordenes?.[0]);
    const filtro = getFiltroFlujo({
      diagnostico,
      orden: ordenData?.orden,
      repuestosPendientes: ordenData?.repuestos?.pendientes || 0,
      factura: ordenData?.factura,
      garantia: ordenData?.garantia,
    });
    resumen[filtro] = (resumen[filtro] || 0) + 1;
    console.log(JSON.stringify({ equipo: equipo.id_equipo, diagnostico: diagnostico?.estado_del_diagnostico, orden: ordenData?.orden?.estado, factura: !!ordenData?.factura, garantia: !!ordenData?.garantia, filtro, repuestos: ordenData?.repuestos }, null, 2));
  }
  console.log('resumen', resumen);
  await prisma.$disconnect();
})();
