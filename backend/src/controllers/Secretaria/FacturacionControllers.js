import prisma from '../../app/prismaClient.js';
import {
  METODOS_PAGO,
  assertInList,
  parseNonNegativeMoney,
  parsePositiveId,
} from '../../utils/domainValidation.js';

const facturaInclude = {
  garantias: true,
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

const repuestoSafeSelect = {
  id_repuesto: true,
  tipo_repuesto_id: true,
  proveedor_id: true,
  nombre: true,
  descripcion: true,
  costo_individual: true,
  porcentaje_de_ganacia: true,
  ganancia_cordobas: true,
  activo: true,
  descontinuada: true,
};

const repuestosUsadosInclude = {
  repuestos_usados: {
    include: { repuesto: { select: repuestoSafeSelect } },
  },
};

const calcularMontoRepuestos = (repuestosUsados = []) => {
  const total = repuestosUsados
    .filter((detalle) => (detalle.estado_aprobacion || '').toUpperCase() === 'APROBADO')
    .reduce((sum, detalle) => {
      const cantidad = Number(detalle.cantidad_usada || 0);
      const costo = Number(detalle.repuesto?.costo_individual || 0);
      return sum + (cantidad * costo);
    }, 0);

  return Math.round(total * 100) / 100;
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
      mano_obra,
      impuestos,
      metodo_pago,
    } = req.body;
    const ordenId = parsePositiveId(orden_id);

    if (!ordenId) {
      return res.status(400).json({ error: 'La orden es obligatoria' });
    }

    const manoObra = parseNonNegativeMoney(mano_obra, 'Mano de obra');
    const impuestoCalculado = parseNonNegativeMoney(impuestos, 'Impuestos');
    const metodoPago = assertInList(metodo_pago, METODOS_PAGO, 'Metodo de pago');

    const orden = await prisma.ordenes.findUnique({
      where: { id_orden: ordenId },
      include: {
        facturas: true,
        ...repuestosUsadosInclude,
      },
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const estadoOrden = (orden.estado || '').toUpperCase();

    if (!['FINALIZADO', 'IRREPARABLE'].includes(estadoOrden)) {
      return res.status(409).json({ error: 'Solo se pueden facturar ordenes finalizadas o irreparables' });
    }

    if (orden.facturas.length > 0) {
      return res.status(409).json({ error: 'Esta orden ya tiene una factura registrada' });
    }

    const montoRepuestos = estadoOrden === 'IRREPARABLE' ? 0 : calcularMontoRepuestos(orden.repuestos_usados);
    const subtotalCalculado = Math.round((montoRepuestos + manoObra) * 100) / 100;
    const totalCalculado = Math.round((subtotalCalculado + impuestoCalculado) * 100) / 100;

    const factura = await prisma.$transaction(async (tx) => {
      const facturaCreada = await tx.facturas.create({
        data: {
          orden_id: ordenId,
          monto_repuestos: montoRepuestos,
          mano_obra: manoObra,
          subtotal: subtotalCalculado,
          impuestos: impuestoCalculado,
          total: totalCalculado,
          metodo_pago: metodoPago,
        },
      });

      await tx.ordenes.update({
        where: { id_orden: ordenId },
        data: { estado: 'ENTREGADO' },
      });

      return tx.facturas.findUnique({
        where: { id_factura: facturaCreada.id_factura },
        include: facturaInclude,
      });
    });

    res.status(201).json({ data: factura });
  } catch (error) {
    console.error('Error al crear factura:', error);
    if (error.message?.includes('debe ser') || error.message?.includes('no es valido')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Esta orden ya tiene una factura registrada' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'La orden especificada no existe' });
    }
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
        ...repuestosUsadosInclude,
      },
      orderBy: { id_orden: 'desc' },
    });

    const ordenesDisponibles = ordenes
      .filter((orden) =>
        orden.facturas.length === 0 && ['FINALIZADO', 'IRREPARABLE'].includes((orden.estado || '').toUpperCase())
      )
      .map((orden) => ({
        ...orden,
        monto_repuestos_calculado: (orden.estado || '').toUpperCase() === 'IRREPARABLE' ? 0 : calcularMontoRepuestos(orden.repuestos_usados),
      }));

    res.json({
      data: ordenesDisponibles,
    });
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
          include: { repuesto: { select: repuestoSafeSelect } },
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
