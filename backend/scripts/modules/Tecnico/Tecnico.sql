-- backend/scripts/modules/Tecnico/Tecnico.sql

CREATE OR REPLACE FUNCTION get_mis_diagnosticos_tecnico(p_username TEXT)
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_diagnostico', d.id_diagnostico,
        'equipo_id', d.equipo_id,
        'tecnico_id', d.tecnico_id,
        'falla_reportada', d.falla_reportada,
        'diagnostico_real', d.diagnostico_real,
        'presupuesto_estimado', d.presupuesto_estimado,
        'prioridad', d.prioridad,
        'fecha_hora', d.fecha_hora,
        'fecha_asignacion', d.fecha_asignacion,
        'estado_del_diagnostico', d.estado_del_diagnostico,
        'Estado_aprobacion', d."Estado_aprobacion",
        'deja_cargador', d.deja_cargador,
        'enciende', d.enciende,
        'usa_corriente_ac', d.usa_corriente_ac,
        'tecnico', to_jsonb(t.*),
        'equipo', to_jsonb(e.*) || jsonb_build_object('cliente', to_jsonb(c.*))
    )
    FROM "Diagnosticos" d
    JOIN "Tecnicos" t ON d.tecnico_id = t.id_tecnico
    JOIN "Usuarios" u ON t.usuario_id = u.id_usuario
    JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    WHERE u.nombre_usuario = p_username
      AND t.activo = TRUE
    ORDER BY d.fecha_asignacion DESC NULLS LAST, d.fecha_hora DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_mis_ordenes_tecnico(p_username TEXT)
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    WITH tecnico_actual AS (
        SELECT t.id_tecnico
        FROM "Tecnicos" t
        JOIN "Usuarios" u ON t.usuario_id = u.id_usuario
        WHERE u.nombre_usuario = p_username
          AND t.activo = TRUE
        LIMIT 1
    ),
    ordenes_base AS (
        SELECT o.*
        FROM "Ordenes" o
        JOIN "Diagnosticos" d ON o.diagnostico_id = d.id_diagnostico
        JOIN tecnico_actual ta ON o.tecnico_id = ta.id_tecnico OR d.tecnico_id = ta.id_tecnico
    ),
    ordenes_finalizadas AS (
        SELECT
            ob.id_orden,
            ROW_NUMBER() OVER (ORDER BY ob.fecha_ingreso DESC NULLS LAST, ob.id_orden DESC) AS rn
        FROM ordenes_base ob
        WHERE UPPER(COALESCE(ob.estado, '')) = 'FINALIZADO'
    )
    SELECT jsonb_build_object(
        'id_orden', o.id_orden,
        'diagnostico_id', o.diagnostico_id,
        'tecnico_id', o.tecnico_id,
        'prioridad', o.prioridad,
        'estado', o.estado,
        'fecha_ingreso', o.fecha_ingreso,
        'puede_editar_completada',
            CASE
                WHEN UPPER(COALESCE(o.estado, '')) <> 'FINALIZADO' THEN TRUE
                WHEN COALESCE(ofin.rn, 999) <= 5 AND o.fecha_ingreso >= NOW() - INTERVAL '1 day' THEN TRUE
                ELSE FALSE
            END,
        'tecnico', to_jsonb(tord.*),
        'diagnostico', jsonb_build_object(
            'id_diagnostico', d.id_diagnostico,
            'falla_reportada', d.falla_reportada,
            'diagnostico_real', d.diagnostico_real,
            'presupuesto_estimado', d.presupuesto_estimado,
            'prioridad', d.prioridad,
            'estado_del_diagnostico', d.estado_del_diagnostico,
            'tecnico', to_jsonb(tdiag.*),
            'equipo', to_jsonb(e.*) || jsonb_build_object('cliente', to_jsonb(c.*))
        ),
        'repuestos_usados', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id_detalle_repuesto', orp.id_detalle_repuesto,
                    'orden_id', orp.orden_id,
                    'repuesto_id', orp.repuesto_id,
                    'pieza_solicitada', orp.pieza_solicitada,
                    'cantidad_usada', orp.cantidad_usada,
                    'estado_aprobacion', orp.estado_aprobacion,
                    'repuesto', to_jsonb(r.*)
                )
                ORDER BY orp.id_detalle_repuesto DESC
            )
            FROM "Ordenes_Repuestos" orp
            LEFT JOIN "Repuestos" r ON orp.repuesto_id = r.id_repuesto
            WHERE orp.orden_id = o.id_orden
        ), '[]'::jsonb)
    )
    FROM ordenes_base o
    JOIN "Diagnosticos" d ON o.diagnostico_id = d.id_diagnostico
    JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    LEFT JOIN "Tecnicos" tord ON o.tecnico_id = tord.id_tecnico
    LEFT JOIN "Tecnicos" tdiag ON d.tecnico_id = tdiag.id_tecnico
    LEFT JOIN ordenes_finalizadas ofin ON o.id_orden = ofin.id_orden
    ORDER BY o.fecha_ingreso DESC NULLS LAST, o.id_orden DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION completar_diagnostico_tecnico_proc(
    p_id_diagnostico BIGINT,
    p_diagnostico_real TEXT,
    p_presupuesto_estimado NUMERIC
) RETURNS TABLE (data JSONB) AS $$
BEGIN
    UPDATE "Diagnosticos"
    SET diagnostico_real = TRIM(p_diagnostico_real),
        presupuesto_estimado = p_presupuesto_estimado,
        estado_del_diagnostico = 'COMPLETADO'
    WHERE id_diagnostico = p_id_diagnostico::INT
      AND UPPER(COALESCE(estado_del_diagnostico, '')) <> 'COMPLETADO';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Diagnostico no encontrado o ya completado';
    END IF;

    RETURN QUERY SELECT * FROM get_diagnosticos_por_id(p_id_diagnostico::INT);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION solicitar_pieza_orden_tecnico_proc(
    p_id_orden BIGINT,
    p_pieza_solicitada TEXT,
    p_cantidad BIGINT
) RETURNS TABLE (data JSONB) AS $$
DECLARE
    v_repuesto_id INT;
    v_id INT;
BEGIN
    IF TRIM(COALESCE(p_pieza_solicitada, '')) = '' THEN
        RAISE EXCEPTION 'Indique que pieza necesita solicitar';
    END IF;

    SELECT id_repuesto INTO v_repuesto_id
    FROM "Repuestos"
    WHERE descontinuada = FALSE
      AND nombre ILIKE TRIM(p_pieza_solicitada)
    LIMIT 1;

    INSERT INTO "Ordenes_Repuestos" (
        orden_id, repuesto_id, pieza_solicitada, cantidad_usada, estado_aprobacion
    ) VALUES (
        p_id_orden::INT, v_repuesto_id, TRIM(p_pieza_solicitada), GREATEST(COALESCE(p_cantidad, 1), 1)::INT, 'PENDIENTE'
    ) RETURNING id_detalle_repuesto INTO v_id;

    UPDATE "Ordenes"
    SET estado = 'ESPERANDO_PIEZA'
    WHERE id_orden = p_id_orden::INT
      AND UPPER(COALESCE(estado, '')) <> 'FINALIZADO';

    RETURN QUERY
    SELECT jsonb_build_object(
        'id_detalle_repuesto', orp.id_detalle_repuesto,
        'orden_id', orp.orden_id,
        'repuesto_id', orp.repuesto_id,
        'pieza_solicitada', orp.pieza_solicitada,
        'cantidad_usada', orp.cantidad_usada,
        'estado_aprobacion', orp.estado_aprobacion,
        'repuesto', to_jsonb(r.*)
    )
    FROM "Ordenes_Repuestos" orp
    LEFT JOIN "Repuestos" r ON orp.repuesto_id = r.id_repuesto
    WHERE orp.id_detalle_repuesto = v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION actualizar_estado_orden_tecnico_proc(
    p_id_orden BIGINT,
    p_estado TEXT
) RETURNS TABLE (data JSONB) AS $$
DECLARE
    v_estado TEXT := UPPER(TRIM(COALESCE(p_estado, '')));
    v_actual TEXT;
    v_pendientes INT;
    v_rank_finalizada INT;
    v_fecha_ingreso TIMESTAMP;
BEGIN
    IF v_estado NOT IN ('EN_REPARACION', 'ESPERANDO_PIEZA', 'FINALIZADO') THEN
        RAISE EXCEPTION 'Estado de orden invalido';
    END IF;

    SELECT UPPER(COALESCE(estado, '')), fecha_ingreso
    INTO v_actual, v_fecha_ingreso
    FROM "Ordenes"
    WHERE id_orden = p_id_orden::INT;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden no encontrada';
    END IF;

    IF v_actual = 'FINALIZADO' THEN
        SELECT ranked.rn INTO v_rank_finalizada
        FROM (
            SELECT id_orden, ROW_NUMBER() OVER (ORDER BY fecha_ingreso DESC NULLS LAST, id_orden DESC) AS rn
            FROM "Ordenes"
            WHERE UPPER(COALESCE(estado, '')) = 'FINALIZADO'
        ) ranked
        WHERE ranked.id_orden = p_id_orden::INT;

        IF COALESCE(v_rank_finalizada, 999) > 5 OR v_fecha_ingreso < NOW() - INTERVAL '1 day' THEN
            RAISE EXCEPTION 'Esta orden finalizada ya no se puede editar';
        END IF;
    END IF;

    IF v_estado = 'FINALIZADO' THEN
        SELECT COUNT(*) INTO v_pendientes
        FROM "Ordenes_Repuestos"
        WHERE orden_id = p_id_orden::INT
          AND estado_aprobacion = 'PENDIENTE';

        IF v_pendientes > 0 THEN
            RAISE EXCEPTION 'No se puede finalizar: hay piezas pendientes de aprobacion';
        END IF;
    END IF;

    UPDATE "Ordenes"
    SET estado = v_estado
    WHERE id_orden = p_id_orden::INT;

    RETURN QUERY
    SELECT jsonb_build_object(
        'id_orden', o.id_orden,
        'diagnostico_id', o.diagnostico_id,
        'tecnico_id', o.tecnico_id,
        'prioridad', o.prioridad,
        'estado', o.estado,
        'fecha_ingreso', o.fecha_ingreso
    )
    FROM "Ordenes" o
    WHERE o.id_orden = p_id_orden::INT;
END;
$$ LANGUAGE plpgsql;
