import prisma from '../../app/prismaClient.js';

export const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await prisma.tecnicos.findMany();
    res.json({ data: tecnicos });
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
    res.status(201).json({ data: tecnico });
  } catch (error) {
    console.error('Error al crear tecnico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getMisDiagnosticos = async (req, res) => {
  try {
    const { username } = req.params;

    const tecnico = await prisma.tecnicos.findFirst({
      where: {
        usuario: { nombre_usuario: username },
        activo: true,
      },
      include: {
        diagnosticos: {
          include: {
            equipo: { include: { cliente: true } },
          },
          orderBy: { fecha_asignacion: 'desc' },
        },
      },
    });

    if (!tecnico) {
      return res.json({ data: [], tecnico: null });
    }

    res.json({ data: tecnico.diagnosticos, tecnico });
  } catch (error) {
    console.error('Error al obtener diagnósticos del técnico:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};
