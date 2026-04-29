import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_provisional';

export const login = async (req, res) => {
  console.log("--------------------------------------------------");
  console.log("🚀 INTENTO DE LOGIN RECIBIDO");
  
  try {
    const { username, password } = req.body;
    console.log(`📩 Datos recibidos -> Usuario: [${username}], Password: [${password}]`);

    if (!username || !password) {
      console.log("❌ FALLO: Campos vacíos");
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
    }

    // 1. Buscamos al usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { nombre_usuario: username }
    });

    if (!usuario) {
      console.log(`❌ FALLO: El usuario [${username}] NO existe en la base de datos.`);
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    console.log(`✅ Usuario encontrado: [${usuario.nombre_usuario}] con Rol: [${usuario.rol}]`);
    console.log(`🔑 Hash en DB: ${usuario.contrasena_hash}`);

    // 2. Comparación de contraseña
    const esValida = await bcrypt.compare(password, usuario.contrasena_hash);

    if (!esValida) {
      console.log(`❌ FALLO: La contraseña para [${username}] es INCORRECTA.`);
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // 3. ÉXITO
    console.log("🎉 ÉXITO: Contraseña correcta. Generando token...");

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log("📦 Enviando respuesta exitosa al frontend.");
    return res.json({
      token,
      id: usuario.id_usuario,
      nombre: usuario.nombre_usuario,
      rol: usuario.rol
    });

  } catch (error) {
    console.error("🔥 ERROR CRÍTICO:", error);
    return res.status(500).json({ message: 'Error interno en el servidor' });
  }
};