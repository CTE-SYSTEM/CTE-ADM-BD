-- backend/scripts/modules/JefeTecnico/Diagnosticos.sql

-- 1. Obtener diagnósticos pendientes de asignación
CREATE OR REPLACE FUNCTION get_diagnosticos_pendientes_jefe()
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_diagnostico', d.id_diagnostico,
        'fecha_hora', d.fecha_hora,
        'fecha_completado', d.fecha_completado,
        'falla_reportada', d.falla_reportada,
        'estado_del_diagnostico', d.estado_del_diagnostico,
        'tecnico', to_jsonb(t.*),
        'equipo', to_jsonb(e.*) || jsonb_build_object('cliente', to_jsonb(c.*))
    )
    FROM "Diagnosticos" d
    LEFT JOIN "Tecnicos" t ON d.tecnico_id = t.id_tecnico
    JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    WHERE d.tecnico_id IS NULL
      AND d.estado_del_diagnostico IN ('PENDIENTE', 'INGRESADO')
    ORDER BY d.fecha_hora ASC, d.id_diagnostico ASC;
END;
$$ LANGUAGE plpgsql;

-- 2. Asignar Técnico a Diagnóstico
CREATE OR REPLACE FUNCTION asignar_tecnico_diagnostico_proc(
    p_id_diagnostico INT,
    p_id_tecnico INT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Tecnicos" WHERE id_tecnico = p_id_tecnico AND activo = true) THEN
        RAISE EXCEPTION 'Tecnico no encontrado o inactivo';
    END IF;

    UPDATE "Diagnosticos"
    SET tecnico_id = p_id_tecnico,
        fecha_asignacion = NOW(),
        estado_del_diagnostico = 'EN_REVISION'
    WHERE id_diagnostico = p_id_diagnostico;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Diagnostico no encontrado';
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION asignar_tecnico_orden_proc(
    p_id_orden INT,
    p_id_tecnico INT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Tecnicos" WHERE id_tecnico = p_id_tecnico AND activo = true) THEN
        RAISE EXCEPTION 'Tecnico no encontrado o inactivo';
    END IF;

    UPDATE "Ordenes"
    SET tecnico_id = p_id_tecnico,
        estado = 'EN_REPARACION',
        fecha_asignacion = NOW()
    WHERE id_orden = p_id_orden;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden no encontrada';
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ordenes_aprobadas_jefe()
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
        'fecha_finalizacion', o.fecha_finalizacion,
        'requiere_piezas', o.requiere_piezas,
        'justificacion_irreparable', o.justificacion_irreparable,
        'irreparable_estado', o.irreparable_estado,
        'tecnico', to_jsonb(t.*),
        'diagnostico', to_jsonb(d.*) || jsonb_build_object(
            'tecnico', to_jsonb(dt.*),
            'equipo', to_jsonb(e.*) || jsonb_build_object('cliente', to_jsonb(c.*))
        )
    )
    FROM "Ordenes" o
    JOIN "Diagnosticos" d ON o.diagnostico_id = d.id_diagnostico
    JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    LEFT JOIN "Tecnicos" t ON o.tecnico_id = t.id_tecnico
    LEFT JOIN "Tecnicos" dt ON d.tecnico_id = dt.id_tecnico
    WHERE o.tecnico_id IS NULL
      AND o.estado NOT IN ('EN_REPARACION', 'ESPERANDO_PIEZA', 'FINALIZADO', 'ENTREGADO', 'IRREPARABLE')
    ORDER BY o.fecha_ingreso ASC, o.id_orden ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION corregir_diagnostico_jefe_proc(
    p_id INT,
    p_tecnico_id INT,
    p_cambiar_tecnico BOOLEAN,
    p_prioridad TEXT,
    p_estado_diag TEXT,
    p_estado_aprob TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE "Diagnosticos"
    SET tecnico_id = CASE WHEN p_cambiar_tecnico THEN p_tecnico_id ELSE tecnico_id END,
        fecha_asignacion = CASE WHEN p_cambiar_tecnico THEN CASE WHEN p_tecnico_id IS NULL THEN NULL ELSE NOW() END ELSE fecha_asignacion END,
        prioridad = COALESCE(p_prioridad, prioridad),
        estado_del_diagnostico = COALESCE(p_estado_diag, estado_del_diagnostico),
        "Estado_aprobacion" = COALESCE(p_estado_aprob, "Estado_aprobacion")
    WHERE id_diagnostico = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION corregir_orden_jefe_proc(
    p_id INT,
    p_tecnico_id INT,
    p_cambiar_tecnico BOOLEAN,
    p_prioridad TEXT,
    p_estado TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE "Ordenes"
    SET tecnico_id = CASE WHEN p_cambiar_tecnico THEN p_tecnico_id ELSE tecnico_id END,
        prioridad = COALESCE(p_prioridad, prioridad),
        estado = COALESCE(p_estado, estado)
    WHERE id_orden = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION corregir_repuesto_jefe_proc(
    p_id INT,
    p_repuesto_id INT,
    p_cambiar_repuesto BOOLEAN,
    p_pieza_solicitada TEXT,
    p_cambiar_pieza BOOLEAN,
    p_cantidad INT,
    p_estado_aprobacion TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE "Ordenes_Repuestos"
    SET repuesto_id = CASE WHEN p_cambiar_repuesto THEN p_repuesto_id ELSE repuesto_id END,
        pieza_solicitada = CASE WHEN p_cambiar_pieza THEN NULLIF(p_pieza_solicitada, '') ELSE pieza_solicitada END,
        cantidad_usada = COALESCE(p_cantidad, cantidad_usada),
        estado_aprobacion = COALESCE(p_estado_aprobacion, estado_aprobacion),
        estado_entrega = CASE
          WHEN p_estado_aprobacion = 'APROBADO' THEN 'ENTREGADO'
          ELSE estado_entrega
        END,
        fecha_entrega = CASE
          WHEN p_estado_aprobacion = 'APROBADO' THEN COALESCE(fecha_entrega, NOW())
          ELSE fecha_entrega
        END
    WHERE id_detalle_repuesto = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION actualizar_estado_solicitud_repuesto_jefe_proc(
    p_id INT,
    p_estado_aprobacion TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE "Ordenes_Repuestos"
    SET estado_aprobacion = p_estado_aprobacion,
        estado_entrega = CASE WHEN p_estado_aprobacion = 'APROBADO' THEN 'ENTREGADO' ELSE estado_entrega END,
        fecha_entrega = CASE WHEN p_estado_aprobacion = 'APROBADO' THEN COALESCE(fecha_entrega, NOW()) ELSE fecha_entrega END
    WHERE id_detalle_repuesto = p_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Obtener Repuestos Pendientes de Aprobación
CREATE OR REPLACE FUNCTION get_repuestos_pendientes_aprobacion()
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_detalle_repuesto', orp.id_detalle_repuesto,
        'estado_aprobacion', orp.estado_aprobacion,
        'cantidad_usada', orp.cantidad_usada,
        'repuesto_id', orp.repuesto_id,
        'pieza_solicitada', orp.pieza_solicitada,
        'estado_entrega', orp.estado_entrega,
        'fecha_entrega', orp.fecha_entrega,
        'repuesto', to_jsonb(r.*),
        'orden', jsonb_build_object(
            'id_orden', o.id_orden,
            'fecha_ingreso', o.fecha_ingreso,
            'tecnico_id', o.tecnico_id,
            'tecnico', to_jsonb(tord.*),
            'diagnostico', jsonb_build_object(
                'id_diagnostico', d.id_diagnostico,
                'tecnico_id', d.tecnico_id,
                'tecnico', to_jsonb(tdiag.*),
                'equipo', to_jsonb(eq.*)
            )
        )
    )
    FROM "Ordenes_Repuestos" orp
    LEFT JOIN "Repuestos" r ON orp.repuesto_id = r.id_repuesto
    JOIN "Ordenes" o ON orp.orden_id = o.id_orden
    JOIN "Diagnosticos" d ON o.diagnostico_id = d.id_diagnostico
    JOIN "Equipos" eq ON d.equipo_id = eq.id_equipo
    LEFT JOIN "Tecnicos" tord ON o.tecnico_id = tord.id_tecnico
    LEFT JOIN "Tecnicos" tdiag ON d.tecnico_id = tdiag.id_tecnico
    WHERE orp.estado_aprobacion = 'PENDIENTE'
    ORDER BY o.fecha_ingreso ASC;
END;
$$ LANGUAGE plpgsql;
