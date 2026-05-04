// backend/src/controllers/Secretaria/clientesController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todos los clientes
 */
export const getClientes = async (req, res) => {
  try {
    const clientes = await prisma.clientes.findMany({
      orderBy: {
        id_cliente: 'desc', // Opcional: mostrar los más recientes primero
      },
    });
    
    // Devolvemos el array envuelto en data para que coincida con tu frontend
    res.json({ data: clientes });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

/**
 * Crear un nuevo cliente
 */
export const createCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo, contacto_secundario } = req.body;

    // Validación básica
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const nuevoCliente = await prisma.clientes.create({
      data: {
        nombre,
        telefono,
        direccion,
        correo,
        contacto_secundario,
      },
    });

    // IMPORTANTE: Devolvemos el objeto dentro de 'data' para que el frontend 
    // pueda leer response.data.data.id_cliente al "Guardar y Continuar"
    res.status(201).json({ data: nuevoCliente });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ 
      error: 'Error al intentar registrar el cliente',
      details: error.message 
    });
  }
};

/**
 * Actualizar un cliente existente
 */
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, direccion, correo, contacto_secundario } = req.body;

    const clienteActualizado = await prisma.clientes.update({
      where: { 
        id_cliente: parseInt(id) 
      },
      data: {
        nombre,
        telefono,
        direccion,
        correo,
        contacto_secundario,
      },
    });

    res.json({ data: clienteActualizado });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
};

/**
 * Eliminar un cliente
 */
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.clientes.delete({
      where: { 
        id_cliente: parseInt(id) 
      },
    });

    // 204 No Content es el estándar para eliminaciones exitosas
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'El cliente ya no existe' });
    }
    // Error de clave foránea (si el cliente tiene equipos asociados)
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'No se puede eliminar el cliente porque tiene equipos o registros asociados' 
      });
    }
    res.status(500).json({ error: 'Error al eliminar el cliente' });
  }
};