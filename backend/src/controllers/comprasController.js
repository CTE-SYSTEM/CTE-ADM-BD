import prisma from '../app/prismaClient.js';

export const getCompras = async (req, res) => {
  try {
    const compras = await prisma.compras.findMany({
      include: { proveedor: true, repuesto: { include: { categoria: true } } },
      orderBy: { id_compra: 'asc' },
    });
    res.json({ ok: true, data: compras });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
};

export const createCompra = async (req, res) => {
  try {
    const { repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago } = req.body;
    const compra = await prisma.compras.create({
      data: {
        repuesto_id: Number(repuesto_id),
        proveedor_id: Number(proveedor_id),
        documento,
        fecha_obtencion: fecha_obtencion ? new Date(fecha_obtencion) : undefined,
        cantidad: cantidad === '' ? null : Number(cantidad),
        costo_unitario: costo_unitario === '' ? null : costo_unitario,
        metodo_pago,
      },
    });
    res.status(201).json({ ok: true, data: compra });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear compra' });
  }
};
