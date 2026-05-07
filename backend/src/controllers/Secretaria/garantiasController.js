// backend/src/controllers/Secretaria/garantiasController.js
import prisma from '../../app/prismaClient.js';

/**
 * Obtener todas las garantías con la información de la factura y el cliente
 */
export const getGarantias = async (req, res) => {
  try {
    const garantias = await prisma.garantias.findMany({
      include: {
        factura: {
          include: {
            orden: {
              include: {
                diagnostico: {
                  include: {
                    equipo: {
                      include: { cliente: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        fecha_vencimiento: 'asc'
      }
    });
    res.json({ data: garantias });
  } catch (error) {
    console.error('Error al obtener garantias:', error);
    res.status(500).json({ error: 'Error al obtener el historial de garantías' });
  }
};

/**
 * Crear una garantía vinculada a una factura
 */
export const createGarantia = async (req, res) => {
  try {
    const { factura_id, condiciones, duracion_meses } = req.body;

    // Calculamos las fechas automáticamente
    const fecha_inicio = new Date();
    const fecha_vencimiento = new Date();
    fecha_vencimiento.setMonth(fecha_vencimiento.getMonth() + parseInt(duracion_meses));

    const nuevaGarantia = await prisma.garantias.create({
      data: {
        factura_id: parseInt(factura_id),
        condiciones,
        duracion_meses: parseInt(duracion_meses),
        fecha_inicio,
        fecha_vencimiento
      },
      include: {
        factura: true
      }
    });

    res.status(201).json({ 
      message: 'Garantía generada exitosamente',
      data: nuevaGarantia 
    });
  } catch (error) {
    console.error('Error al crear garantia:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'La factura especificada no existe' });
    }
    res.status(500).json({ error: 'No se pudo registrar la garantía' });
  }
};

/**
 * Obtener garantía por ID de factura (útil para la impresión del ticket final)
 */
export const getGarantiaByFactura = async (req, res) => {
  try {
    const { facturaId } = req.params;
    const garantia = await prisma.garantias.findFirst({
      where: { factura_id: parseInt(facturaId) }
    });

    if (!garantia) {
      return res.status(404).json({ error: 'No hay garantía registrada para esta factura' });
    }

    res.json({ data: garantia });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar la garantía' });
  }
};