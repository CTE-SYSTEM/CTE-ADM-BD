// frontend/src/services/secretaria/ordenesService.js
import api from '../api'; // Agregamos un punto extra para subir a la carpeta services

export const getOrdenes = () => api.get('/ordenes');
export const createOrden = (data) => api.post('/ordenes', data);
export const updateOrden = (id, data) => api.put(`/ordenes/${id}`, data);
export const deleteOrden = (id) => api.delete(`/ordenes/${id}`);

export const ordenesService = {
  getTodas: getOrdenes,
  getAprobadas: () => api.get('/diagnosticos/ordenes/aprobadas'),
  asignarOrden: (id_orden, id_tecnico) =>
    api.patch(`/diagnosticos/orden/${id_orden}/asignar`, { id_tecnico }),
};
