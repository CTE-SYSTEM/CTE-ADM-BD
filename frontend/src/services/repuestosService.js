import api from './api';

export const getRepuestos = () => api.get('/repuestos');
export const createRepuesto = (data) => api.post('/repuestos', data);
