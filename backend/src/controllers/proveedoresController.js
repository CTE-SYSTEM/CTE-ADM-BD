import prisma from '../app/prismaClient.js';

export const getProveedores = async (req, res) => {
  try {
    const proveedores = await prisma.proveedores.findMany({
      orderBy: { id_proveedor: 'asc' },
    });
    res.json({ ok: true, data: proveedores });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

export const createProveedor = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo, web, notas } = req.body;
    const proveedor = await prisma.proveedores.create({
      data: { nombre, telefono, direccion, correo, web, notas },
    });
    res.status(201).json({ ok: true, data: proveedor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

export const updateProveedor = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo, web, notas } = req.body;
    const proveedor = await prisma.proveedores.update({
      where: { id_proveedor: Number(req.params.id) },
      data: { nombre, telefono, direccion, correo, web, notas },
    });
    res.json({ ok: true, data: proveedor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

export const deleteProveedor = async (req, res) => {
  try {
    await prisma.proveedores.delete({ where: { id_proveedor: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};
