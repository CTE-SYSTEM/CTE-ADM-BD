-- backend/scripts/modules/Secretaria/Diagnosticos.sql

-- 1. Función para obtener diagnósticos con formato "shape"
CREATE OR REPLACE FUNCTION get_diagnosticos_formateados()
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_diagnostico', d.id_diagnostico,
        'falla_reportada', d.falla_reportada,
        'diagnostico_real', d.diagnostico_real,
        'estado_del_diagnostico', d.estado_del_diagnostico,
        'estado', d.estado_del_diagnostico, -- Mapeo de shapeDiagnostico
        'Estado_aprobacion', d."Estado_aprobacion",
        'deja_cargador', d.deja_cargador,
        'enciende', d.enciende,
        'usa_corriente_ac', d.usa_corriente_ac,
        'fecha_hora', d.fecha_hora,
        'tecnico', to_jsonb(t.*),
        'equipo', to_jsonb(e.*),
        'cliente', to_jsonb(c.*) -- Aplanado de shapeDiagnostico
    )
    FROM "Diagnosticos" d
    LEFT JOIN "Tecnicos" t ON d.tecnico_id = t.id_tecnico
    LEFT JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    LEFT JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    ORDER BY d.id_diagnostico DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para crear diagnóstico y devolverlo formateado
CREATE OR REPLACE FUNCTION crear_diagnostico_proc(
    p_equipo_id INT, p_tecnico_id INT, p_falla TEXT, p_diag_real TEXT,
    p_estado_diag TEXT, p_estado_aprob TEXT, p_cargador BOOLEAN, 
    p_enciende BOOLEAN, p_ac BOOLEAN
) RETURNS TABLE (data JSONB) AS $$
DECLARE
    v_id INT;
BEGIN
    INSERT INTO "Diagnosticos" (
        equipo_id, tecnico_id, falla_reportada, diagnostico_real, 
        estado_del_diagnostico, "Estado_aprobacion", deja_cargador, enciende, usa_corriente_ac
    ) VALUES (
        p_equipo_id, p_tecnico_id, p_falla, p_diag_real, 
        p_estado_diag, p_estado_aprob, p_cargador, p_enciende, p_ac
    ) RETURNING id_diagnostico INTO v_id;

    RETURN QUERY SELECT * FROM get_diagnosticos_por_id(v_id);
END;
$$ LANGUAGE plpgsql;

-- 3. Función auxiliar para obtener uno solo (usada por create y update)
CREATE OR REPLACE FUNCTION get_diagnosticos_por_id(p_id INT)
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_diagnostico', d.id_diagnostico,
        'falla_reportada', d.falla_reportada,
        'diagnostico_real', d.diagnostico_real,
        'estado_del_diagnostico', d.estado_del_diagnostico,
        'estado', d.estado_del_diagnostico,
        'Estado_aprobacion', d."Estado_aprobacion",
        'deja_cargador', d.deja_cargador,
        'enciende', d.enciende,
        'usa_corriente_ac', d.usa_corriente_ac,
        'tecnico', to_jsonb(t.*),
        'equipo', to_jsonb(e.*),
        'cliente', to_jsonb(c.*)
    )
    FROM "Diagnosticos" d
    LEFT JOIN "Tecnicos" t ON d.tecnico_id = t.id_tecnico
    LEFT JOIN "Equipos" e ON d.equipo_id = e.id_equipo
    LEFT JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    WHERE d.id_diagnostico = p_id;
END;
$$ LANGUAGE plpgsql;
