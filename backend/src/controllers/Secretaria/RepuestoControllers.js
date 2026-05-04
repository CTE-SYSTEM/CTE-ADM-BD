// backend/src/controllers/Secretaria/RepuestoControllers.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const findOrCreateCategoria = async (categoria_nombre, electronico) => {
  const nombre_tipo = categoria_nombre || "General";
  const categoriaExistente = await prisma.categorias_Repuestos.findFirst({
    where: { nombre_tipo },
  });

  if (categoriaExistente) {
    return prisma.categorias_Repuestos.update({
      where: { id_tipo_repuesto: categoriaExistente.id_tipo_repuesto },
      data: { electronico },
    });
  }

  return prisma.categorias_Repuestos.create({
    data: { nombre_tipo, electronico },
  });
};

export const createRepuesto = async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion, 
      categoria_nombre, 
      electronico, 
      costo_individual, 
      porcentaje_de_ganacia 
    } = req.body;

    const electronicoTxt = String(electronico || "").trim();

    const categoria = await findOrCreateCategoria(categoria_nombre, electronicoTxt);

    const nuevoRepuesto = await prisma.repuestos.create({
      data: {
        nombre,
        descripcion,
        costo_individual: Number(costo_individual) || 0,
        porcentaje_de_ganacia: Number(porcentaje_de_ganacia) || 0,
        // El campo en tu schema es tipo_repuesto_id
        tipo_repuesto_id: categoria.id_tipo_repuesto
      },
      include: { categoria: true }
    });

    res.status(201).json({ success: true, data: nuevoRepuesto });
  } catch (error) {
    console.error("Error en createRepuesto:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      categoria_nombre, 
      electronico, 
      costo_individual, 
      porcentaje_de_ganacia 
    } = req.body;

    const electronicoTxt = String(electronico || "").trim();

    const categoria = await findOrCreateCategoria(categoria_nombre, electronicoTxt);

    const repuestoActualizado = await prisma.repuestos.update({
      where: { id_repuesto: parseInt(id) },
      data: {
        nombre,
        descripcion,
        costo_individual: Number(costo_individual) || 0,
        porcentaje_de_ganacia: Number(porcentaje_de_ganacia) || 0,
        tipo_repuesto_id: categoria.id_tipo_repuesto
      },
      include: { categoria: true }
    });

    res.json({ success: true, data: repuestoActualizado });
  } catch (error) {
    console.error("Error en updateRepuesto:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRepuestos = async (req, res) => {
  try {
    const repuestos = await prisma.repuestos.findMany({
      include: { categoria: true },
      orderBy: { id_repuesto: 'desc' }
    });
    res.json({ success: true, data: repuestos });
  } catch (error) {
    console.error("Error en getRepuestos:", error);
    res.status(500).json({ success: false, message: "Error al obtener repuestos" });
  }
};

export const deleteRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.repuestos.delete({ 
      where: { id_repuesto: parseInt(id) } 
    });
    res.json({ success: true, message: "Repuesto eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteRepuesto:", error);
    res.status(500).json({ success: false, error: "No se puede eliminar el repuesto porque está asociado a órdenes o compras." });
  }
};
