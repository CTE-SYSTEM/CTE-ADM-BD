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
        estado_del_diagnostico = 'COMPLETADO',
        fecha_completado = NOW()
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
    p_repuesto_id BIGINT,
    p_pieza_solicitada TEXT,
    p_cantidad BIGINT
) RETURNS TABLE (data JSONB) AS $$
DECLARE
    v_repuesto_id INT;
    v_id INT;
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Ordenes"
        WHERE id_orden = p_id_orden::INT
          AND COALESCE(requiere_piezas, TRUE) = FALSE
    ) THEN
        RAISE EXCEPTION 'Esta orden fue marcada como servicio sin piezas y no admite solicitudes de repuestos';
    END IF;

    IF p_repuesto_id IS NULL AND TRIM(COALESCE(p_pieza_solicitada, '')) = '' THEN
        RAISE EXCEPTION 'Indique que pieza necesita solicitar';
    END IF;

    IF p_repuesto_id IS NOT NULL THEN
        SELECT id_repuesto INTO v_repuesto_id
        FROM "Repuestos"
        WHERE id_repuesto = p_repuesto_id::INT
          AND descontinuada = FALSE
          AND stock_actual >= GREATEST(COALESCE(p_cantidad, 1), 1)::INT;

        IF v_repuesto_id IS NULL THEN
            RAISE EXCEPTION 'El repuesto seleccionado no existe, esta descontinuado o no tiene stock suficiente';
        END IF;
    ELSE
        SELECT id_repuesto INTO v_repuesto_id
        FROM "Repuestos"
        WHERE descontinuada = FALSE
          AND stock_actual > 0
          AND nombre ILIKE TRIM(p_pieza_solicitada)
        LIMIT 1;
    END IF;

    INSERT INTO "Ordenes_Repuestos" (
        orden_id, repuesto_id, pieza_solicitada, cantidad_usada, estado_aprobacion
    ) VALUES (
        p_id_orden::INT,
        v_repuesto_id,
        COALESCE(NULLIF(TRIM(p_pieza_solicitada), ''), (SELECT nombre FROM "Repuestos" WHERE id_repuesto = v_repuesto_id), p_repuesto_id::TEXT),
        GREATEST(COALESCE(p_cantidad, 1), 1)::INT,
        'PENDIENTE'
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
        'repuesto', to_jsonb(r.*),
        'orden', jsonb_build_object(
            'id_orden', o.id_orden,
            'tecnico_id', o.tecnico_id,
            'tecnico', to_jsonb(tord.*),
            'diagnostico', jsonb_build_object(
                'id_diagnostico', d.id_diagnostico,
                'tecnico_id', d.tecnico_id,
                'tecnico', to_jsonb(tdiag.*)
            )
        )
    )
    FROM "Ordenes_Repuestos" orp
    JOIN "Ordenes" o ON orp.orden_id = o.id_orden
    JOIN "Diagnosticos" d ON o.diagnostico_id = d.id_diagnostico
    LEFT JOIN "Repuestos" r ON orp.repuesto_id = r.id_repuesto
    LEFT JOIN "Tecnicos" tord ON o.tecnico_id = tord.id_tecnico
    LEFT JOIN "Tecnicos" tdiag ON d.tecnico_id = tdiag.id_tecnico
    WHERE orp.id_detalle_repuesto = v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION actualizar_estado_orden_tecnico_proc(
    p_id_orden BIGINT,
    p_estado TEXT,
    p_resultado_final TEXT DEFAULT NULL,
    p_enciende_salida BOOLEAN DEFAULT NULL,
    p_usa_corriente_ac_salida BOOLEAN DEFAULT NULL,
    p_observacion_final TEXT DEFAULT NULL
) RETURNS TABLE (data JSONB) AS $$
DECLARE
    v_estado TEXT := UPPER(TRIM(COALESCE(p_estado, '')));
    v_actual TEXT;
    v_pendientes INT;
    v_requiere_piezas BOOLEAN;
BEGIN
    IF v_estado NOT IN ('EN_REPARACION', 'FINALIZADO', 'IRREPARABLE') THEN
        RAISE EXCEPTION 'Estado de orden invalido';
    END IF;

    SELECT UPPER(COALESCE(estado, '')), COALESCE(requiere_piezas, TRUE)
    INTO v_actual, v_requiere_piezas
    FROM "Ordenes"
    WHERE id_orden = p_id_orden::INT;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden no encontrada';
    END IF;

    IF v_estado = 'FINALIZADO' THEN
        IF v_requiere_piezas THEN
            SELECT COUNT(*) INTO v_pendientes
            FROM "Ordenes_Repuestos"
            WHERE orden_id = p_id_orden::INT
              AND (
                estado_aprobacion <> 'APROBADO'
                OR estado_entrega <> 'ENTREGADO'
                OR repuesto_id IS NULL
              );

            IF v_pendientes > 0 THEN
                RAISE EXCEPTION 'No se puede finalizar: todas las piezas solicitadas deben estar aprobadas y entregadas';
            END IF;
        END IF;
    END IF;

    IF v_estado = 'FINALIZADO' AND TRIM(COALESCE(p_observacion_final, '')) = '' THEN
        RAISE EXCEPTION 'La observacion final es obligatoria para cerrar la orden';
    END IF;

    IF v_estado = 'IRREPARABLE' AND TRIM(COALESCE(p_observacion_final, '')) = '' THEN
        RAISE EXCEPTION 'La justificacion de irreparabilidad es obligatoria';
    END IF;

    UPDATE "Ordenes"
    SET estado = v_estado,
        resultado_final = CASE WHEN v_estado IN ('FINALIZADO', 'IRREPARABLE') THEN COALESCE(p_resultado_final, CASE WHEN v_estado = 'IRREPARABLE' THEN 'IRREPARABLE' ELSE 'REPARADO' END) ELSE resultado_final END,
        enciende_salida = CASE WHEN v_estado IN ('FINALIZADO', 'IRREPARABLE') THEN p_enciende_salida ELSE enciende_salida END,
        usa_corriente_ac_salida = CASE WHEN v_estado IN ('FINALIZADO', 'IRREPARABLE') THEN p_usa_corriente_ac_salida ELSE usa_corriente_ac_salida END,
        observacion_final = CASE WHEN v_estado IN ('FINALIZADO', 'IRREPARABLE') THEN TRIM(p_observacion_final) ELSE observacion_final END,
        fecha_cierre = CASE WHEN v_estado = 'FINALIZADO' THEN NOW() ELSE fecha_cierre END,
        fecha_finalizacion = CASE WHEN v_estado = 'FINALIZADO' THEN NOW() ELSE fecha_finalizacion END,
        justificacion_irreparable = CASE WHEN v_estado = 'IRREPARABLE' THEN TRIM(p_observacion_final) ELSE justificacion_irreparable END,
        irreparable_estado = CASE WHEN v_estado = 'IRREPARABLE' THEN 'PENDIENTE' ELSE irreparable_estado END
    WHERE id_orden = p_id_orden::INT;

    RETURN QUERY
    SELECT jsonb_build_object(
        'id_orden', o.id_orden,
        'diagnostico_id', o.diagnostico_id,
        'tecnico_id', o.tecnico_id,
        'prioridad', o.prioridad,
        'estado', o.estado,
        'fecha_ingreso', o.fecha_ingreso,
        'resultado_final', o.resultado_final,
        'enciende_salida', o.enciende_salida,
        'usa_corriente_ac_salida', o.usa_corriente_ac_salida,
        'observacion_final', o.observacion_final,
        'fecha_cierre', o.fecha_cierre,
        'fecha_finalizacion', o.fecha_finalizacion,
        'requiere_piezas', o.requiere_piezas,
        'justificacion_irreparable', o.justificacion_irreparable,
        'irreparable_estado', o.irreparable_estado
    )
    FROM "Ordenes" o
    WHERE o.id_orden = p_id_orden::INT;
END;
$$ LANGUAGE plpgsql;
