import api from '../../../services/api';

export const tecnicosAdminService = {
  getTecnicos: () => api.get('/tecnicos'),
};
