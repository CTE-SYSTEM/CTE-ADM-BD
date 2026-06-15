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

  equipos_cliente: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`
      SELECT
        c.id_cliente,
        c.nombre::TEXT AS cliente,
        c.telefono::TEXT AS telefono,
        COUNT(DISTINCT CASE
          WHEN (${fechaInicio}::DATE IS NULL AND ${fechaFin}::DATE IS NULL)
            OR d.fecha_hora::DATE BETWEEN COALESCE(${fechaInicio}::DATE, d.fecha_hora::DATE) AND COALESCE(${fechaFin}::DATE, d.fecha_hora::DATE)
            OR o.fecha_ingreso::DATE BETWEEN COALESCE(${fechaInicio}::DATE, o.fecha_ingreso::DATE) AND COALESCE(${fechaFin}::DATE, o.fecha_ingreso::DATE)
          THEN e.id_equipo
        END)::INT AS total_equipos,
        COUNT(DISTINCT CASE
          WHEN (${fechaInicio}::DATE IS NULL OR d.fecha_hora::DATE >= ${fechaInicio}::DATE)
            AND (${fechaFin}::DATE IS NULL OR d.fecha_hora::DATE <= ${fechaFin}::DATE)
          THEN d.id_diagnostico
        END)::INT AS total_diagnosticos,
        COUNT(DISTINCT CASE
          WHEN (${fechaInicio}::DATE IS NULL OR o.fecha_ingreso::DATE >= ${fechaInicio}::DATE)
            AND (${fechaFin}::DATE IS NULL OR o.fecha_ingreso::DATE <= ${fechaFin}::DATE)
          THEN o.id_orden
        END)::INT AS total_ordenes,
        MAX(CASE
          WHEN (${fechaInicio}::DATE IS NULL OR COALESCE(o.fecha_ingreso, d.fecha_hora)::DATE >= ${fechaInicio}::DATE)
            AND (${fechaFin}::DATE IS NULL OR COALESCE(o.fecha_ingreso, d.fecha_hora)::DATE <= ${fechaFin}::DATE)
          THEN COALESCE(o.fecha_ingreso, d.fecha_hora)
        END) AS ultima_visita
      FROM "Clientes" c
      LEFT JOIN "Equipos" e ON e.cliente_id = c.id_cliente
      LEFT JOIN "Diagnosticos" d ON d.equipo_id = e.id_equipo
      LEFT JOIN "Ordenes" o ON o.diagnostico_id = d.id_diagnostico
      GROUP BY c.id_cliente, c.nombre, c.telefono
      HAVING ${fechaInicio}::DATE IS NULL AND ${fechaFin}::DATE IS NULL
        OR COUNT(DISTINCT CASE
          WHEN (${fechaInicio}::DATE IS NULL OR d.fecha_hora::DATE >= ${fechaInicio}::DATE)
            AND (${fechaFin}::DATE IS NULL OR d.fecha_hora::DATE <= ${fechaFin}::DATE)
          THEN d.id_diagnostico
        END) > 0
        OR COUNT(DISTINCT CASE
          WHEN (${fechaInicio}::DATE IS NULL OR o.fecha_ingreso::DATE >= ${fechaInicio}::DATE)
            AND (${fechaFin}::DATE IS NULL OR o.fecha_ingreso::DATE <= ${fechaFin}::DATE)
          THEN o.id_orden
        END) > 0
      ORDER BY ultima_visita DESC NULLS LAST, total_equipos DESC, cliente ASC
    `,

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
