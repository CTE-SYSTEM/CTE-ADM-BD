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
    const metodoPago = normalizeText(metodo_pago);

    if (!Number.isInteger(repuestoId) || repuestoId <= 0) {
      return res.status(400).json({ error: 'Seleccione un repuesto valido' });
    }

    if (!Number.isInteger(proveedorId) || proveedorId <= 0) {
      return res.status(400).json({ error: 'Seleccione un proveedor valido' });
    }

    if (!Number.isInteger(cantidadNumber) || cantidadNumber <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un numero entero mayor que cero' });
    }

    if (!costoNumber || costoNumber <= 0) {
      return res.status(400).json({ error: 'El costo unitario debe ser mayor que cero' });
    }

    if (fecha && Number.isNaN(fecha.getTime())) {
      return res.status(400).json({ error: 'La fecha de obtencion no es valida' });
    }

    if (!metodoPago) {
      return res.status(400).json({ error: 'El metodo de pago es obligatorio' });
    }

    const [compra] = await prisma.$queryRaw(Prisma.sql`
      SELECT * FROM crear_compra_con_variante_proc(
        ${repuestoId},
        ${proveedorId},
        ${normalizeText(documento) || null},
        ${fecha || null},
        ${cantidadNumber},
        ${costoNumber},
        ${assertInList(metodoPago, METODOS_PAGO, 'Metodo de pago')}
      )
    `);

    res.status(201).json({ data: compra });
  } catch (error) {
    console.error('Error al crear compra:', error);
    if (
      error.message?.includes('no es valido')
      || error.message?.includes('no existe')
      || error.message?.includes('descontinuado')
    ) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al crear compra', details: error.message });
  }
};

export const updateCompra = async (req, res) => {
  try {
    const { id } = req.params;
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

    const compraId = Number(id);
    const repuestoId = Number(repuesto_id);
    const proveedorId = Number(proveedor_id);
    const cantidadNumber = Number(cantidad);
    const costoNumber = Number(costo_unitario);
    const fecha = fecha_obtencion ? new Date(fecha_obtencion) : null;
    const metodoPagoNormalizado = normalizeText(metodo_pago);

    if (!Number.isInteger(compraId) || compraId <= 0) {
      return res.status(400).json({ error: 'Compra invalida' });
    }

    if (!Number.isInteger(repuestoId) || repuestoId <= 0) {
      return res.status(400).json({ error: 'Seleccione un repuesto valido' });
    }

    if (!Number.isInteger(proveedorId) || proveedorId <= 0) {
      return res.status(400).json({ error: 'Seleccione un proveedor valido' });
    }

    if (!Number.isInteger(cantidadNumber) || cantidadNumber <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un numero entero mayor que cero' });
    }

    if (!costoNumber || costoNumber <= 0) {
      return res.status(400).json({ error: 'El costo unitario debe ser mayor que cero' });
    }

    if (fecha && Number.isNaN(fecha.getTime())) {
      return res.status(400).json({ error: 'La fecha de obtencion no es valida' });
    }

    if (!metodoPagoNormalizado) {
      return res.status(400).json({ error: 'El metodo de pago es obligatorio' });
    }

    const metodoPago = assertInList(metodoPagoNormalizado, METODOS_PAGO, 'Metodo de pago');

    const compra = await prisma.$transaction(async (tx) => {
      const actual = await tx.compras.findUnique({ where: { id_compra: compraId } });
      if (!actual) {
        const error = new Error('Compra no encontrada');
        error.status = 404;
        throw error;
      }

      const repuesto = await tx.repuestos.findFirst({
        where: { id_repuesto: repuestoId, descontinuada: false },
      });
      if (!repuesto) {
        const error = new Error('El repuesto seleccionado no existe o esta descontinuado');
        error.status = 400;
        throw error;
      }

      const proveedor = await tx.proveedores.findFirst({
        where: { id_proveedor: proveedorId, descontinuada: false },
      });
      if (!proveedor) {
        const error = new Error('El proveedor seleccionado no existe o esta descontinuado');
        error.status = 400;
        throw error;
      }

      await tx.repuestos.update({
        where: { id_repuesto: repuestoId },
        data: {
          proveedor_id: proveedorId,
          costo_individual: costoNumber,
        },
      });

      return tx.compras.update({
        where: { id_compra: compraId },
        data: {
          repuesto_id: repuestoId,
          proveedor_id: proveedorId,
          documento: normalizeText(documento) || null,
          fecha_obtencion: fecha,
          cantidad: cantidadNumber,
          costo_unitario: costoNumber,
          metodo_pago: metodoPago,
        },
        include: {
          proveedor: true,
          repuesto: { include: { proveedor: true, categoria: true } },
        },
      });
    });

    res.json({ data: compra });
  } catch (error) {
    console.error('Error al actualizar compra:', error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    if (error.message?.includes('no es valido')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al actualizar compra', details: error.message });
  }
};
