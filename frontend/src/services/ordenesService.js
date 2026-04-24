import api from './api';

export const getOrdenes = () => api.get('/ordenes');
export const createOrden = (data) => api.post('/ordenes', data);
