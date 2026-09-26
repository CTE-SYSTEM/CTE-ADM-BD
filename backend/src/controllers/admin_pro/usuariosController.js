import bcrypt from 'bcryptjs';
import prisma from '../../app/prismaClient.js';

const ROLES_ASIGNABLES = ['Secretaria', 'TecnicoJefe', 'Tecnico'];
const ROLES_ADMIN_PASSWORD = ['admin_pro', 'Administrador', 'Admin'];

const withoutPassword = (usuario) => {
  if (!usuario) return usuario;
  const { contrasena_hash, ...publico } = usuario;
  return publico;
};

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuarios.findMany({
      select: {
        id_usuario: true,
        nombre_usuario: true,
        correo_electronico: true,
        rol: true,
        activo: true,
        fecha_creacion: true,
        tecnico: true,
      },
      orderBy: { id_usuario: 'asc' },
    });
    res.json({ data: usuarios });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios', details: error.message });
  }
};

export const createUsuario = async (req, res) => {
  try {
    const { nombre_usuario, correo_electronico, rol, password, contrasena_hash, activo, especialidad, horario, contacto } = req.body;
    const username = String(nombre_usuario || '').trim();
    if (!username || !rol || (!password && !contrasena_hash)) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    if (!ROLES_ASIGNABLES.includes(rol)) {
      return res.status(400).json({ error: 'No se permite asignar el rol Administrador ni admin_pro desde esta pantalla' });
    }

    const hash = password ? await bcrypt.hash(password, 10) : contrasena_hash;

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuarios.create({
        data: {
          nombre_usuario: username,
          correo_electronico: correo_electronico?.trim() || null,
          rol,
          contrasena_hash: hash,
          activo: activo !== undefined ? Boolean(activo) : true,
        },
      });
      let tecnico = null;
      if (rol === 'Tecnico') {
        tecnico = await tx.tecnicos.create({
          data: {
            usuario_id: usuario.id_usuario,
            nombre: username,
            especialidad: especialidad?.trim() || null,
            horario: horario?.trim() || null,
            contacto: contacto?.trim() || correo_electronico?.trim() || null,
            activo: true,
          },
        });
      }
      return { usuario: withoutPassword(usuario), tecnico };
    });

    res.status(201).json(result);
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

    const usuarioId = Number(id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) return res.status(400).json({ error: 'ID de usuario inválido' });
    if (nombre_usuario !== undefined && !String(nombre_usuario).trim()) {
      return res.status(400).json({ error: 'El nombre de usuario no puede estar vacío' });
    }
    const usuarioActual = await prisma.usuarios.findUnique({ where: { id_usuario: usuarioId } });
    if (!usuarioActual) return res.status(404).json({ error: 'Usuario no encontrado' });
    const usuario = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.usuarios.update({
        where: { id_usuario: usuarioId },
        data: {
          nombre_usuario: nombre_usuario === undefined || nombre_usuario === null ? usuarioActual.nombre_usuario : String(nombre_usuario).trim(),
          correo_electronico: correo_electronico === undefined ? usuarioActual.correo_electronico : correo_electronico?.trim() || null,
          rol: rol === undefined || rol === null ? usuarioActual.rol : rol,
          activo: activo === undefined ? usuarioActual.activo : Boolean(activo),
        },
      });

      if (actualizado.rol === 'Tecnico') {
        await tx.tecnicos.upsert({
          where: { usuario_id: usuarioId },
          update: { nombre: actualizado.nombre_usuario, activo: actualizado.activo },
          create: { usuario_id: usuarioId, nombre: actualizado.nombre_usuario, activo: actualizado.activo },
        });
      }
      return actualizado;
    });
    res.json({ data: withoutPassword(usuario) });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'El nombre de usuario ya existe' });
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

    const usuarioId = Number(id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) return res.status(400).json({ error: 'ID de usuario inválido' });
    const result = await prisma.usuarios.updateMany({
      where: { id_usuario: usuarioId },
      data: { contrasena_hash: await bcrypt.hash(String(password), 10) },
    });
    if (!result.count) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ message: 'Contrasena actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contrasena', details: error.message });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID de usuario inválido' });
    const usuario = await prisma.usuarios.update({
      where: { id_usuario: id },
      data: { activo: false },
    });
    res.json({ data: withoutPassword(usuario) });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' });
    res.status(500).json({ error: 'Error al desactivar usuario', details: error.message });
  }
};

// 6. Monitoreo general
