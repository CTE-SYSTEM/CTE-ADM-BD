import prisma from '../../app/prismaClient.js';

// 4. Monitoreo de facturas
export const getFacturasAvanzado = async (req, res) => {
  try {
    const facturas = await prisma.facturas.findMany({
      include: {
        orden: {
          include: {
            diagnostico: {
              include: {
                equipo: true
              }
            }
          }
        }
      }
    });
    res.json({ data: facturas });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener facturas avanzadas', details: error.message });
  }
};
