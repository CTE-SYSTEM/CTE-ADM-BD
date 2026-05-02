import prisma from '../app/prismaClient.js';

export const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await prisma.tecnicos.findMany({
      orderBy: { id_tecnico: 'asc' },
    });
    res.json({ ok: true, data: tecnicos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tecnicos' });
  }
};

export const createTecnico = async (req, res) => {
  try {
    const { nombre, especialidad, horario, contacto } = req.body;
    const tecnico = await prisma.tecnicos.create({
      data: { nombre, especialidad, horario, contacto },
    });
    res.status(201).json({ ok: true, data: tecnico });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear tecnico' });
  }
};
