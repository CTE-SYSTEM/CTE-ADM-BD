import prisma from '../app/prismaClient.js';

const ensureCategoria = async (nombre_tipo) => {
  const nombre = nombre_tipo?.trim() || 'General';
  const existing = await prisma.categorias_Repuestos.findFirst({
    where: { nombre_tipo: nombre },
  });
  if (existing) return existing;
  return prisma.categorias_Repuestos.create({
    data: { nombre_tipo: nombre, electronico: 'Si' },
  });
};

export const getRepuestos = async (req, res) => {
  try {
    const repuestos = await prisma.repuestos.findMany({
      include: { categoria: true },
      orderBy: { id_repuesto: 'asc' },
    });
    res.json({ ok: true, data: repuestos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener repuestos' });
  }
};

export const createRepuesto = async (req, res) => {
  try {
    const { nombre, descripcion, costo_individual, porcentaje_de_ganacia, categoria_nombre } = req.body;
    const categoria = await ensureCategoria(categoria_nombre);
    const repuesto = await prisma.repuestos.create({
      data: {
        tipo_repuesto_id: categoria.id_tipo_repuesto,
        nombre,
        descripcion,
        costo_individual: costo_individual === '' ? null : costo_individual,
        porcentaje_de_ganacia: porcentaje_de_ganacia === '' ? null : porcentaje_de_ganacia,
      },
    });
    res.status(201).json({ ok: true, data: repuesto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear repuesto' });
  }
};

export const updateRepuesto = async (req, res) => {
  try {
    const { nombre, descripcion, costo_individual, porcentaje_de_ganacia, categoria_nombre } = req.body;
    const categoria = await ensureCategoria(categoria_nombre);
    const repuesto = await prisma.repuestos.update({
      where: { id_repuesto: Number(req.params.id) },
      data: {
        tipo_repuesto_id: categoria.id_tipo_repuesto,
        nombre,
        descripcion,
        costo_individual: costo_individual === '' ? null : costo_individual,
        porcentaje_de_ganacia: porcentaje_de_ganacia === '' ? null : porcentaje_de_ganacia,
      },
    });
    res.json({ ok: true, data: repuesto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar repuesto' });
  }
};

export const deleteRepuesto = async (req, res) => {
  try {
    await prisma.repuestos.delete({ where: { id_repuesto: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar repuesto' });
  }
};
