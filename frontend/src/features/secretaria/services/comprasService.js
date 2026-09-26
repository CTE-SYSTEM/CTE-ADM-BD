import api from '../../../services/api';

export const getCompras = (params = {}) => api.get('/compras', { params });
export const createCompra = (data) => api.post('/compras', data);
