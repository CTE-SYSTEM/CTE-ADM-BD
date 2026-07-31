import api from '../../../services/api';

export const dashboardService = {
  getDashboard: () => api.get('/admin_pro/dashboard'),
  getEquipos: () => api.get('/admin_pro/equipos'),
  getProductividad: () => api.get('/admin_pro/analitica/productividad'),
  getGanancias: (params = {}) => api.get('/admin_pro/analitica/ganancias', { params }),
  getBackups: () => api.get('/admin_pro/backups', { cache: false }),
  createManualBackup: () => api.post('/admin_pro/backups/manual'),
};
