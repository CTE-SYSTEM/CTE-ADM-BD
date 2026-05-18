-- Acciones del modulo Tecnico

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
          AND estado_aprobacion <> 'APROBADO';

        IF v_pendientes > 0 THEN
            RAISE EXCEPTION 'No se puede finalizar: todas las piezas solicitadas deben estar aprobadas';
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
