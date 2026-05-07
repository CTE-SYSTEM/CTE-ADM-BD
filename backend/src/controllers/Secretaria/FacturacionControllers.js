import prisma from '../../app/prismaClient.js';

const facturaInclude = {
  orden: {
    include: {
      diagnostico: {
        include: {
          equipo: {
            include: { cliente: true },
          },
        },
      },
    },
  },
};

export const getFacturas = async (req, res) => {
  try {
    const facturas = await prisma.facturas.findMany({
      include: facturaInclude,
      orderBy: { id_factura: 'desc' },
    });

    res.json({ data: facturas });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'Error al obtener facturas', details: error.message });
  }
};

export const createFactura = async (req, res) => {
  try {
    const {
      orden_id,
      monto_repuestos,
      mano_obra,
      subtotal,
      impuestos,
      total,
      metodo_pago,
    } = req.body;

    if (!orden_id) {
      return res.status(400).json({ error: 'La orden es obligatoria' });
    }

    const factura = await prisma.facturas.create({
      data: {
        orden_id: Number(orden_id),
        monto_repuestos: monto_repuestos ? Number(monto_repuestos) : null,
        mano_obra: mano_obra ? Number(mano_obra) : null,
        subtotal: subtotal ? Number(subtotal) : null,
        impuestos: impuestos ? Number(impuestos) : null,
        total: total ? Number(total) : null,
        metodo_pago: metodo_pago || null,
      },
      include: facturaInclude,
    });

    res.status(201).json({ data: factura });
  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ error: 'Error al crear factura', details: error.message });
  }
};

export const getOrdenesParaFacturar = async (req, res) => {
  try {
    const ordenes = await prisma.ordenes.findMany({
      include: {
        diagnostico: {
          include: {
            equipo: {
              include: { cliente: true },
            },
          },
        },
        facturas: true,
      },
      orderBy: { id_orden: 'desc' },
    });

    res.json({ data: ordenes.filter((orden) => orden.facturas.length === 0) });
  } catch (error) {
    console.error('Error al obtener ordenes para facturar:', error);
    res.status(500).json({ error: 'Error al obtener ordenes', details: error.message });
  }
};

export const getDetalleFacturacion = async (req, res) => {
  try {
    const orden = await prisma.ordenes.findUnique({
      where: { id_orden: Number(req.params.id_orden) },
      include: {
        diagnostico: {
          include: {
            equipo: {
              include: { cliente: true },
            },
          },
        },
        repuestos_usados: {
          include: { repuesto: true },
        },
      },
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json({ data: orden });
  } catch (error) {
    console.error('Error al obtener detalle de facturacion:', error);
    res.status(500).json({ error: 'Error al obtener detalle', details: error.message });
  }
};

export const crearFactura = createFactura;
export const getHistorialFacturas = getFacturas;
