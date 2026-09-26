-- Índices para las consultas paginadas y búsquedas de Secretaría.
-- Se ejecuta de forma idempotente desde scripts/load_functions.sql.

CREATE INDEX IF NOT EXISTS idx_clientes_nombre_busqueda
ON "Clientes" (lower(nombre));

CREATE INDEX IF NOT EXISTS idx_equipos_busqueda_cliente
ON "Equipos" (cliente_id, id_equipo DESC);

CREATE INDEX IF NOT EXISTS idx_diagnosticos_tecnico_id
ON "Diagnosticos" (tecnico_id);

CREATE INDEX IF NOT EXISTS idx_compras_fecha_id
ON "Compras" (fecha_obtencion DESC, id_compra DESC);

CREATE INDEX IF NOT EXISTS idx_compras_proveedor_id
ON "Compras" (proveedor_id);

CREATE INDEX IF NOT EXISTS idx_compras_repuesto_id
ON "Compras" (repuesto_id);

CREATE INDEX IF NOT EXISTS idx_repuestos_tipo_id
ON "Repuestos" (tipo_repuesto_id);

CREATE INDEX IF NOT EXISTS idx_repuestos_proveedor_id
ON "Repuestos" (proveedor_id);

CREATE INDEX IF NOT EXISTS idx_categorias_repuesto_busqueda
ON "Categorias_Repuestos" (lower(nombre_tipo), lower(electronico));

CREATE INDEX IF NOT EXISTS idx_proveedores_activos_nombre
ON "Proveedores" (descontinuada, lower(nombre), id_proveedor DESC);

CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico_estado_fecha
ON "Ordenes" (tecnico_id, estado, fecha_ingreso DESC, id_orden DESC);

CREATE INDEX IF NOT EXISTS idx_ordenes_repuestos_repuesto_id
ON "Ordenes_Repuestos" (repuesto_id);

