import { normalizeRole } from './roles.js';

export const PERMISSIONS = {
  CLIENTES_GESTIONAR: 'clientes:gestionar',
  EQUIPOS_GESTIONAR: 'equipos:gestionar',
  DIAGNOSTICOS_GESTIONAR: 'diagnosticos:gestionar',
  ORDENES_GESTIONAR: 'ordenes:gestionar',
  FACTURAS_GESTIONAR: 'facturas:gestionar',
  GARANTIAS_GESTIONAR: 'garantias:gestionar',
  REPUESTOS_GESTIONAR: 'repuestos:gestionar',
  COMPRAS_GESTIONAR: 'compras:gestionar',
  PROVEEDORES_GESTIONAR: 'proveedores:gestionar',
  FLUJO_VER: 'flujo:ver',
  TECNICO_TRABAJO: 'tecnico:trabajo',
  JEFE_TECNICO_APROBAR: 'jefe-tecnico:aprobar',
  ADMIN_USUARIOS: 'admin:usuarios',
  ADMIN_REPORTES: 'admin:reportes',
};

const secretariaPermissions = [
  PERMISSIONS.CLIENTES_GESTIONAR,
  PERMISSIONS.EQUIPOS_GESTIONAR,
  PERMISSIONS.DIAGNOSTICOS_GESTIONAR,
  PERMISSIONS.ORDENES_GESTIONAR,
  PERMISSIONS.FACTURAS_GESTIONAR,
  PERMISSIONS.GARANTIAS_GESTIONAR,
  PERMISSIONS.REPUESTOS_GESTIONAR,
  PERMISSIONS.COMPRAS_GESTIONAR,
  PERMISSIONS.PROVEEDORES_GESTIONAR,
  PERMISSIONS.FLUJO_VER,
];

const tecnicoPermissions = [
  PERMISSIONS.TECNICO_TRABAJO,
];

const jefeTecnicoPermissions = [
  PERMISSIONS.DIAGNOSTICOS_GESTIONAR,
  PERMISSIONS.ORDENES_GESTIONAR,
  PERMISSIONS.REPUESTOS_GESTIONAR,
  PERMISSIONS.FLUJO_VER,
  PERMISSIONS.JEFE_TECNICO_APROBAR,
];

const adminPermissions = [
  ...secretariaPermissions,
  ...tecnicoPermissions,
  ...jefeTecnicoPermissions,
  PERMISSIONS.ADMIN_USUARIOS,
  PERMISSIONS.ADMIN_REPORTES,
];

export const ROLE_PERMISSIONS = {
  secretaria: secretariaPermissions,
  tecnico: tecnicoPermissions,
  tecnicojefe: jefeTecnicoPermissions,
  administrador: adminPermissions,
  adminpro: adminPermissions,
};

export const getRolePermissions = (role) => ROLE_PERMISSIONS[normalizeRole(role)] || [];

export const hasPermission = (role, permission) =>
  getRolePermissions(role).includes(permission);

export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  if (!hasPermission(req.user.rol, permission)) {
    return res.status(403).json({ error: 'No autorizado para esta accion' });
  }

  return next();
};

export default {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getRolePermissions,
  hasPermission,
  requirePermission,
};
