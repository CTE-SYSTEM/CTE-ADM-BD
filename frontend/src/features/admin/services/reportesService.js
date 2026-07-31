import api from '../../../services/api';

const withQuery = (base, query = '') => `${base}${query ? `?${query}` : ''}`;

export const reportesAdminService = {
  getClientesEquipos: () => api.get('/admin_pro/reportes/equipos_cliente'),
  getCompras: (query = '') => api.get(withQuery('/admin_pro/reportes/compras', query)),
  getFacturacion: (query = '') => api.get(withQuery('/admin_pro/reportes/facturacion', query)),
  getInventario: () => api.get('/admin_pro/reportes/inventario'),
  getOrdenesEstado: (query = '') => api.get(withQuery('/admin_pro/reportes/ordenes_estado', query)),
  getRepuestosUsados: (query = '') => api.get(withQuery('/admin_pro/reportes/repuestos_usados', query)),
  getTecnicos: (query = '') => api.get(withQuery('/admin_pro/reportes/tecnicos', query)),
};
