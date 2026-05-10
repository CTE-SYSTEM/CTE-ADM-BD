import api from '../api';

export const getTiposRepuesto = () => api.get('/tipos-repuesto');
export const createTipoRepuesto = (data) => api.post('/tipos-repuesto', data);
export const updateTipoRepuesto = (id, data) => api.put(`/tipos-repuesto/${id}`, data);
export const deleteTipoRepuesto = (id) => api.delete(`/tipos-repuesto/${id}`);
