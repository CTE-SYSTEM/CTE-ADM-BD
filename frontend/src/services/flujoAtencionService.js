import api from './api';

export const getFlujoAtencion = ({ filtro = 'todos', search = '' } = {}) =>
  api.get('/flujo-atencion', { params: { filtro, search } });

export default {
  getFlujoAtencion,
};
