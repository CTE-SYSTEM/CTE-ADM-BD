import api from '../../../services/api';

export const repuestosJefeService = {
  getPendientesAprobacion: () => api.get('/diagnosticos/repuestos/pendientes-aprobacion'),
  aprobar: (id_detalle_repuesto) =>
    api.patch(`/diagnosticos/repuestos/${id_detalle_repuesto}/aprobar`),
  rechazar: (id_detalle_repuesto) =>
    api.patch(`/diagnosticos/repuestos/${id_detalle_repuesto}/rechazar`),
};

export default repuestosJefeService;
