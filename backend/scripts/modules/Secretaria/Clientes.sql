-- backend/scripts/modules/Secretaria/Clientes.sql

-- 1. Obtener solo clientes activos
CREATE OR REPLACE FUNCTION get_clientes_activos()
RETURNS SETOF "Clientes" AS $$
BEGIN
    RETURN QUERY 
    SELECT * FROM "Clientes" 
    WHERE activo = true 
    ORDER BY id_cliente DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear un nuevo cliente (activo por defecto)
CREATE OR REPLACE FUNCTION crear_cliente_proc(
    p_nombre TEXT,
    p_telefono TEXT,
    p_direccion TEXT,
    p_correo TEXT,
    p_contacto_secundario TEXT
) RETURNS SETOF "Clientes" AS $$
BEGIN
    RETURN QUERY
    INSERT INTO "Clientes" (nombre, telefono, direccion, correo, contacto_secundario, activo)
    VALUES (p_nombre, p_telefono, p_direccion, p_correo, p_contacto_secundario, true)
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar datos de un cliente
CREATE OR REPLACE FUNCTION actualizar_cliente_proc(
    p_id INT,
    p_nombre TEXT,
    p_telefono TEXT,
    p_direccion TEXT,
    p_correo TEXT,
    p_contacto_secundario TEXT
) RETURNS SETOF "Clientes" AS $$
BEGIN
    RETURN QUERY
    UPDATE "Clientes"
    SET nombre = p_nombre,
        telefono = p_telefono,
        direccion = p_direccion,
        correo = p_correo,
        contacto_secundario = p_contacto_secundario
    WHERE id_cliente = p_id AND activo = true
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- 4. Borrado lógico (Desactivar cliente)
CREATE OR REPLACE FUNCTION desactivar_cliente_proc(p_id INT)
RETURNS VOID AS $$
BEGIN
    UPDATE "Clientes"
    SET activo = false
    WHERE id_cliente = p_id;
END;
$$ LANGUAGE plpgsql;