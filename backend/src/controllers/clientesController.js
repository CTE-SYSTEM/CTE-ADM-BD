import prisma from '../app/prismaClient.js';

export const getClientes = async (req, res) => {
  try {
    const clientes = await prisma.clientes.findMany({
      orderBy: { id_cliente: 'asc' },
    });
    res.json({ ok: true, data: clientes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

export const createCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo, contacto_secundario } = req.body;
    const cliente = await prisma.clientes.create({
      data: { nombre, telefono, direccion, correo, contacto_secundario },
    });
    res.status(201).json({ ok: true, data: cliente });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo, contacto_secundario } = req.body;
    const cliente = await prisma.clientes.update({
      where: { id_cliente: Number(req.params.id) },
      data: { nombre, telefono, direccion, correo, contacto_secundario },
    });
    res.json({ ok: true, data: cliente });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    await prisma.clientes.delete({ where: { id_cliente: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};
