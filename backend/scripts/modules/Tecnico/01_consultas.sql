-- Consultas del modulo Tecnico

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
      AND NOT EXISTS (
          SELECT 1
          FROM "Ordenes" o
          WHERE o.diagnostico_id = d.id_diagnostico
      )
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
        JOIN tecnico_actual ta ON o.tecnico_id = ta.id_tecnico
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
