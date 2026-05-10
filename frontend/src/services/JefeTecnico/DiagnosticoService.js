// services/JefeTecnico/DiagnosticoService.js
import api from '../api';

export const diagnosticoService = {
  // Obtener todos los diagnósticos con sus equipos y clientes
  // Útil para la "Cola de Trabajo" del Jefe Técnico
  getAllDiagnosticos: () => api.get('/diagnosticos'),

  // Obtener solo los que no tienen técnico asignado aún
  getDiagnosticosPendientes: () => api.get('/diagnosticos/pendientes-asignar'),

  // Asignar un técnico a un diagnóstico específico
  asignarTecnico: (id_diagnostico, id_tecnico) => 
    api.patch(`/diagnosticos/${id_diagnostico}/asignar`, { id_tecnico }),

  // Actualizar el estado del diagnóstico (ej. de PENDIENTE a EN_REVISION)
  updateEstado: (id_diagnostico, estado_del_diagnostico) => 
    api.patch(`/diagnosticos/${id_diagnostico}/estado`, { estado_del_diagnostico }),

  // Obtener un diagnóstico detallado por ID
  getById: (id) => api.get(`/diagnosticos/${id}`),

  // Métodos para el dashboard
  getPendientes: () => api.get('/diagnosticos/pendientes-asignar'),
  getTodos: () => api.get('/diagnosticos/todos'),
  getOrdenes: () => api.get('/diagnosticos/ordenes'),
  getOrdenById: (id) => api.get(`/diagnosticos/ordenes/${id}`),
  updateOrden: (id_orden, ordenData) => api.put(`/diagnosticos/ordenes/${id_orden}`, ordenData),
  getRepuestos: () => api.get('/diagnosticos/repuestos'),
  getTecnicos: () => api.get('/diagnosticos/tecnicos'),
  asignar: (id_diagnostico, id_tecnico) => 
    api.patch(`/diagnosticos/${id_diagnostico}/asignar`, { id_tecnico }),
  asignarOrden: (id_orden, id_tecnico) => 
    api.patch(`/diagnosticos/orden/${id_orden}/asignar`, { id_tecnico })
};
