import jwt from 'jsonwebtoken';
import prisma from '../app/prismaClient.js';
import { env } from '../config/env.js';
import { normalizeRole } from '../utils/roles.js';
export { requirePermission } from '../utils/permissions.js';

const authMiddleware = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token proporcionado' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.usuarios.findUnique({ where: { id_usuario: payload.id } });
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.user = { id: user.id_usuario, username: user.nombre_usuario, rol: user.rol };
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const requireRole = (...roles) => {
  const allowed = roles.map(normalizeRole);
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!allowed.includes(normalizeRole(req.user.rol))) {
      return res.status(403).json({ error: 'No autorizado para esta accion' });
    }

    return next();
  };
};

export default authMiddleware;
