import bcrypt from 'bcryptjs';
import prisma from '../../app/prismaClient.js';

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

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuarios.create({
        data: {
          nombre_usuario,
          contrasena_hash: hash,
          correo_electronico,
          rol,
          activo: activo !== undefined ? activo : true,
        },
      });

      if (rol === 'Tecnico') {
        const tecnico = await tx.tecnicos.create({
          data: {
            usuario_id: usuario.id_usuario,
            nombre: nombre_usuario,
            especialidad: especialidad || null,
            horario: horario || null,
            contacto: contacto || correo_electronico || null,
            activo: true,
          },
        });

        return { usuario, tecnico };
      }

      return { usuario };
    });

    res.status(201).json({ data: result.usuario, tecnico: result.tecnico });
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

    const usuario = await prisma.usuarios.update({
      where: { id_usuario: Number(id) },
      data: { nombre_usuario, correo_electronico, rol, activo }
    });
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
    await prisma.usuarios.update({
      where: { id_usuario: Number(id) },
      data: { contrasena_hash: hash },
    });

    res.json({ message: 'Contrasena actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contrasena', details: error.message });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuarios.update({
      where: { id_usuario: Number(id) },
      data: { activo: false }
    });
    res.json({ data: usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar usuario', details: error.message });
  }
};

// 6. Monitoreo general
