import prisma from '../../app/prismaClient.js';

const normalizeText = (value = '') => String(value).trim().replace(/\s+/g, ' ');

export const getTiposRepuesto = async (req, res) => {
  try {
    const tipos = await prisma.categorias_Repuestos.findMany({
      include: { _count: { select: { repuestos: true } } },
      orderBy: [{ nombre_tipo: 'asc' }, { electronico: 'asc' }],
    });

    res.json({ success: true, data: tipos });
  } catch (error) {
    console.error('Error en getTiposRepuesto:', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener tipos de repuesto', details: error.message });
  }
};

export const createTipoRepuesto = async (req, res) => {
  try {
    const nombre_tipo = normalizeText(req.body.nombre_tipo);
    const electronico = normalizeText(req.body.electronico);

    if (!nombre_tipo) {
      return res.status(400).json({ success: false, error: 'El nombre del tipo de repuesto es obligatorio' });
    }

    const existente = await prisma.categorias_Repuestos.findFirst({
      where: {
        nombre_tipo: { equals: nombre_tipo, mode: 'insensitive' },
        electronico: electronico ? { equals: electronico, mode: 'insensitive' } : undefined,
      },
    });

    if (existente) {
      return res.status(409).json({ success: false, error: 'Ya existe un tipo de repuesto con esos datos' });
    }

    const tipo = await prisma.categorias_Repuestos.create({
      data: { nombre_tipo, electronico: electronico || null },
      include: { _count: { select: { repuestos: true } } },
    });

    res.status(201).json({ success: true, data: tipo });
  } catch (error) {
    console.error('Error en createTipoRepuesto:', error.message);
    res.status(500).json({ success: false, error: 'Error al crear tipo de repuesto', details: error.message });
  }
};

export const updateTipoRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const nombre_tipo = normalizeText(req.body.nombre_tipo);
    const electronico = normalizeText(req.body.electronico);

    if (!nombre_tipo) {
      return res.status(400).json({ success: false, error: 'El nombre del tipo de repuesto es obligatorio' });
    }

    const tipo = await prisma.categorias_Repuestos.update({
      where: { id_tipo_repuesto: Number(id) },
      data: { nombre_tipo, electronico: electronico || null },
      include: { _count: { select: { repuestos: true } } },
    });

    res.json({ success: true, data: tipo });
  } catch (error) {
    console.error('Error en updateTipoRepuesto:', error.message);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Tipo de repuesto no encontrado' });
    }
    res.status(500).json({ success: false, error: 'Error al actualizar tipo de repuesto', details: error.message });
  }
};

export const deleteTipoRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const usados = await prisma.repuestos.count({
      where: { tipo_repuesto_id: Number(id) },
    });

    if (usados > 0) {
      return res.status(409).json({
        success: false,
        error: 'No se puede eliminar: hay repuestos unidos a este tipo',
      });
    }

    await prisma.categorias_Repuestos.delete({
      where: { id_tipo_repuesto: Number(id) },
    });

    res.json({ success: true, message: 'Tipo de repuesto eliminado' });
  } catch (error) {
    console.error('Error en deleteTipoRepuesto:', error.message);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Tipo de repuesto no encontrado' });
    }
    res.status(500).json({ success: false, error: 'Error al eliminar tipo de repuesto', details: error.message });
  }
};
