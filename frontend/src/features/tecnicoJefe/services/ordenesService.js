import api from '../../../services/api';

export const ordenesJefeService = {
  getAprobadas: () => api.get('/diagnosticos/ordenes/aprobadas'),
  asignarOrden: (id_orden, id_tecnico) =>
    api.patch(`/diagnosticos/orden/${id_orden}/asignar`, { id_tecnico }),
};

export default ordenesJefeService;
