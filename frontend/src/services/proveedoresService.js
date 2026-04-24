import api from './api';

export const getProveedores = () => api.get('/proveedores');
export const createProveedor = (data) => api.post('/proveedores', data);
