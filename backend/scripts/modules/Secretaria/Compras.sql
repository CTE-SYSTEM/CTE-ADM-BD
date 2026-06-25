-- backend/scripts/modules/Secretaria/Compras.sql

-- 1. Función para obtener compras con sus relaciones (JOIN)
CREATE OR REPLACE FUNCTION get_compras_completas()
RETURNS TABLE (
    id_compra INT,
    documento TEXT,
    fecha_obtencion TIMESTAMP,
    cantidad INT,
    costo_unitario DECIMAL,
    metodo_pago TEXT,
    proveedor JSONB,
    repuesto JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id_compra,
        c.documento,
        c.fecha_obtencion,
        c.cantidad,
        c.costo_unitario,
        c.metodo_pago,
        to_jsonb(p.*) AS proveedor,
        to_jsonb(r.*) AS repuesto
    FROM "Compras" c
    LEFT JOIN "Proveedores" p ON c.proveedor_id = p.id_proveedor
    LEFT JOIN "Repuestos" r ON c.repuesto_id = r.id_repuesto
    ORDER BY c.id_compra DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear compra con manejo de variante por proveedor/costo
CREATE OR REPLACE FUNCTION crear_compra_con_variante_proc(
    p_repuesto_id INT,
    p_proveedor_id INT,
    p_documento TEXT,
    p_fecha TIMESTAMP,
    p_cantidad INT,
    p_costo DECIMAL,
    p_metodo_pago TEXT
) RETURNS TABLE (
    id_compra INT,
    documento TEXT,
    fecha_obtencion TIMESTAMP,
    cantidad INT,
    costo_unitario DECIMAL,
    metodo_pago TEXT,
    proveedor JSONB,
    repuesto JSONB
) AS $$
DECLARE
    v_base "Repuestos"%ROWTYPE;
    v_target_repuesto_id INT;
    v_variante_id INT;
    v_id_compra INT;
    v_repuesto_sin_variante BOOLEAN;
    v_misma_variante BOOLEAN;
    v_debe_crear_variante BOOLEAN;
BEGIN
    SELECT * INTO v_base
    FROM "Repuestos"
    WHERE id_repuesto = p_repuesto_id
      AND descontinuada = false;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El repuesto seleccionado no existe o esta descontinuado';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "Proveedores"
        WHERE id_proveedor = p_proveedor_id
          AND descontinuada = false
    ) THEN
        RAISE EXCEPTION 'El proveedor seleccionado no existe o esta descontinuado';
    END IF;

    v_target_repuesto_id := p_repuesto_id;
    v_repuesto_sin_variante := v_base.proveedor_id IS NULL;
    v_misma_variante := COALESCE(v_base.proveedor_id, 0) = p_proveedor_id AND COALESCE(v_base.costo_individual, 0) = p_costo;
    v_debe_crear_variante := NOT v_repuesto_sin_variante AND NOT v_misma_variante;

    IF v_debe_crear_variante THEN
        SELECT id_repuesto INTO v_variante_id
        FROM "Repuestos"
        WHERE descontinuada = false
          AND tipo_repuesto_id = v_base.tipo_repuesto_id
          AND lower(COALESCE(nombre, '')) = lower(COALESCE(v_base.nombre, ''))
          AND lower(COALESCE(descripcion, '')) = lower(COALESCE(v_base.descripcion, ''))
          AND proveedor_id = p_proveedor_id
          AND COALESCE(costo_individual, 0) = p_costo
          AND COALESCE(ganancia_cordobas, 0) = COALESCE(v_base.ganancia_cordobas, 0)
        LIMIT 1;

        IF v_variante_id IS NULL THEN
            INSERT INTO "Repuestos" (
                tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual,
                porcentaje_de_ganacia, ganancia_cordobas, activo, descontinuada
            )
            VALUES (
                v_base.tipo_repuesto_id, p_proveedor_id, v_base.nombre, v_base.descripcion, p_costo,
                v_base.porcentaje_de_ganacia, v_base.ganancia_cordobas, true, false
            )
            RETURNING id_repuesto INTO v_variante_id;
        END IF;

        v_target_repuesto_id := v_variante_id;
    END IF;

    INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
    VALUES (v_target_repuesto_id, p_proveedor_id, p_documento, p_fecha, p_cantidad, p_costo, p_metodo_pago)
    RETURNING "Compras".id_compra INTO v_id_compra;

    UPDATE "Repuestos"
    SET proveedor_id = p_proveedor_id,
        costo_individual = p_costo
    WHERE id_repuesto = v_target_repuesto_id;

    RETURN QUERY
    SELECT
        c.id_compra, c.documento, c.fecha_obtencion, c.cantidad, c.costo_unitario, c.metodo_pago,
        to_jsonb(prov.*), to_jsonb(rep.*)
    FROM "Compras" c
    JOIN "Proveedores" prov ON c.proveedor_id = prov.id_proveedor
    JOIN "Repuestos" rep ON c.repuesto_id = rep.id_repuesto
    WHERE c.id_compra = v_id_compra;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para crear compra y devolver el registro relacionado
CREATE OR REPLACE FUNCTION crear_compra_proc(
    p_repuesto_id INT,
    p_proveedor_id INT,
    p_documento TEXT,
    p_fecha TIMESTAMP,
    p_cantidad INT,
    p_costo DECIMAL,
    p_metodo_pago TEXT
) RETURNS TABLE (
    id_compra INT,
    documento TEXT,
    fecha_obtencion TIMESTAMP,
    cantidad INT,
    costo_unitario DECIMAL,
    metodo_pago TEXT,
    proveedor JSONB,
    repuesto JSONB
) AS $$
DECLARE
    v_id_compra INT;
BEGIN
    INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
    VALUES (p_repuesto_id, p_proveedor_id, p_documento, p_fecha, p_cantidad, p_costo, p_metodo_pago)
    RETURNING "Compras".id_compra INTO v_id_compra;

    RETURN QUERY
    SELECT 
        c.id_compra, c.documento, c.fecha_obtencion, c.cantidad, c.costo_unitario, c.metodo_pago,
        to_jsonb(prov.*), to_jsonb(rep.*)
    FROM "Compras" c
    JOIN "Proveedores" prov ON c.proveedor_id = prov.id_proveedor
    JOIN "Repuestos" rep ON c.repuesto_id = rep.id_repuesto
    WHERE c.id_compra = v_id_compra;
END;
$$ LANGUAGE plpgsql;
