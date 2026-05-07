-- backend/scripts/modules/JefeTecnico/Diagnosticos.sql

-- 1. Obtener diagnósticos pendientes de asignación
CREATE OR REPLACE FUNCTION get_diagnosticos_pendientes_jefe()
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_diagnostico', d.id_diagnostico,
        'fecha_hora', d.fecha_hora,
        'falla_reportada', d.falla_reportada,
        'estado_del_diagnostico', d.estado_del_diagnostico,
        'equipo', to_jsonb(e.*) || jsonb_build_object('cliente', to_jsonb(c.*))
    )
    FROM "Diagnosticos" d
    JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    WHERE d.tecnico_id IS NULL 
    AND d.estado_del_diagnostico ILIKE ANY (ARRAY['PENDIENTE', 'INGRESADO'])
    ORDER BY d.fecha_hora ASC;
END;
$$ LANGUAGE plpgsql;

-- 2. Asignar Técnico a Diagnóstico
CREATE OR REPLACE FUNCTION asignar_tecnico_diagnostico_proc(
    p_id_diagnostico INT,
    p_id_tecnico INT
) RETURNS VOID AS $$
BEGIN
    UPDATE "Diagnosticos"
    SET tecnico_id = p_id_tecnico,
        fecha_asignacion = NOW(),
        estado_del_diagnostico = 'EN_REVISION'
    WHERE id_diagnostico = p_id_diagnostico;
END;
$$ LANGUAGE plpgsql;

-- 3. Obtener Repuestos Pendientes de Aprobación
CREATE OR REPLACE FUNCTION get_repuestos_pendientes_aprobacion()
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_orden_repuesto', orp.id_orden_repuesto,
        'estado_aprobacion', orp.estado_aprobacion,
        'cantidad', orp.cantidad,
        'repuesto', to_jsonb(r.*),
        'orden', jsonb_build_object(
            'id_orden', o.id_orden,
            'fecha_ingreso', o.fecha_ingreso,
            'diagnostico', jsonb_build_object(
                'equipo', to_jsonb(eq.*)
            )
        )
    )
    FROM "Ordenes_Repuestos" orp
    JOIN "Repuestos" r ON orp.repuesto_id = r.id_repuesto
    JOIN "Ordenes" o ON orp.orden_id = o.id_orden
    JOIN "Diagnosticos" d ON o.diagnostico_id = d.id_diagnostico
    JOIN "Equipos" eq ON d.equipo_id = eq.id_equipo
    WHERE orp.estado_aprobacion = 'PENDIENTE'
    ORDER BY o.fecha_ingreso ASC;
END;
$$ LANGUAGE plpgsql;