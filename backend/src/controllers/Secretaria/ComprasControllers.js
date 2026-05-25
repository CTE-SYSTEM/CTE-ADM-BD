import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';
import { METODOS_PAGO, assertInList } from '../../utils/domainValidation.js';

const normalizeText = (value = '') => String(value).trim().replace(/\s+/g, ' ');

export const getCompras = async (req, res) => {
  try {
    const compras = await prisma.$queryRaw(Prisma.sql`SELECT * FROM get_compras_completas()`);

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

    const repuestoId = Number(repuesto_id);
    const proveedorId = Number(proveedor_id);
    const cantidadNumber = Number(cantidad);
    const costoNumber = Number(costo_unitario);
    const fecha = fecha_obtencion ? new Date(fecha_obtencion) : undefined;

    if (!Number.isInteger(cantidadNumber) || cantidadNumber <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un numero entero mayor que cero' });
    }

    if (!costoNumber || costoNumber <= 0) {
      return res.status(400).json({ error: 'El costo unitario debe ser mayor que cero' });
    }

    if (fecha && Number.isNaN(fecha.getTime())) {
      return res.status(400).json({ error: 'La fecha de obtencion no es valida' });
    }

    const [compra] = await prisma.$queryRaw(Prisma.sql`
      SELECT * FROM crear_compra_con_variante_proc(
        ${repuestoId},
        ${proveedorId},
        ${normalizeText(documento) || null},
        ${fecha || null},
        ${cantidadNumber},
        ${costoNumber},
        ${assertInList(normalizeText(metodo_pago), METODOS_PAGO, 'Metodo de pago')}
      )
    `);

    res.status(201).json({ data: compra });
  } catch (error) {
    console.error('Error al crear compra:', error);
    if (error.message?.includes('no es valido')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al crear compra', details: error.message });
  }
};
