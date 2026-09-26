-- Retira procedimientos CRUD/flujo que fueron reemplazados por Prisma.
-- No elimina vistas, índices, triggers ni funciones de reportes complejos.

DROP FUNCTION IF EXISTS get_clientes_activos();
DROP FUNCTION IF EXISTS get_cliente_por_id(INT);
DROP FUNCTION IF EXISTS crear_cliente_proc(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS actualizar_cliente_proc(INT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS desactivar_cliente_proc(INT);

DROP FUNCTION IF EXISTS get_equipos_con_clientes();
DROP FUNCTION IF EXISTS crear_equipo_proc(INT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS actualizar_equipo_proc(INT, INT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS eliminar_equipo_proc(INT);

DROP FUNCTION IF EXISTS get_diagnosticos_formateados();
DROP FUNCTION IF EXISTS get_diagnosticos_por_id(INT);
DROP FUNCTION IF EXISTS crear_diagnostico_proc(INT, INT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS actualizar_diagnostico_proc(INT, INT, INT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN);

DROP FUNCTION IF EXISTS get_compras_completas();
DROP FUNCTION IF EXISTS crear_compra_con_variante_proc(INT, INT, TEXT, TIMESTAMP, INT, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS crear_compra_con_variante_proc(BIGINT, BIGINT, TEXT, TIMESTAMPTZ, BIGINT, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS crear_compra_proc(INT, INT, TEXT, TIMESTAMP, INT, NUMERIC, TEXT);

DROP FUNCTION IF EXISTS get_ordenes_secretaria();
DROP FUNCTION IF EXISTS get_diagnosticos_listos_orden();
DROP FUNCTION IF EXISTS get_diagnostico_validacion_orden(INT);
DROP FUNCTION IF EXISTS get_orden_secretaria_por_id(INT);
DROP FUNCTION IF EXISTS crear_orden_secretaria_proc(INT, INT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS actualizar_orden_secretaria_proc(INT, INT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS eliminar_orden_secretaria_proc(INT);

DROP FUNCTION IF EXISTS get_proveedores_activos();
DROP FUNCTION IF EXISTS get_proveedor_detalle(INT);
DROP FUNCTION IF EXISTS crear_proveedor_proc(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS actualizar_proveedor_proc(INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS existe_proveedor_activo_nombre(TEXT, INT);
DROP FUNCTION IF EXISTS desactivar_proveedor_proc(INT);

DROP FUNCTION IF EXISTS upsert_categoria(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_repuestos_detalle();
DROP FUNCTION IF EXISTS get_repuestos_detalle_por_id(INT);
DROP FUNCTION IF EXISTS crear_repuesto_proc(TEXT, TEXT, TEXT, TEXT, INT, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS actualizar_repuesto_proc(INT, TEXT, TEXT, TEXT, TEXT, INT, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS descontinuar_repuesto_proc(INT);

DROP FUNCTION IF EXISTS get_diagnosticos_pendientes_jefe();
DROP FUNCTION IF EXISTS asignar_tecnico_diagnostico_proc(INT, INT);
DROP FUNCTION IF EXISTS asignar_tecnico_orden_proc(INT, INT);
DROP FUNCTION IF EXISTS get_ordenes_aprobadas_jefe();
DROP FUNCTION IF EXISTS corregir_diagnostico_jefe_proc(INT, INT, BOOLEAN, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS corregir_orden_jefe_proc(INT, INT, BOOLEAN, TEXT, TEXT);
DROP FUNCTION IF EXISTS corregir_repuesto_jefe_proc(INT, INT, BOOLEAN, TEXT, BOOLEAN, INT, TEXT);
DROP FUNCTION IF EXISTS actualizar_estado_solicitud_repuesto_jefe_proc(INT, TEXT);
DROP FUNCTION IF EXISTS get_repuestos_pendientes_aprobacion();

DROP FUNCTION IF EXISTS get_mis_diagnosticos_tecnico(TEXT);
DROP FUNCTION IF EXISTS get_mis_ordenes_tecnico(TEXT);
DROP FUNCTION IF EXISTS completar_diagnostico_tecnico_proc(BIGINT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS solicitar_pieza_orden_tecnico_proc(BIGINT, BIGINT, TEXT, BIGINT);
DROP FUNCTION IF EXISTS actualizar_estado_orden_tecnico_proc(BIGINT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT);

DROP FUNCTION IF EXISTS crear_tecnico_proc(TEXT, TEXT, TEXT, TEXT, INT, BOOLEAN);
DROP FUNCTION IF EXISTS get_facturas_secretaria();
DROP FUNCTION IF EXISTS get_ordenes_facturables_secretaria();
DROP FUNCTION IF EXISTS get_garantias_secretaria();

-- Funciones CRUD administrativas reemplazadas por Prisma.
DROP FUNCTION IF EXISTS admin_pro.es_editable(TIMESTAMP);
DROP FUNCTION IF EXISTS admin_pro.editar_asignacion_diagnostico(INT, INT);
DROP FUNCTION IF EXISTS admin_pro.editar_asignacion_orden(INT, INT);
DROP FUNCTION IF EXISTS admin_pro.editar_aprobacion_repuesto(INT, TEXT);
DROP FUNCTION IF EXISTS admin_pro.cambiar_password_usuario(TEXT, INT, TEXT);
DROP FUNCTION IF EXISTS admin_pro.actualizar_estado_diagnostico(INT, TEXT);
DROP FUNCTION IF EXISTS admin_pro.actualizar_orden(INT, TEXT, INT, BOOLEAN, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_pro.actualizar_repuesto(INT, TEXT, TEXT, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS admin_pro.actualizar_equipo(INT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_pro.crear_garantia(INT, TEXT, INT);
DROP FUNCTION IF EXISTS admin_pro.actualizar_garantia(INT, TEXT, INT, BOOLEAN);
DROP FUNCTION IF EXISTS admin_pro.crear_usuario(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_pro.actualizar_usuario(INT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS admin_pro.desactivar_usuario(INT);
