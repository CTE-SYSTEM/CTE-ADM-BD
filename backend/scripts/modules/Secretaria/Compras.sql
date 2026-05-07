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