-- Índices de apoyo para las bandejas del Jefe Técnico.
-- Las mutaciones y consultas operativas viven en Prisma.

CREATE INDEX IF NOT EXISTS idx_jefe_diagnosticos_sin_tecnico_estado
ON "Diagnosticos" (tecnico_id, estado_del_diagnostico, fecha_hora, id_diagnostico);

CREATE INDEX IF NOT EXISTS idx_jefe_ordenes_por_diagnostico
ON "Ordenes" (diagnostico_id);

CREATE INDEX IF NOT EXISTS idx_jefe_ordenes_sin_tecnico_estado
ON "Ordenes" (tecnico_id, estado, fecha_ingreso, id_orden);

CREATE INDEX IF NOT EXISTS idx_jefe_repuestos_estado_orden
ON "Ordenes_Repuestos" (estado_aprobacion, orden_id, id_detalle_repuesto);
