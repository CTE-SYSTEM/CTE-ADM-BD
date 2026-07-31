import api from '../../../services/api';

export const inventarioAdminService = {
  getRepuestos: () => api.get('/admin_pro/repuestos'),
  createRepuesto: (data) => api.post('/admin_pro/repuestos', data),
  getHistorialRepuesto: (id) => api.get(`/admin_pro/repuestos/${id}/historial`),
};
