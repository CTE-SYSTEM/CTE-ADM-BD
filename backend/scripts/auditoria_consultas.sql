-- Consultas utiles para ver la auditoria en PostgreSQL.

-- 1. Ver los ultimos movimientos registrados.
SELECT
  id_auditoria,
  tabla,
  operacion,
  registro_pk,
  usuario_nombre,
  origen,
  observacion,
  fecha_movimiento
FROM "Auditoria_Movimientos"
ORDER BY fecha_movimiento DESC, id_auditoria DESC
LIMIT 100;

-- 2. Resumen por operacion.
SELECT
  operacion,
  COUNT(*) AS total
FROM "Auditoria_Movimientos"
GROUP BY operacion
ORDER BY operacion;

-- 3. Resumen por tabla y operacion.
SELECT
  tabla,
  operacion,
  COUNT(*) AS total
FROM "Auditoria_Movimientos"
GROUP BY tabla, operacion
ORDER BY tabla, operacion;

-- 4. Ver solo borrados fisicos.
SELECT
  id_auditoria,
  tabla,
  registro_pk,
  datos_anteriores,
  usuario_nombre,
  observacion,
  fecha_movimiento
FROM "Auditoria_Movimientos"
WHERE operacion = 'DELETE'
ORDER BY fecha_movimiento DESC, id_auditoria DESC;

-- 5. Capturar el estado actual como snapshot inicial o corte manual.
-- Ejecutar solo cuando se quiera guardar una foto de todos los datos actuales,
-- porque cada ejecucion agrega otro lote CARGA_INICIAL.
-- SELECT auditoria_capturar_estado_actual('Snapshot manual antes de entrega') AS registros_auditados;
