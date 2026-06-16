import prisma from '../../app/prismaClient.js';

// 1. Monitoreo de equipos con historial y estado
export const getEquiposAvanzado = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const marca = req.query.marca?.trim();
    const modelo = req.query.modelo?.trim();
    const { fecha_inicio, fecha_fin } = req.query;
    const where = {};

    if (search) {
      const isNumeric = /^\d+$/.test(search);
      where.OR = [
        ...(isNumeric ? [{ id_equipo: Number(search) }] : []),
        { tipo: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
        { modelo: { contains: search, mode: 'insensitive' } },
        { numero_serie: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        {
          diagnosticos: {
            some: {
              estado_del_diagnostico: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ];
    }

    if (marca) {
      where.marca = { contains: marca, mode: 'insensitive' };
    }

    if (modelo) {
      where.modelo = { contains: modelo, mode: 'insensitive' };
    }

    if (fecha_inicio || fecha_fin) {
      const range = {};
      if (fecha_inicio) range.gte = new Date(`${fecha_inicio}T00:00:00`);
      if (fecha_fin) range.lte = new Date(`${fecha_fin}T23:59:59`);
      where.diagnosticos = {
        some: {
          OR: [
            { fecha_hora: range },
            { ordenes: { some: { fecha_ingreso: range } } },
          ],
        },
      };
    }

    const equipos = await prisma.equipos.findMany({
      where,
      include: {
        cliente: true,
        diagnosticos: {
          include: {
            ordenes: true
          }
        }
      }
    });
    res.json({ data: equipos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener equipos avanzados', details: error.message });
  }
};
export const getEquipoUltimoDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const diagnostico = await prisma.diagnosticos.findFirst({
      where: { equipo_id: Number(id) },
      include: {
        tecnico: true,
        ordenes: true,
      },
      orderBy: { fecha_hora: 'desc' },
    });

    if (!diagnostico) {
      return res.status(404).json({ error: 'No se encontró diagnóstico para este equipo' });
    }

    res.json({ data: diagnostico });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el diagnóstico del equipo', details: error.message });
  }
};

export const updateEquipoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, marca, modelo, numero_serie } = req.body;

    const data = {};
    if (tipo !== undefined) data.tipo = String(tipo).trim() || null;
    if (marca !== undefined) data.marca = String(marca).trim() || null;
    if (modelo !== undefined) data.modelo = String(modelo).trim() || null;
    if (numero_serie !== undefined) data.numero_serie = String(numero_serie).trim() || null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    const equipo = await prisma.equipos.update({
      where: { id_equipo: Number(id) },
      data,
      include: { cliente: true },
    });

    res.json({ data: equipo });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar equipo', details: error.message });
  }
};
