CREATE OR REPLACE FUNCTION admin_pro.resumen_general(
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  total_clientes BIGINT,
  total_equipos BIGINT,
  total_tecnicos_activos BIGINT,
  total_diagnosticos BIGINT,
  total_ordenes BIGINT,
  ordenes_finalizadas BIGINT,
  repuestos_activos BIGINT,
  total_compras NUMERIC,
  total_facturado NUMERIC,
  garantias_vigentes BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM "Clientes" c WHERE c.activo = true),
    (SELECT COUNT(*) FROM "Equipos"),
    (SELECT COUNT(*) FROM "Tecnicos" t WHERE t.activo = true),
    (
      SELECT COUNT(*)
      FROM "Diagnosticos" d
      WHERE (p_fecha_inicio IS NULL OR d.fecha_hora::date >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR d.fecha_hora::date <= p_fecha_fin)
    ),
    (
      SELECT COUNT(*)
      FROM "Ordenes" o
      WHERE (p_fecha_inicio IS NULL OR o.fecha_ingreso::date >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR o.fecha_ingreso::date <= p_fecha_fin)
    ),
    (
      SELECT COUNT(*)
      FROM "Ordenes" o
      WHERE UPPER(COALESCE(o.estado, '')) IN ('FINALIZADO', 'ENTREGADO')
        AND (p_fecha_inicio IS NULL OR o.fecha_ingreso::date >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR o.fecha_ingreso::date <= p_fecha_fin)
    ),
    (SELECT COUNT(*) FROM "Repuestos" r WHERE r.activo = true AND r.descontinuada = false),
    (
      SELECT COALESCE(SUM(COALESCE(c.cantidad, 0) * COALESCE(c.costo_unitario, 0)), 0)
      FROM "Compras" c
      WHERE (p_fecha_inicio IS NULL OR c.fecha_obtencion::date >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR c.fecha_obtencion::date <= p_fecha_fin)
    ),
    (
      SELECT COALESCE(SUM(COALESCE(f.total, 0)), 0)
      FROM "Facturas" f
      WHERE (p_fecha_inicio IS NULL OR f.fecha_emision::date >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR f.fecha_emision::date <= p_fecha_fin)
    ),
    (
      SELECT COUNT(*)
      FROM "Garantias" g
      WHERE g.fecha_vencimiento IS NOT NULL
        AND g.fecha_vencimiento::date >= CURRENT_DATE
    );
END;
$$;

CREATE OR REPLACE FUNCTION admin_pro.repuestos_usados_por_periodo(
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  id_repuesto INT,
  repuesto TEXT,
  categoria TEXT,
  cantidad_total BIGINT,
  ordenes_donde_se_uso BIGINT,
  costo_unitario NUMERIC,
  costo_estimado_total NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id_repuesto,
    COALESCE(r.nombre, orp.pieza_solicitada, 'Sin nombre')::TEXT AS repuesto,
    cr.nombre_tipo::TEXT AS categoria,
    COALESCE(SUM(COALESCE(orp.cantidad_usada, 1)), 0)::BIGINT AS cantidad_total,
    COUNT(DISTINCT orp.orden_id)::BIGINT AS ordenes_donde_se_uso,
    COALESCE(r.costo_individual, 0) AS costo_unitario,
    COALESCE(SUM(COALESCE(orp.cantidad_usada, 1) * COALESCE(r.costo_individual, 0)), 0) AS costo_estimado_total
  FROM "Ordenes_Repuestos" orp
  JOIN "Ordenes" o ON o.id_orden = orp.orden_id
  LEFT JOIN "Repuestos" r ON r.id_repuesto = orp.repuesto_id
  LEFT JOIN "Categorias_Repuestos" cr ON cr.id_tipo_repuesto = r.tipo_repuesto_id
  WHERE orp.estado_aprobacion = 'APROBADO'
    AND (p_fecha_inicio IS NULL OR o.fecha_ingreso::date >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR o.fecha_ingreso::date <= p_fecha_fin)
  GROUP BY r.id_repuesto, COALESCE(r.nombre, orp.pieza_solicitada, 'Sin nombre'), cr.nombre_tipo, r.costo_individual
  ORDER BY cantidad_total DESC, repuesto ASC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_pro.repuestos_usados_por_proveedor(
  p_proveedor_id INT DEFAULT NULL,
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  id_proveedor INT,
  proveedor TEXT,
  id_repuesto INT,
  repuesto TEXT,
  cantidad_usada BIGINT,
  veces_comprado BIGINT,
  cantidad_comprada BIGINT,
  costo_promedio_compra NUMERIC,
  costo_total_compras NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH compras_agg AS (
    SELECT
      c.proveedor_id,
      c.repuesto_id,
      COUNT(*)::BIGINT AS veces_comprado,
      COALESCE(SUM(COALESCE(c.cantidad, 0)), 0)::BIGINT AS cantidad_comprada,
      COALESCE(AVG(c.costo_unitario), 0) AS costo_promedio_compra,
      COALESCE(SUM(COALESCE(c.cantidad, 0) * COALESCE(c.costo_unitario, 0)), 0) AS costo_total_compras
    FROM "Compras" c
    WHERE (p_fecha_inicio IS NULL OR c.fecha_obtencion::date >= p_fecha_inicio)
      AND (p_fecha_fin IS NULL OR c.fecha_obtencion::date <= p_fecha_fin)
    GROUP BY c.proveedor_id, c.repuesto_id
  ),
  usos_agg AS (
    SELECT
      orp.repuesto_id,
      COALESCE(SUM(COALESCE(orp.cantidad_usada, 1)), 0)::BIGINT AS cantidad_usada
    FROM "Ordenes_Repuestos" orp
    JOIN "Ordenes" o ON o.id_orden = orp.orden_id
    WHERE orp.estado_aprobacion = 'APROBADO'
      AND (p_fecha_inicio IS NULL OR o.fecha_ingreso::date >= p_fecha_inicio)
      AND (p_fecha_fin IS NULL OR o.fecha_ingreso::date <= p_fecha_fin)
    GROUP BY orp.repuesto_id
  )
  SELECT
    p.id_proveedor,
    p.nombre::TEXT AS proveedor,
    r.id_repuesto,
    r.nombre::TEXT AS repuesto,
    COALESCE(u.cantidad_usada, 0) AS cantidad_usada,
    ca.veces_comprado,
    ca.cantidad_comprada,
    ca.costo_promedio_compra,
    ca.costo_total_compras
  FROM "Proveedores" p
  JOIN compras_agg ca ON ca.proveedor_id = p.id_proveedor
  JOIN "Repuestos" r ON r.id_repuesto = ca.repuesto_id
  LEFT JOIN usos_agg u ON u.repuesto_id = r.id_repuesto
  WHERE (p_proveedor_id IS NULL OR p.id_proveedor = p_proveedor_id)
  ORDER BY proveedor ASC, cantidad_usada DESC, repuesto ASC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_pro.compras_por_periodo(
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  id_compra INT,
  fecha_obtencion TIMESTAMP,
  proveedor TEXT,
  repuesto TEXT,
  documento TEXT,
  cantidad INT,
  costo_unitario NUMERIC,
  costo_total NUMERIC,
  metodo_pago TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id_compra,
    c.fecha_obtencion,
    p.nombre::TEXT AS proveedor,
    r.nombre::TEXT AS repuesto,
    c.documento::TEXT,
    c.cantidad,
    c.costo_unitario,
    COALESCE(c.cantidad, 0) * COALESCE(c.costo_unitario, 0) AS costo_total,
    c.metodo_pago::TEXT
  FROM "Compras" c
  JOIN "Proveedores" p ON p.id_proveedor = c.proveedor_id
  JOIN "Repuestos" r ON r.id_repuesto = c.repuesto_id
  WHERE (p_fecha_inicio IS NULL OR c.fecha_obtencion::date >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR c.fecha_obtencion::date <= p_fecha_fin)
  ORDER BY c.fecha_obtencion DESC, c.id_compra DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_pro.facturacion_por_periodo(
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  id_factura INT,
  fecha_emision TIMESTAMP,
  id_orden INT,
  cliente TEXT,
  equipo TEXT,
  tecnico TEXT,
  monto_repuestos NUMERIC,
  mano_obra NUMERIC,
  subtotal NUMERIC,
  impuestos NUMERIC,
  total NUMERIC,
  metodo_pago TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id_factura,
    f.fecha_emision,
    o.id_orden,
    cl.nombre::TEXT AS cliente,
    CONCAT_WS(' ', e.tipo, e.marca, e.modelo)::TEXT AS equipo,
    t.nombre::TEXT AS tecnico,
    f.monto_repuestos,
    f.mano_obra,
    f.subtotal,
    f.impuestos,
    f.total,
    f.metodo_pago::TEXT
  FROM "Facturas" f
  JOIN "Ordenes" o ON o.id_orden = f.orden_id
  JOIN "Diagnosticos" d ON d.id_diagnostico = o.diagnostico_id
  JOIN "Equipos" e ON e.id_equipo = d.equipo_id
  JOIN "Clientes" cl ON cl.id_cliente = e.cliente_id
  LEFT JOIN "Tecnicos" t ON t.id_tecnico = o.tecnico_id
  WHERE (p_fecha_inicio IS NULL OR f.fecha_emision::date >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR f.fecha_emision::date <= p_fecha_fin)
  ORDER BY f.fecha_emision DESC, f.id_factura DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_pro.rendimiento_tecnicos(
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  id_tecnico INT,
  tecnico TEXT,
  diagnosticos_asignados BIGINT,
  diagnosticos_completados BIGINT,
  ordenes_asignadas BIGINT,
  ordenes_finalizadas BIGINT,
  total_facturado NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH diagnosticos_agg AS (
    SELECT
      d.tecnico_id,
      COUNT(*)::BIGINT AS diagnosticos_asignados,
      COUNT(*) FILTER (
        WHERE UPPER(COALESCE(d.estado_del_diagnostico, '')) IN ('COMPLETADO', 'DIAGNOSTICADO', 'APROBADO')
      )::BIGINT AS diagnosticos_completados
    FROM "Diagnosticos" d
    WHERE d.tecnico_id IS NOT NULL
      AND (p_fecha_inicio IS NULL OR d.fecha_hora::date >= p_fecha_inicio)
      AND (p_fecha_fin IS NULL OR d.fecha_hora::date <= p_fecha_fin)
    GROUP BY d.tecnico_id
  ),
  ordenes_agg AS (
    SELECT
      o.tecnico_id,
      COUNT(*)::BIGINT AS ordenes_asignadas,
      COUNT(*) FILTER (
        WHERE UPPER(COALESCE(o.estado, '')) IN ('FINALIZADO', 'ENTREGADO')
      )::BIGINT AS ordenes_finalizadas,
      COALESCE(SUM(COALESCE(f.total, 0)), 0) AS total_facturado
    FROM "Ordenes" o
    LEFT JOIN "Facturas" f ON f.orden_id = o.id_orden
    WHERE o.tecnico_id IS NOT NULL
      AND (p_fecha_inicio IS NULL OR o.fecha_ingreso::date >= p_fecha_inicio)
      AND (p_fecha_fin IS NULL OR o.fecha_ingreso::date <= p_fecha_fin)
    GROUP BY o.tecnico_id
  )
  SELECT
    t.id_tecnico,
    t.nombre::TEXT AS tecnico,
    COALESCE(da.diagnosticos_asignados, 0) AS diagnosticos_asignados,
    COALESCE(da.diagnosticos_completados, 0) AS diagnosticos_completados,
    COALESCE(oa.ordenes_asignadas, 0) AS ordenes_asignadas,
    COALESCE(oa.ordenes_finalizadas, 0) AS ordenes_finalizadas,
    COALESCE(oa.total_facturado, 0) AS total_facturado
  FROM "Tecnicos" t
  LEFT JOIN diagnosticos_agg da ON da.tecnico_id = t.id_tecnico
  LEFT JOIN ordenes_agg oa ON oa.tecnico_id = t.id_tecnico
  ORDER BY ordenes_finalizadas DESC, diagnosticos_completados DESC, tecnico ASC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_pro.ordenes_por_estado(
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  estado TEXT,
  cantidad BIGINT,
  prioridad_normal BIGINT,
  prioridad_alta BIGINT,
  prioridad_urgente BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(o.estado, 'SIN_ESTADO')::TEXT AS estado,
    COUNT(*)::BIGINT AS cantidad,
    COUNT(*) FILTER (WHERE UPPER(COALESCE(o.prioridad, '')) = 'NORMAL')::BIGINT AS prioridad_normal,
    COUNT(*) FILTER (WHERE UPPER(COALESCE(o.prioridad, '')) = 'ALTA')::BIGINT AS prioridad_alta,
    COUNT(*) FILTER (WHERE UPPER(COALESCE(o.prioridad, '')) = 'URGENTE')::BIGINT AS prioridad_urgente
  FROM "Ordenes" o
  WHERE (p_fecha_inicio IS NULL OR o.fecha_ingreso::date >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR o.fecha_ingreso::date <= p_fecha_fin)
  GROUP BY COALESCE(o.estado, 'SIN_ESTADO')
  ORDER BY cantidad DESC, estado ASC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_pro.diagnosticos_por_estado(
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  estado TEXT,
  aprobacion TEXT,
  cantidad BIGINT,
  presupuesto_total NUMERIC,
  presupuesto_promedio NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(d.estado_del_diagnostico, 'SIN_ESTADO')::TEXT AS estado,
    COALESCE(d."Estado_aprobacion", 'SIN_APROBACION')::TEXT AS aprobacion,
    COUNT(*)::BIGINT AS cantidad,
    COALESCE(SUM(d.presupuesto_estimado), 0) AS presupuesto_total,
    COALESCE(AVG(d.presupuesto_estimado), 0) AS presupuesto_promedio
  FROM "Diagnosticos" d
  WHERE (p_fecha_inicio IS NULL OR d.fecha_hora::date >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR d.fecha_hora::date <= p_fecha_fin)
  GROUP BY COALESCE(d.estado_del_diagnostico, 'SIN_ESTADO'), COALESCE(d."Estado_aprobacion", 'SIN_APROBACION')
  ORDER BY cantidad DESC, estado ASC, aprobacion ASC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_pro.equipos_por_cliente()
RETURNS TABLE (
  id_cliente INT,
  cliente TEXT,
  telefono TEXT,
  total_equipos BIGINT,
  total_diagnosticos BIGINT,
  total_ordenes BIGINT,
  ultima_visita TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id_cliente,
    c.nombre::TEXT AS cliente,
    c.telefono::TEXT,
    COUNT(DISTINCT e.id_equipo)::BIGINT AS total_equipos,
    COUNT(DISTINCT d.id_diagnostico)::BIGINT AS total_diagnosticos,
    COUNT(DISTINCT o.id_orden)::BIGINT AS total_ordenes,
    MAX(COALESCE(o.fecha_ingreso, d.fecha_hora)) AS ultima_visita
  FROM "Clientes" c
  LEFT JOIN "Equipos" e ON e.cliente_id = c.id_cliente
  LEFT JOIN "Diagnosticos" d ON d.equipo_id = e.id_equipo
  LEFT JOIN "Ordenes" o ON o.diagnostico_id = d.id_diagnostico
  GROUP BY c.id_cliente, c.nombre, c.telefono
  ORDER BY ultima_visita DESC NULLS LAST, total_equipos DESC, cliente ASC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_pro.garantias_por_vencer(
  p_dias INT DEFAULT 30
)
RETURNS TABLE (
  id_garantia INT,
  id_factura INT,
  cliente TEXT,
  equipo TEXT,
  fecha_inicio TIMESTAMP,
  fecha_vencimiento TIMESTAMP,
  dias_restantes INT,
  condiciones TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id_garantia,
    f.id_factura,
    c.nombre::TEXT AS cliente,
    CONCAT_WS(' ', e.tipo, e.marca, e.modelo)::TEXT AS equipo,
    g.fecha_inicio,
    g.fecha_vencimiento,
    (g.fecha_vencimiento::date - CURRENT_DATE)::INT AS dias_restantes,
    g.condiciones::TEXT
  FROM "Garantias" g
  JOIN "Facturas" f ON f.id_factura = g.factura_id
  JOIN "Ordenes" o ON o.id_orden = f.orden_id
  JOIN "Diagnosticos" d ON d.id_diagnostico = o.diagnostico_id
  JOIN "Equipos" e ON e.id_equipo = d.equipo_id
  JOIN "Clientes" c ON c.id_cliente = e.cliente_id
  WHERE g.fecha_vencimiento IS NOT NULL
    AND g.fecha_vencimiento::date BETWEEN CURRENT_DATE AND CURRENT_DATE + COALESCE(p_dias, 30)
  ORDER BY g.fecha_vencimiento ASC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_pro.inventario_repuestos()
RETURNS TABLE (
  id_repuesto INT,
  repuesto TEXT,
  categoria TEXT,
  activo BOOLEAN,
  descontinuada BOOLEAN,
  cantidad_comprada BIGINT,
  cantidad_usada BIGINT,
  stock_estimado BIGINT,
  ultimo_costo NUMERIC,
  costo_promedio NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH compras_agg AS (
    SELECT
      c.repuesto_id,
      COALESCE(SUM(COALESCE(c.cantidad, 0)), 0)::BIGINT AS cantidad_comprada,
      COALESCE(AVG(c.costo_unitario), 0) AS costo_promedio
    FROM "Compras" c
    GROUP BY c.repuesto_id
  ),
  usos_agg AS (
    SELECT
      orp.repuesto_id,
      COALESCE(SUM(COALESCE(orp.cantidad_usada, 1)), 0)::BIGINT AS cantidad_usada
    FROM "Ordenes_Repuestos" orp
    WHERE orp.estado_aprobacion = 'APROBADO'
    GROUP BY orp.repuesto_id
  )
  SELECT
    r.id_repuesto,
    r.nombre::TEXT AS repuesto,
    cr.nombre_tipo::TEXT AS categoria,
    r.activo,
    r.descontinuada,
    COALESCE(ca.cantidad_comprada, 0) AS cantidad_comprada,
    COALESCE(u.cantidad_usada, 0) AS cantidad_usada,
    (COALESCE(ca.cantidad_comprada, 0) - COALESCE(u.cantidad_usada, 0))::BIGINT AS stock_estimado,
    COALESCE(r.costo_individual, 0) AS ultimo_costo,
    COALESCE(ca.costo_promedio, 0) AS costo_promedio
  FROM "Repuestos" r
  LEFT JOIN "Categorias_Repuestos" cr ON cr.id_tipo_repuesto = r.tipo_repuesto_id
  LEFT JOIN compras_agg ca ON ca.repuesto_id = r.id_repuesto
  LEFT JOIN usos_agg u ON u.repuesto_id = r.id_repuesto
  ORDER BY stock_estimado ASC, repuesto ASC;
END;
$$;
