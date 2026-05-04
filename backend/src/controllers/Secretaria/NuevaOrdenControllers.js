import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ordenInclude = {
  diagnostico: {
    include: {
      equipo: {
        include: { cliente: true },
      },
    },
  },
  tecnico: true,
};

export const getOrdenes = async (req, res) => {
  try {
    const ordenes = await prisma.ordenes.findMany({
      include: ordenInclude,
      orderBy: { id_orden: 'desc' },
    });

    res.json({ data: ordenes });
  } catch (error) {
    console.error('Error al obtener ordenes:', error);
    res.status(500).json({ error: 'Error al obtener ordenes', details: error.message });
  }
};

export const createOrden = async (req, res) => {
  try {
    const { diagnostico_id, tecnico_id, prioridad, estado, tipo_equipo } = req.body;

    if (!diagnostico_id) {
      return res.status(400).json({ error: 'El diagnostico es obligatorio' });
    }

    const orden = await prisma.ordenes.create({
      data: {
        diagnostico_id: Number(diagnostico_id),
        tecnico_id: tecnico_id ? Number(tecnico_id) : null,
        prioridad: prioridad || 'Normal',
        estado: estado || 'PENDIENTE',
        tipo_equipo: tipo_equipo || null,
      },
      include: ordenInclude,
    });

    res.status(201).json({ data: orden });
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear orden', details: error.message });
  }
};

export const updateOrden = async (req, res) => {
  try {
    const { tecnico_id, prioridad, estado, tipo_equipo } = req.body;

    const orden = await prisma.ordenes.update({
      where: { id_orden: Number(req.params.id) },
      data: {
        tecnico_id: tecnico_id ? Number(tecnico_id) : null,
        prioridad,
        estado,
        tipo_equipo,
      },
      include: ordenInclude,
    });

    res.json({ data: orden });
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.status(500).json({ error: 'Error al actualizar orden', details: error.message });
  }
};

export const deleteOrden = async (req, res) => {
  try {
    await prisma.ordenes.delete({
      where: { id_orden: Number(req.params.id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: 'Error al eliminar orden', details: error.message });
  }
};
