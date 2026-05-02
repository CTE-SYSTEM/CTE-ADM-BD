import prisma from '../app/prismaClient.js';

export const getOrdenes = async (req, res) => {
  try {
    const ordenes = await prisma.ordenes.findMany({
      include: {
        tecnico: true,
        diagnostico: { include: { equipo: { include: { cliente: true } } } },
      },
      orderBy: { id_orden: 'asc' },
    });
    res.json({ ok: true, data: ordenes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener ordenes' });
  }
};

export const createOrden = async (req, res) => {
  try {
    const {
      equipo_id,
      tecnico_id,
      falla_reportada,
      prioridad,
      estado,
      tipo_equipo,
      deja_cargador,
      enciende,
      usa_corriente_ac,
    } = req.body;

    const orden = await prisma.$transaction(async (tx) => {
      const diagnostico = await tx.diagnosticos.create({
        data: {
          equipo_id: Number(equipo_id),
          tecnico_id: Number(tecnico_id),
          falla_reportada,
          estado: 'PENDIENTE',
          deja_cargador: Boolean(deja_cargador),
          enciende: Boolean(enciende),
          usa_corriente_ac: Boolean(usa_corriente_ac),
        },
      });

      return tx.ordenes.create({
        data: {
          diagnostico_id: diagnostico.id_diagnostico,
          tecnico_id: Number(tecnico_id),
          prioridad,
          estado: estado || 'PENDIENTE',
          tipo_equipo,
        },
        include: {
          tecnico: true,
          diagnostico: { include: { equipo: { include: { cliente: true } } } },
        },
      });
    });

    res.status(201).json({ ok: true, data: orden });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear orden' });
  }
};

export const updateOrden = async (req, res) => {
  try {
    const { prioridad, estado, tipo_equipo, tecnico_id } = req.body;
    const orden = await prisma.ordenes.update({
      where: { id_orden: Number(req.params.id) },
      data: { prioridad, estado, tipo_equipo, tecnico_id: Number(tecnico_id) },
    });
    res.json({ ok: true, data: orden });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
};

export const deleteOrden = async (req, res) => {
  try {
    await prisma.ordenes.delete({ where: { id_orden: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar orden' });
  }
};
