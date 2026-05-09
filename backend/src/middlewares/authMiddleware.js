import jwt from 'jsonwebtoken';
import prisma from '../app/prismaClient.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

const authMiddleware = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token proporcionado' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.usuarios.findUnique({ where: { id_usuario: payload.id } });
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.user = { id: user.id_usuario, username: user.nombre_usuario, rol: user.rol };
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export default authMiddleware;
