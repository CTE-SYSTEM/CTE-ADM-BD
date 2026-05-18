import { Prisma } from '@prisma/client';
import prisma from '../../app/prismaClient.js';

const normalizeReportRows = (rows) =>
  JSON.parse(JSON.stringify(rows, (_, value) => (typeof value === 'bigint' ? Number(value) : value)));

const adminReportQueries = {
  resumen: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.resumen_general(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  repuestos_usados: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.repuestos_usados_por_periodo(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  repuestos_por_proveedor: ({ proveedorId, fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.repuestos_usados_por_proveedor(CAST(${proveedorId} AS INT), CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  compras: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.compras_por_periodo(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  facturacion: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.facturacion_por_periodo(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  tecnicos: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.rendimiento_tecnicos(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  ordenes_estado: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.ordenes_por_estado(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  diagnosticos_estado: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.diagnosticos_por_estado(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  equipos_cliente: () =>
    Prisma.sql`SELECT * FROM admin_pro.equipos_por_cliente()`,

  garantias_vencer: ({ dias }) =>
    Prisma.sql`SELECT * FROM admin_pro.garantias_por_vencer(CAST(${dias} AS INT))`,

  inventario: () =>
    Prisma.sql`SELECT * FROM admin_pro.inventario_repuestos()`,
};

export const getReporteAdminPro = async (req, res) => {
  try {
    const { tipo } = req.params;
    const buildQuery = adminReportQueries[tipo];

    if (!buildQuery) {
      return res.status(400).json({
        error: 'Reporte no soportado',
        reportes_disponibles: Object.keys(adminReportQueries)
      });
    }

    const params = {
      fechaInicio: req.query.fecha_inicio || null,
      fechaFin: req.query.fecha_fin || null,
      proveedorId: req.query.proveedor_id ? Number(req.query.proveedor_id) : null,
      dias: req.query.dias ? Number(req.query.dias) : 30,
    };

    const data = await prisma.$queryRaw(buildQuery(params));
    res.json({ data: normalizeReportRows(data) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reporte admin_pro', details: error.message });
  }
};
