// backend/src/controllers/Secretaria/equiposController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todos los equipos incluyendo la información del cliente asociado
 */
export const getEquipos = async (req, res) => {
  try {
    const equipos = await prisma.equipos.findMany({
      include: {
        cliente: true // Esto une la tabla clientes para mostrar el nombre en la tabla
      },
      orderBy: {
        id_equipo: 'desc'
      }
    });

    // Envolvemos en { data: ... } para consistencia con el frontend
    res.json({ data: equipos });
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: 'Error interno al obtener el listado de equipos' });
  }
};

/**
 * Crear un equipo asociado a un cliente
 */
export const createEquipo = async (req, res) => {
  try {
    const { cliente_id, tipo, marca, modelo, numero_serie } = req.body;

    // Validación de ID de cliente (Prisma necesita un Int)
    if (!cliente_id) {
      return res.status(400).json({ error: 'El ID del cliente es obligatorio' });
    }

    const equipo = await prisma.equipos.create({
      data: {
        cliente_id: parseInt(cliente_id),
        tipo,
        marca,
        modelo,
        numero_serie
      },
      include: {
        cliente: true // Devolvemos el objeto completo para actualizar la tabla sin recargar todo
      }
    });

    res.status(201).json({ data: equipo });
  } catch (error) {
    console.error('Error al crear equipo:', error);
    res.status(500).json({ error: 'Error al registrar el equipo en la base de datos' });
  }
};

/**
 * Actualizar datos de un equipo
 */
export const updateEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente_id, tipo, marca, modelo, numero_serie } = req.body;

    const equipo = await prisma.equipos.update({
      where: { id_equipo: parseInt(id) },
      data: {
        cliente_id: parseInt(cliente_id),
        tipo,
        marca,
        modelo,
        numero_serie
      },
      include: {
        cliente: true
      }
    });

    res.json({ data: equipo });
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.status(500).json({ error: 'Error interno al actualizar equipo' });
  }
};

/**
 * Eliminar un equipo
 */
export const deleteEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.equipos.delete({
      where: { id_equipo: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'El registro ya no existe' });
    }
    res.status(500).json({ error: 'No se pudo eliminar el equipo' });
  }
};