import api from '../api';

export const getFacturas = () => api.get('/facturas');
export const getOrdenesParaFacturar = () => api.get('/facturas/ordenes-disponibles');
export const createFactura = (data) => api.post('/facturas', data);
