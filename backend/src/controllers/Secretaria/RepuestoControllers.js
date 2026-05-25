// backend/src/controllers/Secretaria/RepuestoControllers.js
import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';

const normalizeNumber = (value) => Number(value) || 0;
const normalizeText = (value = '') => String(value).trim().replace(/\s+/g, ' ');
const normalizeRole = (role) =>
  String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]/g, '')
    .toLowerCase();

const canViewStock = (user) => {
  const role = normalizeRole(user?.rol);
  return role === 'adminpro' || role === 'administrador' || user?.username === 'admin_pro';
};

const hideStock = (repuesto) => {
  const { stock_actual, ...safeRepuesto } = repuesto;
  return safeRepuesto;
};

const normalizeRepuestoInput = (body) => ({
    nombre: normalizeText(body.nombre),
    descripcion: normalizeText(body.descripcion),
    categoria_nombre: normalizeText(body.categoria_nombre || body.categoria?.nombre_tipo),
    electronico: normalizeText(body.electronico || body.categoria?.electronico),
    ...(Object.prototype.hasOwnProperty.call(body, 'proveedor_id')
      ? { proveedor_id: body.proveedor_id ? Number(body.proveedor_id) : null }
      : {}),
    costo_individual: normalizeNumber(body.costo_individual),
    ganancia_cordobas: normalizeNumber(body.ganancia_cordobas),
  });

export const getRepuestos = async (req, res) => {
  try {
    const soloDisponibles = ['1', 'true', 'si', 'yes'].includes(String(req.query.disponibles || '').toLowerCase());
    const rows = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_repuestos_detalle()`);
    const repuestos = rows
      .map((row) => row.data)
      .filter((repuesto) => !soloDisponibles || Number(repuesto.stock_actual || 0) > 0);
    res.json({ success: true, data: canViewStock(req.user) ? repuestos : repuestos.map(hideStock) });
  } catch (error) {
    console.error('Error en getRepuestos:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, message: 'Error al obtener repuestos', details: error.message });
  }
};

export const createRepuesto = async (req, res) => {
  try {
    const data = normalizeRepuestoInput(req.body);

    if (!data.categoria_nombre) {
      return res.status(400).json({ success: false, error: 'La categoria del repuesto es obligatoria' });
    }

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT data FROM crear_repuesto_proc(
        ${data.nombre},
        ${data.descripcion || null},
        ${data.categoria_nombre},
        ${data.electronico || null},
        ${data.proveedor_id || null},
        ${data.costo_individual},
        ${data.ganancia_cordobas}
      )
    `);
    const repuesto = row?.data;

    res.status(201).json({ success: true, data: canViewStock(req.user) ? repuesto : hideStock(repuesto) });
  } catch (error) {
    console.error('Error en createRepuesto:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const data = normalizeRepuestoInput(req.body);

    if (!data.categoria_nombre) {
      return res.status(400).json({ success: false, error: 'La categoria del repuesto es obligatoria' });
    }

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT data FROM actualizar_repuesto_proc(
        ${Number(id)},
        ${data.nombre},
        ${data.descripcion || null},
        ${data.categoria_nombre},
        ${data.electronico || null},
        ${data.proveedor_id || null},
        ${data.costo_individual},
        ${data.ganancia_cordobas}
      )
    `);
    const repuesto = row?.data;

    if (!repuesto) return res.status(404).json({ success: false, error: 'Repuesto no encontrado' });

    res.json({ success: true, data: canViewStock(req.user) ? repuesto : hideStock(repuesto) });
  } catch (error) {
    console.error('Error en updateRepuesto:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Repuesto no encontrado' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$executeRaw(Prisma.sql`SELECT descontinuar_repuesto_proc(${Number(id)})`);
    res.json({ success: true, message: 'Repuesto marcado como descontinuado' });
  } catch (error) {
    console.error('Error en deleteRepuesto:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Repuesto no encontrado' });
    }
    res.status(500).json({ success: false, error: 'Error al procesar la solicitud', details: error.message });
  }
};
