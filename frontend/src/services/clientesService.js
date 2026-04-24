import api from './api';

export const getClientes = () => api.get('/clientes');
export const createCliente = (data) => api.post('/clientes', data);
