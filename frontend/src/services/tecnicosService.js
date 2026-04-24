import api from './api';

export const getTecnicos = () => api.get('/tecnicos');
export const createTecnico = (data) => api.post('/tecnicos', data);
