import api from './api';

export const getOrdenes = () => api.get('/ordenes');
export const createOrden = (data) => api.post('/ordenes', data);
export const updateOrden = (id, data) => api.put(`/ordenes/${id}`, data);
export const deleteOrden = (id) => api.delete(`/ordenes/${id}`);
