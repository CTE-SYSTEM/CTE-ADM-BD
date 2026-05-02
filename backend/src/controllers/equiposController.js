import prisma from '../app/prismaClient.js';

export const getEquipos = async (req, res) => {
  try {
    const equipos = await prisma.equipos.findMany({
      include: { cliente: true },
      orderBy: { id_equipo: 'asc' },
    });
    res.json({ ok: true, data: equipos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
};

export const createEquipo = async (req, res) => {
  try {
    const { cliente_id, marca, tipo, numero_serie, modelo } = req.body;
    const equipo = await prisma.equipos.create({
      data: { cliente_id: Number(cliente_id), marca, tipo, numero_serie, modelo },
    });
    res.status(201).json({ ok: true, data: equipo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear equipo' });
  }
};

export const updateEquipo = async (req, res) => {
  try {
    const { cliente_id, marca, tipo, numero_serie, modelo } = req.body;
    const equipo = await prisma.equipos.update({
      where: { id_equipo: Number(req.params.id) },
      data: { cliente_id: Number(cliente_id), marca, tipo, numero_serie, modelo },
    });
    res.json({ ok: true, data: equipo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

export const deleteEquipo = async (req, res) => {
  try {
    await prisma.equipos.delete({ where: { id_equipo: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
};
