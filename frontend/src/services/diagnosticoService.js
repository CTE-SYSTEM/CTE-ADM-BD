import api from './api';

export const createDiagnostico = (data) => api.post('/secretaria/diagnostico/create', data);

export const getDiagnosticos = () => api.get('/secretaria/diagnostico');

// AÑADE ESTA FUNCIÓN:
export const updateEstadoDiagnostico = (id, nuevoEstado) => 
    api.patch(`/secretaria/diagnostico/${id}/estado`, { estado: nuevoEstado });