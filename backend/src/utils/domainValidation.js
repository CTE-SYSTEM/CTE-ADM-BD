export const DIAGNOSTICO_ESTADOS = ['PENDIENTE', 'INGRESADO', 'EN_REVISION', 'DIAGNOSTICADO', 'COMPLETADO', 'APROBADO', 'RECHAZADO'];
export const ORDEN_ESTADOS = ['PENDIENTE', 'APROBADO', 'EN_REPARACION', 'ESPERANDO_PIEZA', 'FINALIZADO', 'IRREPARABLE', 'ENTREGADO'];
export const RESULTADOS_ORDEN = ['REPARADO', 'IRREPARABLE'];
export const REPUESTO_ESTADOS = ['PENDIENTE', 'APROBADO', 'DENEGADO'];
export const PRIORIDADES = ['Normal', 'Alta', 'Urgente', 'NORMAL', 'ALTA', 'URGENTE'];
export const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'];

export const normalizeOptionalText = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
};

export const parsePositiveId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const parseNonNegativeMoney = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return 0;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${fieldName} debe ser un numero mayor o igual a cero`);
  }
  return Math.round(numberValue * 100) / 100;
};

export const assertInList = (value, allowed, fieldName) => {
  if (value === undefined || value === null || value === '') return null;
  if (!allowed.includes(value)) {
    throw new Error(`${fieldName} no es valido`);
  }
  return value;
};
