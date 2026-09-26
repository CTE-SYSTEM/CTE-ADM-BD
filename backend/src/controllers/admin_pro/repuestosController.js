import prisma from '../../app/prismaClient.js';

// 2. Monitoreo de repuestos con historial y proveedor
export const getRepuestosAvanzado = async (req, res) => {
  try {
    const repuestos = await prisma.repuestos.findMany({
      include: {
        categoria: true,
        proveedor: true,
        ordenes_detalles: true
      }
    });
    res.json({ data: repuestos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener repuestos avanzados', details: error.message });
  }
};
export const updateRepuestoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, costo_individual, porcentaje_de_ganacia, activo, descontinuada } = req.body;

    const data = {};
    if (nombre !== undefined) data.nombre = String(nombre);
    if (descripcion !== undefined) data.descripcion = String(descripcion);
    if (costo_individual !== undefined) data.costo_individual = Number(costo_individual);
    if (porcentaje_de_ganacia !== undefined) data.porcentaje_de_ganacia = Number(porcentaje_de_ganacia);
    if (activo !== undefined) data.activo = Boolean(activo);
    if (descontinuada !== undefined) data.descontinuada = Boolean(descontinuada);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    const repuestoId = Number(id);
    if (!Number.isInteger(repuestoId) || repuestoId <= 0) return res.status(400).json({ error: 'ID de repuesto inválido' });
    if (data.costo_individual !== undefined && (!Number.isFinite(data.costo_individual) || data.costo_individual < 0)) {
      return res.status(400).json({ error: 'El costo individual debe ser mayor o igual a cero' });
    }
    if (data.porcentaje_de_ganacia !== undefined && (!Number.isFinite(data.porcentaje_de_ganacia) || data.porcentaje_de_ganacia < 0)) {
      return res.status(400).json({ error: 'El porcentaje de ganancia debe ser mayor o igual a cero' });
    }
    const repuesto = await prisma.repuestos.update({
      where: { id_repuesto: repuestoId },
      data,
      include: { categoria: true, proveedor: true },
    });

    res.json({ data: repuesto });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Repuesto no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar el repuesto', details: error.message });
  }
};
