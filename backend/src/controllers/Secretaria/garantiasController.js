// backend/src/controllers/Secretaria/garantiasController.js
import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';
import { normalizeOptionalText, parsePositiveId } from '../../utils/domainValidation.js';

export const getGarantias = async (req, res) => {
  try {
    const rows = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_garantias_secretaria()`);
    const garantias = rows.map((row) => row.data);

    res.json({ data: garantias });
  } catch (error) {
    console.error('Error al obtener garantias:', error);
    res.status(500).json({ error: 'Error al obtener el historial de garantias' });
  }
};

export const createGarantia = async (req, res) => {
  try {
    const { factura_id, condiciones, duracion_meses } = req.body;
    const facturaId = parsePositiveId(factura_id);
    const duracionMeses = Number(duracion_meses);

    if (!facturaId) {
      return res.status(400).json({ error: 'La factura es obligatoria' });
    }

    if (!Number.isInteger(duracionMeses) || duracionMeses < 1 || duracionMeses > 36) {
      return res.status(400).json({ error: 'La duracion debe estar entre 1 y 36 meses' });
    }

    const factura = await prisma.facturas.findUnique({
      where: { id_factura: facturaId },
      include: { garantias: true },
    });

    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    if (factura.garantias.length > 0) {
      return res.status(409).json({ error: 'Esta factura ya tiene una garantia registrada' });
    }

    const fecha_inicio = new Date();
    const fecha_vencimiento = new Date();
    fecha_vencimiento.setMonth(fecha_vencimiento.getMonth() + duracionMeses);

    const nuevaGarantia = await prisma.garantias.create({
      data: {
        factura_id: facturaId,
        condiciones: normalizeOptionalText(condiciones),
        duracion_meses: duracionMeses,
        fecha_inicio,
        fecha_vencimiento,
      },
      include: {
        factura: true,
      },
    });

    res.status(201).json({
      message: 'Garantia generada exitosamente',
      data: nuevaGarantia,
    });
  } catch (error) {
    console.error('Error al crear garantia:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'La factura especificada no existe' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Esta factura ya tiene una garantia registrada' });
    }
    res.status(500).json({ error: 'No se pudo registrar la garantia' });
  }
};

export const getGarantiaByFactura = async (req, res) => {
  try {
    const { facturaId } = req.params;
    const garantia = await prisma.garantias.findFirst({
      where: { factura_id: parseInt(facturaId) },
    });

    if (!garantia) {
      return res.status(404).json({ error: 'No hay garantia registrada para esta factura' });
    }

    res.json({ data: garantia });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar la garantia' });
  }
};
