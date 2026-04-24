import api from './api';

export const getFacturas = () => api.get('/facturas');
export const createFactura = (data) => api.post('/facturas', data);
