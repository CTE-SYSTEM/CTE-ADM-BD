-- backend/scripts/modules/Secretaria/Repuestos.sql

-- 1. Función para buscar o crear/actualizar una categoría
CREATE OR REPLACE FUNCTION upsert_categoria(p_nombre TEXT, p_electronico TEXT)
RETURNS INT AS $$
DECLARE
    v_id INT;
    v_nombre TEXT := COALESCE(p_nombre, 'General');
BEGIN
    INSERT INTO "Categorias_Repuestos" (nombre_tipo, electronico)
    VALUES (v_nombre, p_electronico)
    ON CONFLICT (nombre_tipo) 
    DO UPDATE SET electronico = EXCLUDED.electronico
    RETURNING id_tipo_repuesto INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para obtener repuestos con su categoría
CREATE OR REPLACE FUNCTION get_repuestos_detalle()
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_repuesto', r.id_repuesto,
        'nombre', r.nombre,
        'descripcion', r.descripcion,
        'costo_individual', r.costo_individual,
        'porcentaje_de_ganacia', r.porcentaje_de_ganacia,
        'activo', r.activo,
        'tipo_repuesto_id', r.tipo_repuesto_id,
        'categoria', to_jsonb(c.*)
    )
    FROM "Repuestos" r
    LEFT JOIN "Categorias_Repuestos" c ON r.tipo_repuesto_id = c.id_tipo_repuesto
    WHERE r.activo = true
    ORDER BY r.id_repuesto DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para crear repuesto (Maneja la categoría internamente)
CREATE OR REPLACE FUNCTION crear_repuesto_proc(
    p_nombre TEXT, p_desc TEXT, p_cat_nombre TEXT, p_electro TEXT, p_costo NUMERIC, p_ganancia NUMERIC
) RETURNS TABLE (data JSONB) AS $$
DECLARE
    v_cat_id INT;
    v_id INT;
BEGIN
    -- Llamamos a nuestra otra función interna
    v_cat_id := upsert_categoria(p_cat_nombre, p_electro);

    INSERT INTO "Repuestos" (nombre, descripcion, costo_individual, porcentaje_de_ganacia, tipo_repuesto_id, activo)
    VALUES (p_nombre, p_desc, p_costo, p_ganancia, v_cat_id, true)
    RETURNING id_repuesto INTO v_id;

    RETURN QUERY SELECT r.data FROM get_repuestos_detalle_por_id(v_id) r;
END;
$$ LANGUAGE plpgsql;

-- 4. Función auxiliar para obtener un solo repuesto formateado
CREATE OR REPLACE FUNCTION get_repuestos_detalle_por_id(p_id INT)
RETURNS TABLE (data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id_repuesto', r.id_repuesto,
        'nombre', r.nombre,
        'descripcion', r.descripcion,
        'costo_individual', r.costo_individual,
        'porcentaje_de_ganacia', r.porcentaje_de_ganacia,
        'activo', r.activo,
        'categoria', to_jsonb(c.*)
    )
    FROM "Repuestos" r
    LEFT JOIN "Categorias_Repuestos" c ON r.tipo_repuesto_id = c.id_tipo_repuesto
    WHERE r.id_repuesto = p_id;
END;
$$ LANGUAGE plpgsql;