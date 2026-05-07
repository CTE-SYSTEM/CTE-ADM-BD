-- backend/scripts/modules/Secretaria/Proveedores.sql

-- 1. Obtener todos los proveedores activos
CREATE OR REPLACE FUNCTION get_proveedores_activos()
RETURNS SETOF "Proveedores" AS $$
BEGIN
    RETURN QUERY 
    SELECT * FROM "Proveedores" 
    WHERE activo = true 
    ORDER BY id_proveedor DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Obtener un proveedor por ID con sus compras asociadas (Include)
CREATE OR REPLACE FUNCTION get_proveedor_detalle(p_id INT)
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_proveedor', p.id_proveedor,
        'nombre', p.nombre,
        'telefono', p.telefono,
        'direccion', p.direccion,
        'correo', p.correo,
        'web', p.web,
        'notas', p.notas,
        'activo', p.activo,
        'compras', COALESCE(
            (SELECT json_agg(c.*) FROM "Compras" c WHERE c.proveedor_id = p.id_proveedor), 
            '[]'::json
        )
    )
    FROM "Proveedores" p
    WHERE p.id_proveedor = p_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear Proveedor
CREATE OR REPLACE FUNCTION crear_proveedor_proc(
    p_nombre TEXT, p_tel TEXT, p_dir TEXT, p_correo TEXT, p_web TEXT, p_notas TEXT
) RETURNS SETOF "Proveedores" AS $$
BEGIN
    RETURN QUERY
    INSERT INTO "Proveedores" (nombre, telefono, direccion, correo, web, notas, activo)
    VALUES (p_nombre, p_tel, p_dir, p_correo, p_web, p_notas, true)
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- 4. Actualizar Proveedor
CREATE OR REPLACE FUNCTION actualizar_proveedor_proc(
    p_id INT, p_nombre TEXT, p_tel TEXT, p_dir TEXT, p_correo TEXT, p_web TEXT, p_notas TEXT
) RETURNS SETOF "Proveedores" AS $$
BEGIN
    RETURN QUERY
    UPDATE "Proveedores"
    SET nombre = p_nombre, telefono = p_tel, direccion = p_dir, 
        correo = p_correo, web = p_web, notas = p_notas
    WHERE id_proveedor = p_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql;