import api from '../../../services/api';

export const usuariosService = {
  getUsuarios: () => api.get('/admin_pro/usuarios'),
  createUsuario: (data) => api.post('/admin_pro/usuarios', data),
  updateUsuario: (id, data) => api.put(`/admin_pro/usuarios/${id}`, data),
  updatePassword: (id, data) => api.put(`/admin_pro/usuarios/${id}/password`, data),
  toggleActivo: (id, activo) => api.put(`/admin_pro/usuarios/${id}`, { activo }),
};
