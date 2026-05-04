import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await prisma.tecnicos.findMany();
    res.json(tecnicos);
  } catch (error) {
    console.error('Error al obtener tecnicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createTecnico = async (req, res) => {
  try {
    const tecnico = await prisma.tecnicos.create({
      data: req.body
    });
    res.status(201).json(tecnico);
  } catch (error) {
    console.error('Error al crear tecnico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};