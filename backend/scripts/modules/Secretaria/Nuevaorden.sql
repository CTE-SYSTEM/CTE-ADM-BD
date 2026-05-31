CREATE OR REPLACE FUNCTION get_ordenes_secretaria()
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_orden', o.id_orden,
        'diagnostico_id', o.diagnostico_id,
        'tecnico_id', o.tecnico_id,
        'prioridad', o.prioridad,
        'estado', o.estado,
        'fecha_ingreso', o.fecha_ingreso,
        'fecha_asignacion', o.fecha_asignacion,
        'resultado_final', o.resultado_final,
        'fecha_finalizacion', o.fecha_finalizacion,
        'requiere_piezas', o.requiere_piezas,
        'diagnostico', to_jsonb(d.*) || jsonb_build_object('equipo', to_jsonb(e.*) || jsonb_build_object('cliente', to_jsonb(c.*))),
        'tecnico', to_jsonb(t.*)
    )
    FROM "Ordenes" o
    JOIN "Diagnosticos" d ON o.diagnostico_id = d.id_diagnostico
    JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    LEFT JOIN "Tecnicos" t ON o.tecnico_id = t.id_tecnico
    ORDER BY o.id_orden DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_diagnosticos_listos_orden()
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_diagnostico', d.id_diagnostico,
        'falla_reportada', d.falla_reportada,
        'diagnostico_real', d.diagnostico_real,
        'presupuesto_estimado', d.presupuesto_estimado,
        'prioridad', d.prioridad,
        'estado_del_diagnostico', d.estado_del_diagnostico,
        'fecha_hora', d.fecha_hora,
        'equipo', to_jsonb(e.*) || jsonb_build_object('cliente', to_jsonb(c.*)),
        'tecnico', to_jsonb(t.*),
        'ordenes', '[]'::jsonb
    )
    FROM "Diagnosticos" d
    JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    LEFT JOIN "Tecnicos" t ON d.tecnico_id = t.id_tecnico
    WHERE d.estado_del_diagnostico IN ('COMPLETADO', 'DIAGNOSTICADO')
      AND NOT EXISTS (SELECT 1 FROM "Ordenes" o WHERE o.diagnostico_id = d.id_diagnostico)
    ORDER BY d.id_diagnostico DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_diagnostico_validacion_orden(p_id INT)
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_diagnostico', d.id_diagnostico,
        'estado_del_diagnostico', d.estado_del_diagnostico,
        'diagnostico_real', d.diagnostico_real,
        'presupuesto_estimado', d.presupuesto_estimado,
        'equipo', to_jsonb(e.*) || jsonb_build_object('cliente', to_jsonb(c.*)),
        'orden_existente', EXISTS (SELECT 1 FROM "Ordenes" o WHERE o.diagnostico_id = d.id_diagnostico)
    )
    FROM "Diagnosticos" d
    LEFT JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    LEFT JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    WHERE d.id_diagnostico = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION crear_orden_secretaria_proc(
    p_diagnostico_id INT,
    p_tecnico_id INT,
    p_prioridad TEXT,
    p_estado TEXT,
    p_requiere_piezas BOOLEAN DEFAULT TRUE
) RETURNS TABLE (data JSONB) AS $$
DECLARE
    v_id INT;
BEGIN
    INSERT INTO "Ordenes" (diagnostico_id, tecnico_id, prioridad, estado, requiere_piezas)
    VALUES (p_diagnostico_id, p_tecnico_id, p_prioridad, p_estado, COALESCE(p_requiere_piezas, TRUE))
    RETURNING id_orden INTO v_id;

    RETURN QUERY SELECT orden.data FROM get_orden_secretaria_por_id(v_id) AS orden;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION actualizar_orden_secretaria_proc(
    p_id INT,
    p_tecnico_id INT,
    p_prioridad TEXT,
    p_estado TEXT,
    p_requiere_piezas BOOLEAN DEFAULT NULL
) RETURNS TABLE (data JSONB) AS $$
BEGIN
    UPDATE "Ordenes"
    SET tecnico_id = COALESCE(p_tecnico_id, tecnico_id),
        prioridad = COALESCE(p_prioridad, prioridad),
        estado = COALESCE(p_estado, estado),
        requiere_piezas = COALESCE(p_requiere_piezas, requiere_piezas)
    WHERE id_orden = p_id;

    RETURN QUERY SELECT orden.data FROM get_orden_secretaria_por_id(p_id) AS orden;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION eliminar_orden_secretaria_proc(p_id INT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM "Ordenes"
    WHERE id_orden = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_orden_secretaria_por_id(p_id INT)
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_orden', o.id_orden,
        'diagnostico_id', o.diagnostico_id,
        'tecnico_id', o.tecnico_id,
        'prioridad', o.prioridad,
        'estado', o.estado,
        'fecha_ingreso', o.fecha_ingreso,
        'fecha_asignacion', o.fecha_asignacion,
        'resultado_final', o.resultado_final,
        'fecha_finalizacion', o.fecha_finalizacion,
        'requiere_piezas', o.requiere_piezas,
        'diagnostico', to_jsonb(d.*) || jsonb_build_object('equipo', to_jsonb(e.*) || jsonb_build_object('cliente', to_jsonb(c.*))),
        'tecnico', to_jsonb(t.*)
    )
    FROM "Ordenes" o
    JOIN "Diagnosticos" d ON o.diagnostico_id = d.id_diagnostico
    JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    LEFT JOIN "Tecnicos" t ON o.tecnico_id = t.id_tecnico
    WHERE o.id_orden = p_id;
END;
$$ LANGUAGE plpgsql;
