// backend/src/controllers/Secretaria/ClientesControllers.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getClientes = async (req, res) => {
  try {
    const clientes = await prisma.clientes.findMany({
      orderBy: { id_cliente: 'desc' }
    });
    // Se mantiene la estructura { data: ... } que espera tu frontend
    res.json({ data: { data: clientes } }); 
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

export const createCliente = async (req, res) => {
  try {
    const nuevoCliente = await prisma.clientes.create({
      data: {
        nombre: req.body.nombre,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
        correo: req.body.correo,
        contacto_secundario: req.body.contacto_secundario
      }
    });
    // Es vital devolver el objeto para que el frontend obtenga el ID y navegue a equipos
    res.status(201).json({ data: { data: nuevoCliente } });
  } catch (error) {
    res.status(400).json({ error: 'Error al crear cliente', details: error.message });
  }
};

export const updateCliente = async (req, res) => {
  const { id } = req.params;
  try {
    const actualizado = await prisma.clientes.update({
      where: { id_cliente: parseInt(id) },
      data: req.body
    });
    res.json({ data: { data: actualizado } });
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar cliente' });
  }
};

export const deleteCliente = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.clientes.delete({
      where: { id_cliente: parseInt(id) }
    });
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: 'No se puede eliminar el cliente (podría tener equipos asociados)' });
  }
};