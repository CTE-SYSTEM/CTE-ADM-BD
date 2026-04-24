import api from './api';

export const getGarantias = () => api.get('/garantias');
export const createGarantia = (data) => api.post('/garantias', data);
