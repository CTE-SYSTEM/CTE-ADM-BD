import api from './api';

export const getAuth = () => api.get('/auth');
export const createAuth = (data) => api.post('/auth', data);
