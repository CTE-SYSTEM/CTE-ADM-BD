import prisma from '../../app/prismaClient.js';

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
    const { diagnostico_id, tecnico_id, prioridad, estado } = req.body;
    const diagnosticoId = Number(diagnostico_id);

    if (!diagnosticoId) {
      return res.status(400).json({ error: 'El diagnostico es obligatorio' });
    }

    const diagnostico = await prisma.diagnosticos.findUnique({
      where: { id_diagnostico: diagnosticoId },
      include: { equipo: { include: { cliente: true } } },
    });

    if (!diagnostico) {
      return res.status(404).json({ error: 'Diagnostico no encontrado' });
    }

    const estadoDiagnostico = (diagnostico.estado_del_diagnostico || '').toUpperCase();
    const estadosListos = ['COMPLETADO'];

    if (!estadosListos.includes(estadoDiagnostico)) {
      return res.status(409).json({ error: 'Solo se pueden crear ordenes desde diagnosticos completados' });
    }

    if (!diagnostico.equipo?.cliente?.id_cliente || !diagnostico.equipo?.id_equipo) {
      return res.status(400).json({ error: 'El diagnostico no tiene cliente o equipo valido' });
    }

    if (!diagnostico.diagnostico_real || !Number(diagnostico.presupuesto_estimado || 0)) {
      return res.status(400).json({ error: 'Complete informe tecnico y presupuesto antes de crear la orden' });
    }

    const existente = await prisma.ordenes.findFirst({
      where: { diagnostico_id: diagnosticoId },
    });

    if (existente) {
      return res.status(409).json({ error: 'Ya existe una orden para este diagnostico' });
    }

    const orden = await prisma.ordenes.create({
      data: {
        diagnostico_id: diagnosticoId,
        tecnico_id: tecnico_id ? Number(tecnico_id) : null,
        prioridad: prioridad || 'Normal',
        estado: estado || 'PENDIENTE',
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
    const { tecnico_id, prioridad, estado } = req.body;

    const orden = await prisma.ordenes.update({
      where: { id_orden: Number(req.params.id) },
      data: {
        tecnico_id: tecnico_id ? Number(tecnico_id) : null,
        prioridad,
        estado,
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
