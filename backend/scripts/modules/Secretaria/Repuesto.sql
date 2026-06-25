-- backend/scripts/modules/Secretaria/Repuestos.sql

-- 1. Función para buscar o crear/actualizar una categoría
CREATE OR REPLACE FUNCTION upsert_categoria(p_nombre TEXT, p_electronico TEXT)
RETURNS INT AS $$
DECLARE
    v_id INT;
    v_nombre TEXT := COALESCE(p_nombre, 'General');
BEGIN
    SELECT id_tipo_repuesto
    INTO v_id
    FROM "Categorias_Repuestos"
    WHERE lower(nombre_tipo) = lower(v_nombre)
    LIMIT 1;

    IF v_id IS NULL THEN
        INSERT INTO "Categorias_Repuestos" (nombre_tipo, electronico)
        VALUES (v_nombre, p_electronico)
        RETURNING id_tipo_repuesto INTO v_id;
    ELSE
        UPDATE "Categorias_Repuestos"
        SET electronico = p_electronico
        WHERE id_tipo_repuesto = v_id;
    END IF;
    
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
        'ganancia_cordobas', r.ganancia_cordobas,
        'stock_actual', r.stock_actual,
        'activo', r.activo,
        'descontinuada', r.descontinuada,
        'tipo_repuesto_id', r.tipo_repuesto_id,
        'proveedor_id', r.proveedor_id,
        'categoria', to_jsonb(c.*),
        'proveedor', to_jsonb(p.*)
    )
    FROM "Repuestos" r
    LEFT JOIN "Categorias_Repuestos" c ON r.tipo_repuesto_id = c.id_tipo_repuesto
    LEFT JOIN "Proveedores" p ON r.proveedor_id = p.id_proveedor
    WHERE r.descontinuada = false
    ORDER BY r.id_repuesto DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para crear repuesto (Maneja la categoría internamente)
CREATE OR REPLACE FUNCTION crear_repuesto_proc(
    p_nombre TEXT, p_desc TEXT, p_cat_nombre TEXT, p_electro TEXT, p_proveedor_id INT, p_costo NUMERIC, p_ganancia NUMERIC
) RETURNS TABLE (data JSONB) AS $$
DECLARE
    v_cat_id INT;
    v_id INT;
BEGIN
    -- Llamamos a nuestra otra función interna
    v_cat_id := upsert_categoria(p_cat_nombre, p_electro);

    INSERT INTO "Repuestos" (nombre, descripcion, costo_individual, ganancia_cordobas, tipo_repuesto_id, proveedor_id, activo, descontinuada, stock_actual)
    VALUES (p_nombre, p_desc, p_costo, p_ganancia, v_cat_id, p_proveedor_id, true, false, 0)
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
        'ganancia_cordobas', r.ganancia_cordobas,
        'stock_actual', r.stock_actual,
        'activo', r.activo,
        'descontinuada', r.descontinuada,
        'tipo_repuesto_id', r.tipo_repuesto_id,
        'proveedor_id', r.proveedor_id,
        'categoria', to_jsonb(c.*),
        'proveedor', to_jsonb(p.*)
    )
    FROM "Repuestos" r
    LEFT JOIN "Categorias_Repuestos" c ON r.tipo_repuesto_id = c.id_tipo_repuesto
    LEFT JOIN "Proveedores" p ON r.proveedor_id = p.id_proveedor
    WHERE r.id_repuesto = p_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Actualizar repuesto
CREATE OR REPLACE FUNCTION actualizar_repuesto_proc(
    p_id INT, p_nombre TEXT, p_desc TEXT, p_cat_nombre TEXT, p_electro TEXT,
    p_proveedor_id INT, p_costo NUMERIC, p_ganancia NUMERIC
) RETURNS TABLE (data JSONB) AS $$
DECLARE
    v_cat_id INT;
BEGIN
    v_cat_id := upsert_categoria(p_cat_nombre, p_electro);

    UPDATE "Repuestos" r
    SET nombre = p_nombre,
        descripcion = p_desc,
        tipo_repuesto_id = v_cat_id,
        proveedor_id = COALESCE(p_proveedor_id, r.proveedor_id),
        costo_individual = p_costo,
        ganancia_cordobas = p_ganancia
    WHERE id_repuesto = p_id;

    RETURN QUERY SELECT r.data FROM get_repuestos_detalle_por_id(p_id) r;
END;
$$ LANGUAGE plpgsql;

-- 6. Descontinuar repuesto
CREATE OR REPLACE FUNCTION descontinuar_repuesto_proc(p_id INT)
RETURNS VOID AS $$
BEGIN
    UPDATE "Repuestos"
    SET descontinuada = true
    WHERE id_repuesto = p_id;
END;
$$ LANGUAGE plpgsql;
