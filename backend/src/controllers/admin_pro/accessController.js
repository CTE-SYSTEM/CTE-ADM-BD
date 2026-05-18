// Middleware para restringir acceso solo a admin_pro / Administrador
export const onlyAdminPro = (req, res, next) => {
  const allowedRoles = ['admin_pro', 'Administrador', 'Admin'];
  if (!req.user || !allowedRoles.includes(req.user.rol)) {
    return res.status(403).json({ error: 'Acceso restringido a admin_pro' });
  }
  next();
};
