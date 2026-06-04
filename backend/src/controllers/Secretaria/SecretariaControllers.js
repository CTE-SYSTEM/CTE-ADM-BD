// backend/src/controllers/Secretaria/SecretariaControllers.js
import { Prisma } from '@prisma/client';
import prisma from '../../app/prismaClient.js';

const DASHBOARD_PERIODOS = new Set(['all', 'week', 'month', 'year']);

export const getDashboardStats = async (req, res) => {
  try {
    const periodoSolicitado = String(req.query.periodo || 'all').toLowerCase();
    const periodo = DASHBOARD_PERIODOS.has(periodoSolicitado) ? periodoSolicitado : 'all';
    const [row] = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_secretaria_dashboard(${periodo})`);
    const dashboard = row?.data || {};

    res.json({
      success: true,
      data: dashboard,
      stats: dashboard.stats || {},
      recentOrders: dashboard.recentOrders || [],
    });
  } catch (error) {
    console.error('Error en Dashboard Secretaria:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo cargar la informacion del dashboard',
      details: error.message,
    });
  }
};

export const getOrdersByStatus = async (req, res) => {
  try {
    const statusCounts = await prisma.ordenes.groupBy({
      by: ['estado'],
      _count: {
        id_orden: true,
      },
    });

    res.json({ success: true, data: statusCounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
