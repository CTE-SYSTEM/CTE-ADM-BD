import api from '../../../services/api';

export const diagnosticosAdminService = {
  getDiagnosticos: () => api.get('/admin_pro/diagnosticos'),
  getReporteEstado: (query = '') => api.get(`/admin_pro/reportes/diagnosticos_estado${query ? `?${query}` : ''}`),
  updateDiagnostico: (id, data) => api.put(`/admin_pro/diagnosticos/${id}`, data),
};
