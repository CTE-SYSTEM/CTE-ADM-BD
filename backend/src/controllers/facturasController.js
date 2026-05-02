import prisma from '../app/prismaClient.js';

export const getFacturas = async (req, res) => {
  try {
    const facturas = await prisma.facturas.findMany({
      include: {
        orden: {
          include: {
            diagnostico: { include: { equipo: { include: { cliente: true } } } },
          },
        },
      },
      orderBy: { id_factura: 'asc' },
    });
    res.json({ ok: true, data: facturas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
};

export const createFactura = async (req, res) => {
  try {
    const { orden_id, monto_repuestos, mano_obra, subtotal, impuestos, total, metodo_pago } = req.body;
    const factura = await prisma.facturas.create({
      data: {
        orden_id: Number(orden_id),
        monto_repuestos: monto_repuestos === '' ? null : monto_repuestos,
        mano_obra: mano_obra === '' ? null : mano_obra,
        subtotal: subtotal === '' ? null : subtotal,
        impuestos: impuestos === '' ? null : impuestos,
        total: total === '' ? null : total,
        metodo_pago,
      },
    });
    res.status(201).json({ ok: true, data: factura });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear factura' });
  }
};
