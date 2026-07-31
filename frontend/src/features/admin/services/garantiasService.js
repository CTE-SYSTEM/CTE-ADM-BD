import api from '../../../services/api';

export const garantiasAdminService = {
  getGarantias: () => api.get('/admin_pro/garantias'),
  getFacturas: () => api.get('/admin_pro/facturas'),
  getEquipos: () => api.get('/admin_pro/equipos'),
  createGarantia: (data) => api.post('/admin_pro/garantias', data),
  renovarGarantia: (id, data) => api.post(`/admin_pro/garantias/${id}/renovar`, data),
};
