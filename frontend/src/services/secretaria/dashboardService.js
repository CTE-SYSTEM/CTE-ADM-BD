import api from '../api';

export const getSecretariaDashboard = (periodo = 'all') =>
  api.get('/secretaria/dashboard', { params: { periodo }, cache: false });
