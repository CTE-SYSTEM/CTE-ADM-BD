import api from './api';

export const getEquipos = () => api.get('/equipos');
export const createEquipo = (data) => api.post('/equipos', data);
