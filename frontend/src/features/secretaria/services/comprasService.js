import api from '../../../services/api';

export const getCompras = () => api.get('/compras');
export const createCompra = (data) => api.post('/compras', data);
