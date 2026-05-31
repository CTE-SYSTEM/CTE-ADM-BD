import prisma from '../../app/prismaClient.js';

// Historial de uso de un repuesto
export const getHistorialRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    // Buscar todas las órdenes donde se usó este repuesto
    const usos = await prisma.ordenes_Repuestos.findMany({
      where: { repuesto_id: Number(id) },
      include: {
        orden: {
          include: {
            diagnostico: {
              include: { equipo: true }
            }
          }
        }
      },
      orderBy: { id_detalle_repuesto: 'desc' }
    });
    res.json({ data: usos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial de repuesto', details: error.message });
  }
};
// Historial de movimientos de un equipo
export const getHistorialEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    // Buscar todos los diagnósticos y órdenes asociadas al equipo
    const diagnosticos = await prisma.diagnosticos.findMany({
      where: { equipo_id: Number(id) },
      include: {
        equipo: { include: { cliente: true } },
        ordenes: { include: { tecnico: true, repuestos_usados: true, facturas: true }, orderBy: { id_orden: 'desc' } },
        tecnico: true
      },
      orderBy: { fecha_hora: 'desc' }
    });
    res.json({ data: diagnosticos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial de equipo', details: error.message });
  }
};
