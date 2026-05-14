import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

let io = null;

const normalizeRole = (role) =>
  String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]/g, '')
    .toLowerCase();

export const initializeNotifications = (server, allowedOrigins) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token proporcionado'));

      const payload = jwt.verify(token, JWT_SECRET);
      socket.user = {
        id: payload.id,
        username: payload.username,
        rol: payload.rol,
      };
      socket.join(`role:${normalizeRole(payload.rol)}`);
      socket.join(`user:${payload.id}`);
      return next();
    } catch {
      return next(new Error('Token invalido'));
    }
  });

  io.on('connection', (socket) => {
    socket.emit('notificacion:conectado', {
      message: 'Notificaciones activas',
      timestamp: new Date().toISOString(),
    });
  });

  return io;
};

export const notifyRole = (role, payload) => {
  if (!io) return;
  io.to(`role:${normalizeRole(role)}`).emit('notificacion', {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    ...payload,
  });
};

export const notifyJefeTecnico = (payload) => {
  notifyRole('TecnicoJefe', payload);
};

export const notifyTecnico = (tecnico, payload) => {
  if (!io || !tecnico?.usuario_id) return;
  io.to(`user:${tecnico.usuario_id}`).emit('notificacion', {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    ...payload,
  });
};
