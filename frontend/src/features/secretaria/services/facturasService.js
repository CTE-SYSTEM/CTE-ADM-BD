import api from '../../../services/api';

export const getFacturas = (params = {}) => api.get('/facturas', { params });
export const getOrdenesParaFacturar = () => api.get('/facturas/ordenes-disponibles');
export const createFactura = (data) => api.post('/facturas', data);
