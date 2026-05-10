// backend/src/controllers/Secretaria/equiposController.js
import prisma from '../../app/prismaClient.js';

const toPascalCase = (value) => {
  if (!value || typeof value !== 'string') return value;

  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getEquipos = async (req, res) => {
  try {
    const equipos = await prisma.equipos.findMany({
      include: { cliente: true }
    });
    res.json({ data: equipos });
  } catch (error) {
    console.error('❌ Error en getEquipos:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener equipos', details: error.message });
  }
};

export const createEquipo = async (req, res) => {
  try {
    const { cliente_id, tipo, marca, modelo, numero_serie } = req.body;
    if (!cliente_id) return res.status(400).json({ error: 'El ID del cliente es obligatorio' });

    const equipo = await prisma.equipos.create({
      data: {
        cliente_id: parseInt(cliente_id),
        tipo: toPascalCase(tipo),
        marca,
        modelo,
        numero_serie
      },
      include: { cliente: true }
    });
    res.status(201).json({ data: equipo });
  } catch (error) {
    console.error('❌ Error en createEquipo:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al registrar el equipo', details: error.message });
  }
};

export const updateEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente_id, tipo, marca, modelo, numero_serie } = req.body;

    const equipo = await prisma.equipos.update({
      where: { id_equipo: parseInt(id) },
      data: {
        cliente_id: cliente_id ? parseInt(cliente_id) : undefined,
        tipo: toPascalCase(tipo),
        marca,
        modelo,
        numero_serie
      },
      include: { cliente: true }
    });

    res.json({ data: equipo });
  } catch (error) {
    console.error('❌ Error en updateEquipo:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar equipo', details: error.message });
  }
};

export const deleteEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.equipos.delete({
      where: { id_equipo: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error en deleteEquipo:', error.message);
    if (error.code === 'P2014') {
      return res.status(409).json({ error: 'No se puede eliminar el equipo (tiene diagnósticos o datos relacionados)' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.status(500).json({ error: 'No se pudo eliminar el equipo', details: error.message });
  }
};
