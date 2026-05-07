// backend/src/controllers/Secretaria/RepuestoControllers.js
import prisma from '../../app/prismaClient.js';

export const getRepuestos = async (req, res) => {
  try {
    // Obtener repuestos directamente de la tabla
    const repuestos = await prisma.repuestos.findMany({
      where: { activo: true },
      orderBy: { id_repuesto: 'desc' }
    });
    res.json({ success: true, data: repuestos });
  } catch (error) {
    console.error('❌ Error en getRepuestos:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, message: "Error al obtener repuestos", details: error.message });
  }
};

export const createRepuesto = async (req, res) => {
  try {
    const { nombre, descripcion, categoria_nombre, electronico, costo_individual, porcentaje_de_ganacia } = req.body;

    const repuesto = await prisma.repuestos.create({
      data: {
        nombre,
        descripcion,
        costo_individual: Number(costo_individual) || 0,
        porcentaje_de_ganacia: Number(porcentaje_de_ganacia) || 0,
        activo: true
      }
    });

    res.status(201).json({ success: true, data: repuesto });
  } catch (error) {
    console.error('❌ Error en createRepuesto:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoria_nombre, electronico, costo_individual, porcentaje_de_ganacia } = req.body;

    const repuesto = await prisma.repuestos.update({
      where: { id_repuesto: parseInt(id) },
      data: {
        nombre,
        descripcion,
        costo_individual: Number(costo_individual) || 0,
        porcentaje_de_ganacia: Number(porcentaje_de_ganacia) || 0
      }
    });

    res.json({ success: true, data: repuesto });
  } catch (error) {
    console.error('❌ Error en updateRepuesto:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: "Repuesto no encontrado" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.repuestos.update({
      where: { id_repuesto: parseInt(id) },
      data: { activo: false }
    });
    res.json({ success: true, message: "Repuesto marcado como inactivo" });
  } catch (error) {
    console.error('❌ Error en deleteRepuesto:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: "Repuesto no encontrado" });
    }
    res.status(500).json({ success: false, error: "Error al procesar la solicitud", details: error.message });
  }
};