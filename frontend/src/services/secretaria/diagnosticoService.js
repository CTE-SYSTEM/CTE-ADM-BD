// frontend/src/services/secretaria/diagnosticoService.js
import api from '../api';

export const createDiagnostico = async (diagnosticoData) => {
  const payload = {
    ...diagnosticoData,
    equipo_id: Number.parseInt(diagnosticoData.equipo_id, 10),
    cliente_id: Number.parseInt(diagnosticoData.cliente_id, 10),
    deja_cargador: diagnosticoData.deja_cargador === true || diagnosticoData.deja_cargador === 'true',
    enciende: diagnosticoData.enciende === true || diagnosticoData.enciende === 'true',
    usa_corriente_ac: diagnosticoData.usa_corriente_ac === true || diagnosticoData.usa_corriente_ac === 'true',
  };

  return api.post('/secretaria/diagnostico/create', payload);
};

export const getDiagnosticos = () => api.get('/secretaria/diagnostico');

export const updateDiagnostico = (id, diagnosticoData) => {
  const payload = {
    ...diagnosticoData,
    equipo_id: Number.parseInt(diagnosticoData.equipo_id, 10),
    cliente_id: Number.parseInt(diagnosticoData.cliente_id, 10),
    deja_cargador: diagnosticoData.deja_cargador === true || diagnosticoData.deja_cargador === 'true',
    enciende: diagnosticoData.enciende === true || diagnosticoData.enciende === 'true',
    usa_corriente_ac: diagnosticoData.usa_corriente_ac === true || diagnosticoData.usa_corriente_ac === 'true',
  };

  return api.put(`/secretaria/diagnostico/${id}`, payload);
};

export const updateEstadoDiagnostico = (id, nuevoEstado) =>
  api.patch(`/secretaria/diagnostico/${id}/estado`, { estado: nuevoEstado });