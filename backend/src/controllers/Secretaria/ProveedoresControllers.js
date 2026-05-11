// controllers/Secretaria/ProveedoresControllers.js
import prisma from '../../app/prismaClient.js';

const normalizeText = (value = '') => String(value).trim().replace(/\s+/g, ' ');
const normalizeNullableText = (value = '') => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const normalizeUrl = (value = '') => {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
};

const validateEmail = (correo) => !correo || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

export const getProveedores = async (req, res) => {
  try {
    const proveedores = await prisma.proveedores.findMany({
      where: { descontinuada: false },
      orderBy: { id_proveedor: 'desc' },
    });

    res.json({ data: proveedores });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores', details: error.message });
  }
};

export const getProveedorById = async (req, res) => {
  try {
    const proveedor = await prisma.proveedores.findUnique({
      where: { id_proveedor: Number(req.params.id) },
      include: { compras: true },
    });

    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json({ data: proveedor });
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ error: 'Error al obtener proveedor', details: error.message });
  }
};

export const createProveedor = async (req, res) => {
  try {
    const nombre = normalizeText(req.body.nombre);
    const telefono = normalizeNullableText(req.body.telefono);
    const direccion = normalizeNullableText(req.body.direccion);
    const correo = normalizeNullableText(req.body.correo);
    const web = normalizeUrl(req.body.web);
    const notas = normalizeNullableText(req.body.notas);

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (!validateEmail(correo)) {
      return res.status(400).json({ error: 'El correo del proveedor no tiene un formato valido' });
    }

    const existente = await prisma.proveedores.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        descontinuada: false,
      },
    });

    if (existente) {
      return res.status(409).json({ error: 'Ya existe un proveedor activo con ese nombre' });
    }

    const proveedor = await prisma.proveedores.create({
      data: { nombre, telefono, direccion, correo, web, notas, descontinuada: false },
    });

    res.status(201).json({ data: proveedor });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor', details: error.message });
  }
};

export const updateProveedor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const nombre = normalizeText(req.body.nombre);
    const telefono = normalizeNullableText(req.body.telefono);
    const direccion = normalizeNullableText(req.body.direccion);
    const correo = normalizeNullableText(req.body.correo);
    const web = normalizeUrl(req.body.web);
    const notas = normalizeNullableText(req.body.notas);

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (!validateEmail(correo)) {
      return res.status(400).json({ error: 'El correo del proveedor no tiene un formato valido' });
    }

    const duplicado = await prisma.proveedores.findFirst({
      where: {
        id_proveedor: { not: id },
        nombre: { equals: nombre, mode: 'insensitive' },
        descontinuada: false,
      },
    });

    if (duplicado) {
      return res.status(409).json({ error: 'Ya existe otro proveedor activo con ese nombre' });
    }

    const proveedor = await prisma.proveedores.update({
      where: { id_proveedor: id },
      data: { nombre, telefono, direccion, correo, web, notas },
    });

    res.json({ data: proveedor });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar proveedor', details: error.message });
  }
};

export const deleteProveedor = async (req, res) => {
  try {
    await prisma.proveedores.update({
      where: { id_proveedor: Number(req.params.id) },
      data: { descontinuada: true }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    res.status(500).json({ error: 'Error al desactivar proveedor' });
  }
};
