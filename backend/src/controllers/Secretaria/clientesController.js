// backend/src/controllers/Secretaria/clientesController.js
import prisma from '../../app/prismaClient.js';

/** Obtener todos los clientes activos */
export const getClientes = async (req, res) => {
  try {
    const clientes = await prisma.clientes.findMany({
      where: { activo: true },
      orderBy: { id_cliente: 'desc' }
    });
    res.json({ data: clientes });
  } catch (error) {
    console.error('❌ Error en getClientes:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener clientes', details: error.message });
  }
};

/** Crear un nuevo cliente */
export const createCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo, contacto_secundario } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!telefono) return res.status(400).json({ error: 'El teléfono es obligatorio' });

    const resultado = await prisma.clientes.create({
      data: {
        nombre,
        telefono,
        direccion,
        correo,
        contacto_secundario,
        activo: true
      }
    });
    res.status(201).json({ data: resultado });
  } catch (error) {
    console.error('❌ Error en createCliente:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al registrar el cliente', details: error.message });
  }
};

/** Actualizar un cliente existente */
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, direccion, correo, contacto_secundario } = req.body;

    const resultado = await prisma.clientes.update({
      where: { id_cliente: parseInt(id) },
      data: {
        nombre,
        telefono,
        direccion,
        correo,
        contacto_secundario
      }
    });

    res.json({ data: resultado });
  } catch (error) {
    console.error('❌ Error en updateCliente:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar el cliente', details: error.message });
  }
};

/** Borrado lógico (Desactivar) */
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.clientes.update({
      where: { id_cliente: parseInt(id) },
      data: { activo: false }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error en deleteCliente:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.status(500).json({ error: 'Error al desactivar el cliente', details: error.message });
  }
};