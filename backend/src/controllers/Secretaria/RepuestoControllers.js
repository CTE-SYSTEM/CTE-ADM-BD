// backend/src/controllers/Secretaria/RepuestoControllers.js
import prisma from '../../app/prismaClient.js';

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

const getCategoriaId = async ({ tipo_repuesto_id, categoria_nombre, electronico }) => {
  const id = Number(tipo_repuesto_id);
  if (id) return id;

  const nombre_tipo = normalizeText(categoria_nombre);
  const electronicoNormalizado = normalizeText(electronico);

  if (!nombre_tipo) return null;

  const existente = await prisma.categorias_Repuestos.findFirst({
    where: {
      nombre_tipo: { equals: nombre_tipo, mode: 'insensitive' },
      electronico: electronicoNormalizado ? { equals: electronicoNormalizado, mode: 'insensitive' } : null,
    },
  });

  if (existente) return existente.id_tipo_repuesto;

  const categoria = await prisma.categorias_Repuestos.create({
    data: {
      nombre_tipo,
      electronico: electronicoNormalizado || null,
    },
  });

  return categoria.id_tipo_repuesto;
};

const normalizeRepuestoInput = async (body) => {
  const tipo_repuesto_id = await getCategoriaId(body);

  return {
    nombre: normalizeText(body.nombre),
    descripcion: normalizeText(body.descripcion),
    tipo_repuesto_id,
    ...(Object.prototype.hasOwnProperty.call(body, 'proveedor_id')
      ? { proveedor_id: body.proveedor_id ? Number(body.proveedor_id) : null }
      : {}),
    costo_individual: normalizeNumber(body.costo_individual),
    ganancia_cordobas: normalizeNumber(body.ganancia_cordobas),
  };
};

export const getRepuestos = async (req, res) => {
  try {
    const soloDisponibles = ['1', 'true', 'si', 'yes'].includes(String(req.query.disponibles || '').toLowerCase());
    const repuestos = await prisma.repuestos.findMany({
      where: {
        descontinuada: false,
        ...(soloDisponibles ? { stock_actual: { gt: 0 } } : {}),
      },
      include: { categoria: true, proveedor: true },
      orderBy: { id_repuesto: 'desc' },
    });
    res.json({ success: true, data: canViewStock(req.user) ? repuestos : repuestos.map(hideStock) });
  } catch (error) {
    console.error('Error en getRepuestos:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, message: 'Error al obtener repuestos', details: error.message });
  }
};

export const createRepuesto = async (req, res) => {
  try {
    const data = await normalizeRepuestoInput(req.body);

    if (!data.tipo_repuesto_id) {
      return res.status(400).json({ success: false, error: 'La categoria del repuesto es obligatoria' });
    }

    const repuesto = await prisma.repuestos.create({
      data: {
        ...data,
        descontinuada: false,
      },
      include: { categoria: true, proveedor: true },
    });

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
    const data = await normalizeRepuestoInput(req.body);

    if (!data.tipo_repuesto_id) {
      return res.status(400).json({ success: false, error: 'La categoria del repuesto es obligatoria' });
    }

    const repuesto = await prisma.repuestos.update({
      where: { id_repuesto: Number(id) },
      data,
      include: { categoria: true, proveedor: true },
    });

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
    await prisma.repuestos.update({
      where: { id_repuesto: Number(id) },
      data: { descontinuada: true },
    });
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
