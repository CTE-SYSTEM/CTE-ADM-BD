-- backend/scripts/modules/Secretaria/Equipos.sql

-- 1. Obtener todos los equipos con su cliente
CREATE OR REPLACE FUNCTION get_equipos_con_clientes()
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_equipo', e.id_equipo,
        'tipo', e.tipo,
        'marca', e.marca,
        'modelo', e.modelo,
        'numero_serie', e.numero_serie,
        'cliente_id', e.cliente_id,
        'cliente', to_jsonb(c.*)
    )
    FROM "Equipos" e
    INNER JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    ORDER BY e.id_equipo DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear equipo y retornar con info del cliente
CREATE OR REPLACE FUNCTION crear_equipo_proc(
    p_cliente_id INT,
    p_tipo TEXT,
    p_marca TEXT,
    p_modelo TEXT,
    p_serie TEXT
) RETURNS TABLE (data JSONB) AS $$
DECLARE
    v_id INT;
BEGIN
    INSERT INTO "Equipos" (cliente_id, tipo, marca, modelo, numero_serie)
    VALUES (p_cliente_id, p_tipo, p_marca, p_modelo, p_serie)
    RETURNING id_equipo INTO v_id;

    RETURN QUERY 
    SELECT jsonb_build_object(
        'id_equipo', e.id_equipo,
        'tipo', e.tipo,
        'marca', e.marca,
        'modelo', e.modelo,
        'numero_serie', e.numero_serie,
        'cliente_id', e.cliente_id,
        'cliente', to_jsonb(c.*)
    )
    FROM "Equipos" e
    INNER JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    WHERE e.id_equipo = v_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar equipo
CREATE OR REPLACE FUNCTION actualizar_equipo_proc(
    p_id INT,
    p_cliente_id INT,
    p_tipo TEXT,
    p_marca TEXT,
    p_modelo TEXT,
    p_serie TEXT
) RETURNS TABLE (data JSONB) AS $$
BEGIN
    UPDATE "Equipos"
    SET cliente_id = COALESCE(p_cliente_id, cliente_id),
        tipo = p_tipo,
        marca = p_marca,
        modelo = p_modelo,
        numero_serie = p_serie
    WHERE id_equipo = p_id;

    RETURN QUERY 
    SELECT jsonb_build_object(
        'id_equipo', e.id_equipo,
        'tipo', e.tipo,
        'marca', e.marca,
        'modelo', e.modelo,
        'numero_serie', e.numero_serie,
        'cliente_id', e.cliente_id,
        'cliente', to_jsonb(c.*)
    )
    FROM "Equipos" e
    INNER JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    WHERE e.id_equipo = p_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Eliminar equipo
CREATE OR REPLACE FUNCTION eliminar_equipo_proc(p_id INT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM "Equipos"
    WHERE id_equipo = p_id;
END;
$$ LANGUAGE plpgsql;
