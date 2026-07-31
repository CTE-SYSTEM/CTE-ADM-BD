import api from '../../../services/api';

export const gananciasAdminService = {
  getGanancias: (query, config = {}) => api.get(`/admin_pro/analitica/ganancias?${query}`, config),
};
