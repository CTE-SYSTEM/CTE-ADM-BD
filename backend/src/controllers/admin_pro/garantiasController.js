import prisma from '../../app/prismaClient.js';

export const getGarantiasAdmin = async (req, res) => {
  try {
    const garantias = await prisma.garantias.findMany({
      include: {
        factura: {
          include: {
            orden: {
              include: {
                diagnostico: {
                  include: {
                    equipo: {
                      include: { cliente: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { fecha_vencimiento: 'asc' }
    });

    res.json({ data: garantias });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener garantías', details: error.message });
  }
};

export const createGarantiaAdmin = async (req, res) => {
  try {
    const { factura_id, condiciones, duracion_meses } = req.body;
    if (!factura_id || !duracion_meses) {
      return res.status(400).json({ error: 'factura_id y duracion_meses son obligatorios' });
    }

    const fecha_inicio = new Date();
    const fecha_vencimiento = new Date();
    fecha_vencimiento.setMonth(fecha_vencimiento.getMonth() + parseInt(duracion_meses, 10));

    const nuevaGarantia = await prisma.garantias.create({
      data: {
        factura_id: parseInt(factura_id, 10),
        condiciones,
        duracion_meses: parseInt(duracion_meses, 10),
        fecha_inicio,
        fecha_vencimiento
      },
      include: {
        factura: true
      }
    });

    res.status(201).json({ message: 'Garantía registrada exitosamente', data: nuevaGarantia });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'La factura especificada no existe' });
    }
    res.status(500).json({ error: 'Error al crear garantía', details: error.message });
  }
};

export const updateGarantiaAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { condiciones, duracion_meses } = req.body;

    const garantiaActual = await prisma.garantias.findUnique({
      where: { id_garantia: Number(id) }
    });

    if (!garantiaActual) {
      return res.status(404).json({ error: 'Garantía no encontrada' });
    }

    const updatedData = { condiciones };
    if (duracion_meses !== undefined && duracion_meses !== null) {
      updatedData.duracion_meses = parseInt(duracion_meses, 10);
      const fecha_inicio = garantiaActual.fecha_inicio || new Date();
      const fecha_vencimiento = new Date(fecha_inicio);
      fecha_vencimiento.setMonth(fecha_vencimiento.getMonth() + parseInt(duracion_meses, 10));
      updatedData.fecha_inicio = fecha_inicio;
      updatedData.fecha_vencimiento = fecha_vencimiento;
    }

    const garantia = await prisma.garantias.update({
      where: { id_garantia: Number(id) },
      data: updatedData
    });

    res.json({ data: garantia });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar garantía', details: error.message });
  }
};

export const renewGarantiaAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { duracion_meses, condiciones } = req.body;

    const garantiaActual = await prisma.garantias.findUnique({
      where: { id_garantia: Number(id) }
    });

    if (!garantiaActual) {
      return res.status(404).json({ error: 'Garantía no encontrada' });
    }

    const duracion = duracion_meses !== undefined && duracion_meses !== null
      ? parseInt(duracion_meses, 10)
      : garantiaActual.duracion_meses ?? 3;

    if (!Number.isInteger(duracion) || duracion < 1 || duracion > 36) {
      return res.status(400).json({ error: 'Duración inválida. Debe ser entre 1 y 36 meses.' });
    }

    const fecha_inicio = new Date();
    const fecha_vencimiento = new Date(fecha_inicio);
    fecha_vencimiento.setMonth(fecha_vencimiento.getMonth() + duracion);

    const garantia = await prisma.garantias.update({
      where: { id_garantia: Number(id) },
      data: {
        duracion_meses: duracion,
        condiciones: condiciones !== undefined ? condiciones : garantiaActual.condiciones,
        fecha_inicio,
        fecha_vencimiento
      }
    });

    const vencidaAnteriormente = garantiaActual.fecha_vencimiento ? new Date(garantiaActual.fecha_vencimiento) < new Date() : true;
    const mensaje = vencidaAnteriormente
      ? 'Garantía vencida. Se ha renovado la vigencia para la misma factura.'
      : 'Garantía revalidada correctamente.';

    res.json({ message: mensaje, data: garantia });
  } catch (error) {
    res.status(500).json({ error: 'Error al renovar garantía', details: error.message });
  }
};

// 5. Gestión de usuarios y roles (solo admin_pro)
