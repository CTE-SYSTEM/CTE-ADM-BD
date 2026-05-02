import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createRepuesto = async (req, res) => {
  try {
    const { nombre, descripcion, categoria_nombre, electronico, costo_individual, porcentaje_de_ganacia } = req.body;

    // CORRECCIÓN: Upsert asegura que el tipo de electrónico se asocie correctamente
    const categoria = await prisma.tipo_repuesto.upsert({
      where: { nombre_tipo: categoria_nombre },
      update: { electronico: electronico },
      create: { nombre_tipo: categoria_nombre, electronico: electronico }
    });

    const nuevoRepuesto = await prisma.repuesto.create({
      data: {
        nombre,
        descripcion,
        costo_individual: parseFloat(costo_individual),
        porcentaje_de_ganacia: parseFloat(porcentaje_de_ganacia),
        id_tipo_repuesto: categoria.id_tipo_repuesto
      },
      include: { categoria: true }
    });

    res.status(201).json({ success: true, data: nuevoRepuesto });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoria_nombre, electronico, costo_individual, porcentaje_de_ganacia } = req.body;

    const categoria = await prisma.tipo_repuesto.upsert({
      where: { nombre_tipo: categoria_nombre },
      update: { electronico: electronico },
      create: { nombre_tipo: categoria_nombre, electronico: electronico }
    });

    const repuestoActualizado = await prisma.repuesto.update({
      where: { id_repuesto: parseInt(id) },
      data: {
        nombre,
        descripcion,
        costo_individual: parseFloat(costo_individual),
        porcentaje_de_ganacia: parseFloat(porcentaje_de_ganacia),
        id_tipo_repuesto: categoria.id_tipo_repuesto
      },
      include: { categoria: true }
    });

    res.json({ success: true, data: repuestoActualizado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRepuestos = async (req, res) => {
  try {
    const repuestos = await prisma.repuesto.findMany({
      include: { categoria: true },
      orderBy: { id_repuesto: 'desc' }
    });
    res.json({ success: true, data: repuestos });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al obtener datos" });
  }
};

export const deleteRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.repuesto.delete({ where: { id_repuesto: parseInt(id) } });
    res.json({ success: true, message: "Eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};