// backend/src/controllers/Secretaria/SecretariaControllers.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getDashboardStats = async (req, res) => {
  try {
    // Ejecutamos las consultas en paralelo para mejorar el rendimiento
    const [
      totalClientes,
      equiposEnTaller,
      diagnosticosPendientes,
      ordenesRecientes,
      resumenFacturacion
    ] = await Promise.all([
      // 1. Total de clientes registrados
      prisma.clientes.count(),

      // 2. Equipos que están actualmente en el taller (Estado != FINALIZADO/ENTREGADO)
      prisma.ordenes.count({
        where: {
          estado: {
            notIn: ['FINALIZADO', 'ENTREGADO']
          }
        }
      }),

      // 3. Diagnósticos que aún no han sido revisados por técnicos
      prisma.diagnosticos.count({
        where: {
          estado_del_diagnostico: 'PENDIENTE'
        }
      }),

      // 4. Últimas 5 órdenes registradas para la tabla de actividad
      prisma.ordenes.findMany({
        take: 5,
        orderBy: { fecha_ingreso: 'desc' },
        include: {
          diagnostico: {
            include: {
              equipo: {
                include: { cliente: true }
              }
            }
          }
        }
      }),

      // 5. Sumatoria de ingresos del mes actual (Opcional para Dashboard)
      prisma.facturas.aggregate({
        _sum: {
          total: true
        },
        where: {
          fecha_emision: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalClientes,
        equiposEnTaller,
        diagnosticosPendientes,
        ingresosMes: resumenFacturacion._sum.total || 0
      },
      recentOrders: ordenesRecientes
    });
  } catch (error) {
    console.error("Error en Dashboard Secretaria:", error);
    res.status(500).json({ 
      success: false, 
      message: "No se pudo cargar la información del dashboard" 
    });
  }
};

/**
 * Obtener flujo de estados para un gráfico de barras/pastel
 */
export const getOrdersByStatus = async (req, res) => {
  try {
    const statusCounts = await prisma.ordenes.groupBy({
      by: ['estado'],
      _count: {
        id_orden: true
      }
    });

    res.json({ success: true, data: statusCounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};