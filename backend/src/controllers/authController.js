// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../app/prismaClient.js'; // Asegúrate de agregar el .js

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Registro de usuario
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    // Ajusté 'user' a 'Usuarios' para que coincida con tu schema.prisma
    const existing = await prisma.usuarios.findUnique({ where: { nombre_usuario: username } });
    if (existing) return res.status(409).json({ error: 'Usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.usuarios.create({ 
      data: { 
        nombre_usuario: username, 
        contrasena_hash: hashedPassword,
        rol: 'Tecnico' // Rol por defecto
      } 
    });
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en registro' });
  }
};

// Login de usuario
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const user = await prisma.usuarios.findUnique({ where: { nombre_usuario: username } });
    if (!user || !(await bcrypt.compare(password, user.contrasena_hash))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user.id_usuario }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en login' });
  }
};

// Rutas de prueba
export const getAuth = (req, res) => res.json({ ok: true, message: 'Ruta auth funcionando' });
export const createAuth = (req, res) => res.json({ ok: true, message: 'Auth creado' });