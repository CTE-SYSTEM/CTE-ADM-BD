import { Prisma } from '@prisma/client';
import prisma from '../../app/prismaClient.js';

const normalizeRows = (rows) =>
  JSON.parse(JSON.stringify(rows, (_, value) => (typeof value === 'bigint' ? Number(value) : value)));

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getYear = (req) => {
  const now = new Date();
  const year = toNumber(req.query.year, now.getFullYear());
  return Math.min(Math.max(year, 2000), now.getFullYear() + 1);
};

export const getProductividadAdmin = async (req, res) => {
  try {
    const year = getYear(req);
    const yearsBack = Math.min(Math.max(toNumber(req.query.years_back, 4), 1), 10);

    const [monthlyRows, yearlyRows] = await Promise.all([
      prisma.$queryRaw(Prisma.sql`SELECT * FROM admin_pro.productividad_mensual(CAST(${year} AS INT))`),
      prisma.$queryRaw(
        Prisma.sql`SELECT * FROM admin_pro.productividad_anual(CAST(${year} AS INT), CAST(${yearsBack} AS INT))`
      ),
    ]);

    res.json({
      data: {
        year,
        monthly: normalizeRows(monthlyRows),
        yearly: normalizeRows(yearlyRows),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productividad admin', details: error.message });
  }
};

export const getGananciasAdmin = async (req, res) => {
  try {
    const now = new Date();
    const fechaInicio = req.query.fecha_inicio || `${now.getFullYear()}-01-01`;
    const fechaFin = req.query.fecha_fin || `${now.getFullYear()}-12-31`;
    const detalleLimite = Math.min(Math.max(toNumber(req.query.detalle_limite, 12), 5), 100);

    const [monthlyRows, detalleRows] = await Promise.all([
      prisma.$queryRaw(
        Prisma.sql`SELECT * FROM admin_pro.ganancias_mensuales(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`
      ),
      prisma.$queryRaw(
        Prisma.sql`SELECT * FROM admin_pro.ganancias_detalle(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE), CAST(${detalleLimite} AS INT))`
      ),
    ]);

    const monthly = normalizeRows(monthlyRows);
    const totals = monthly.reduce(
      (acc, item) => {
        acc.ingresos += Number(item.ingresos) || 0;
        acc.gastos += Number(item.gastos) || 0;
        acc.costo_repuestos_usados += Number(item.costo_repuestos_usados) || 0;
        acc.ganancia_neta += Number(item.ganancia_neta) || 0;
        acc.margen_servicio += Number(item.margen_servicio) || 0;
        acc.facturas += Number(item.facturas) || 0;
        acc.compras += Number(item.compras) || 0;
        return acc;
      },
      {
        ingresos: 0,
        gastos: 0,
        costo_repuestos_usados: 0,
        ganancia_neta: 0,
        margen_servicio: 0,
        facturas: 0,
        compras: 0,
      }
    );

    res.json({
      data: {
        fechaInicio,
        fechaFin,
        detalleLimite,
        totals,
        monthly,
        detail: normalizeRows(detalleRows),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ganancias admin', details: error.message });
  }
};
