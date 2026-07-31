import api from '../../../services/api';

export const ordenesAdminService = {
  getOrdenes: () => api.get('/admin_pro/ordenes'),
  updateOrden: (id, data) => api.put(`/admin_pro/ordenes/${id}`, data),
  getRepuestos: (id) => api.get(`/admin_pro/ordenes/${id}/repuestos`),
  getRepuestosReporte: (id, config = {}) => api.get(`/admin_pro/ordenes/${id}/repuestos/reporte`, config),
  getReporteEstado: (query = '') => api.get(`/admin_pro/reportes/ordenes_estado${query ? `?${query}` : ''}`),
};
