import bcrypt from 'bcryptjs';
import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';

const ROLES_ASIGNABLES = ['Secretaria', 'TecnicoJefe', 'Tecnico'];
const ROLES_ADMIN_PASSWORD = ['admin_pro', 'Administrador', 'Admin'];

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuarios.findMany();
    res.json({ data: usuarios });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios', details: error.message });
  }
};

export const createUsuario = async (req, res) => {
  try {
    const { nombre_usuario, correo_electronico, rol, password, contrasena_hash, activo, especialidad, horario, contacto } = req.body;
    if (!nombre_usuario || !rol || (!password && !contrasena_hash)) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    if (!ROLES_ASIGNABLES.includes(rol)) {
      return res.status(400).json({ error: 'No se permite asignar el rol Administrador ni admin_pro desde esta pantalla' });
    }

    const hash = password ? await bcrypt.hash(password, 10) : contrasena_hash;

    const [result] = await prisma.$queryRaw(Prisma.sql`
      SELECT admin_pro.crear_usuario(
        ${nombre_usuario},
        ${correo_electronico || null},
        ${rol},
        ${hash},
        ${activo !== undefined ? Boolean(activo) : true},
        ${especialidad || null},
        ${horario || null},
        ${contacto || null}
      ) AS data
    `);

    res.status(201).json({ data: result.data.usuario, tecnico: result.data.tecnico });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre_usuario')) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
    res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_usuario, correo_electronico, rol, activo } = req.body;

    if (rol !== undefined && !ROLES_ASIGNABLES.includes(rol)) {
      return res.status(400).json({ error: 'No se permite asignar el rol Administrador ni admin_pro desde esta pantalla' });
    }

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT admin_pro.actualizar_usuario(
        ${Number(id)},
        ${nombre_usuario ?? null},
        ${correo_electronico ?? null},
        ${rol ?? null},
        ${activo === undefined ? null : Boolean(activo)}
      ) AS data
    `);
    const usuario = row?.data;

    if (usuario?.error) return res.status(404).json({ error: usuario.error });
    res.json({ data: usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario', details: error.message });
  }
};

export const updateUsuarioPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, admin_password } = req.body;

    if (!ROLES_ADMIN_PASSWORD.includes(req.user?.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para cambiar contrasenas de usuarios' });
    }

    if (!admin_password) {
      return res.status(400).json({ error: 'La contrasena del administrador es obligatoria' });
    }

    const admin = await prisma.usuarios.findUnique({
      where: { id_usuario: Number(req.user.id) },
      select: { contrasena_hash: true },
    });

    const adminPasswordValid = admin?.contrasena_hash
      ? await bcrypt.compare(String(admin_password), admin.contrasena_hash)
      : false;

    if (!adminPasswordValid) {
      return res.status(403).json({ error: 'La contrasena del administrador no es valida' });
    }

    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({ error: 'La nueva contrasena debe tener al menos 6 caracteres' });
    }

    const hash = await bcrypt.hash(String(password), 10);
    const [result] = await prisma.$queryRaw(Prisma.sql`
      SELECT admin_pro.cambiar_password_usuario(${req.user?.rol}, ${Number(id)}, ${hash}) AS data
    `);

    if (result?.data?.error) return res.status(400).json({ error: result.data.error });

    res.json({ message: 'Contrasena actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contrasena', details: error.message });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const [row] = await prisma.$queryRaw(Prisma.sql`SELECT admin_pro.desactivar_usuario(${Number(id)}) AS data`);
    const usuario = row?.data;

    if (usuario?.error) return res.status(404).json({ error: usuario.error });
    res.json({ data: usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar usuario', details: error.message });
  }
};

// 6. Monitoreo general
