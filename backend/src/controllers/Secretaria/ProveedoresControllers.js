// controllers/Secretaria/ProveedoresControllers.js
import prisma from '../../app/prismaClient.js';

export const getProveedores = async (req, res) => {
  try {
    const proveedores = await prisma.proveedores.findMany({
      where: { descontinuada: false },
      orderBy: { id_proveedor: 'desc' },
    });

    res.json({ data: proveedores });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores', details: error.message });
  }
};

export const getProveedorById = async (req, res) => {
  try {
    const proveedor = await prisma.proveedores.findUnique({
      where: { id_proveedor: Number(req.params.id) },
      include: { compras: true },
    });

    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json({ data: proveedor });
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ error: 'Error al obtener proveedor', details: error.message });
  }
};

export const createProveedor = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo, web, notas } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const proveedor = await prisma.proveedores.create({
      data: { nombre, telefono, direccion, correo, web, notas },
    });

    res.status(201).json({ data: proveedor });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor', details: error.message });
  }
};

export const updateProveedor = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo, web, notas } = req.body;

    const proveedor = await prisma.proveedores.update({
      where: { id_proveedor: Number(req.params.id) },
      data: { nombre, telefono, direccion, correo, web, notas },
    });

    res.json({ data: proveedor });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar proveedor', details: error.message });
  }
};

export const deleteProveedor = async (req, res) => {
  try {
    await prisma.proveedores.update({
      where: { id_proveedor: Number(req.params.id) },
      data: { descontinuada: true }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    res.status(500).json({ error: 'Error al desactivar proveedor' });
  }
};
