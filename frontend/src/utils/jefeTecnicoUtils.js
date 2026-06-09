// frontend/src/pages/TecnicoJefe/utils.js

export const getData = (response) => response?.data?.data || response?.data || [];

export const getRowKey = (row) => {
  if (row.id_diagnostico) return `diagnostico-${row.id_diagnostico}`;
  if (row.id_orden) return `orden-${row.id_orden}`;
  return `repuesto-${row.id_detalle_repuesto}`;
};

export const getTecnicoId = (row) =>
  row.tecnico_id
  ?? row.id_tecnico
  ?? row.tecnico?.id_tecnico
  ?? row.orden?.tecnico_id
  ?? row.orden?.tecnico?.id_tecnico
  ?? row.diagnostico?.tecnico_id
  ?? row.diagnostico?.tecnico?.id_tecnico
  ?? row.orden?.diagnostico?.tecnico_id
  ?? row.orden?.diagnostico?.tecnico?.id_tecnico
  ?? '';

export const getEquipo = (row) => row.equipo || row.diagnostico?.equipo || row.orden?.diagnostico?.equipo;

export const getCorreccionTipo = (row) => row.__tipo || (row.id_detalle_repuesto ? 'repuesto' : row.id_orden ? 'orden' : 'diagnostico');

export const getCorreccionId = (row) => row.id_diagnostico || row.id_orden || row.id_detalle_repuesto;

// 👉 Optimizada para seguir las reglas del trigger de 1 hora
export const getFechaBase = (row) =>
  row.fecha_asignacion || // Crucial para diagnósticos asignados
  row.fecha_ingreso ||    // Crucial para órdenes creadas
  row.updatedAt ||
  row.fecha_hora ||
  row.createdAt ||
  row.orden?.fecha_asignacion ||
  row.orden?.fecha_ingreso ||
  row.diagnostico?.fecha_hora;

// 👉 NUEVA FUNCIÓN: Calcula la diferencia exacta en minutos
export const getMinutosDesdeUltimoAvance = (row) => {
  const fechaBase = getFechaBase(row);
  if (!fechaBase) return null;

  const fecha = new Date(fechaBase);
  if (Number.isNaN(fecha.getTime())) return null;

  // Retorna la diferencia directamente en minutos enteros
  return Math.floor((new Date() - fecha) / (1000 * 60));
};
