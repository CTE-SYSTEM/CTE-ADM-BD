import api from '../../../services/api';

export const equiposAdminService = {
  getEquipos: () => api.get('/admin_pro/equipos'),
  updateEquipo: (id, data) => api.put(`/admin_pro/equipos/${id}`, data),
  getHistorial: (id) => api.get(`/admin_pro/equipos/${id}/historial`),
};
