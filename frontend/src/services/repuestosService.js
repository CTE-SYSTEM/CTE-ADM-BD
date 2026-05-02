import api from './api';

export const getRepuestos = () => api.get('/repuestos');
export const createRepuesto = (data) => api.post('/repuestos', data);
export const updateRepuesto = (id, data) => api.put(`/repuestos/${id}`, data);
export const deleteRepuesto = (id) => api.delete(`/repuestos/${id}`);
