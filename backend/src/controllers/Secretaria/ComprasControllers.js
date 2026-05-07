import prisma from '../../app/prismaClient.js';

export const getCompras = async (req, res) => {
  try {
    const compras = await prisma.compras.findMany({
      include: {
        proveedor: true,
        repuesto: true,
      },
      orderBy: { id_compra: 'desc' },
    });

    res.json({ data: compras });
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ error: 'Error al obtener compras', details: error.message });
  }
};

export const createCompra = async (req, res) => {
  try {
    const {
      repuesto_id,
      proveedor_id,
      documento,
      fecha_obtencion,
      cantidad,
      costo_unitario,
      metodo_pago,
    } = req.body;

    if (!repuesto_id || !proveedor_id) {
      return res.status(400).json({ error: 'Proveedor y repuesto son obligatorios' });
    }

    const compra = await prisma.compras.create({
      data: {
        repuesto_id: Number(repuesto_id),
        proveedor_id: Number(proveedor_id),
        documento: documento || null,
        fecha_obtencion: fecha_obtencion ? new Date(fecha_obtencion) : undefined,
        cantidad: cantidad ? Number(cantidad) : null,
        costo_unitario: costo_unitario ? Number(costo_unitario) : null,
        metodo_pago: metodo_pago || null,
      },
      include: {
        proveedor: true,
        repuesto: true,
      },
    });

    res.status(201).json({ data: compra });
  } catch (error) {
    console.error('Error al crear compra:', error);
    res.status(500).json({ error: 'Error al crear compra', details: error.message });
  }
};
