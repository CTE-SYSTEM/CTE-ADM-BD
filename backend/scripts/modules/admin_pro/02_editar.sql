CREATE OR REPLACE FUNCTION admin_pro.es_editable(p_fecha_registro TIMESTAMP)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_fecha_registro >= (NOW() - INTERVAL '30 minutes');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.editar_asignacion_diagnostico(
    p_id_diagnostico INT,
    p_nuevo_tecnico_id INT
)
RETURNS JSON AS $$
DECLARE
    v_fecha_asignacion TIMESTAMP;
BEGIN
    SELECT fecha_asignacion INTO v_fecha_asignacion
    FROM "Diagnosticos"
    WHERE id_diagnostico = p_id_diagnostico;

    IF v_fecha_asignacion IS NULL THEN
        RETURN json_build_object('error', 'El diagnóstico no tiene una asignación previa');
    END IF;

    IF v_fecha_asignacion >= (NOW() - INTERVAL '30 minutes') THEN
        UPDATE "Diagnosticos"
        SET tecnico_id = p_nuevo_tecnico_id,
            fecha_asignacion = NOW()
        WHERE id_diagnostico = p_id_diagnostico;
        
        RETURN json_build_object('success', 'Técnico reasignado correctamente');
    ELSE
        RETURN json_build_object('error', 'Bloqueado: La asignación se realizó hace más de 30 minutos');
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.editar_asignacion_orden(
    p_id_orden INT,
    p_nuevo_tecnico_id INT
)
RETURNS JSON AS $$
DECLARE
    v_fecha_ingreso TIMESTAMP;
BEGIN
    SELECT fecha_ingreso INTO v_fecha_ingreso FROM "Ordenes" WHERE id_orden = p_id_orden;

    IF v_fecha_ingreso >= (NOW() - INTERVAL '30 minutes') THEN
        UPDATE "Ordenes"
        SET tecnico_id = p_nuevo_tecnico_id
        WHERE id_orden = p_id_orden;
        
        RETURN json_build_object('success', 'Asignación de orden actualizada');
    ELSE
        RETURN json_build_object('error', 'Tiempo de edición expirado para esta orden');
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.editar_aprobacion_repuesto(
    p_id_detalle_repuesto INT,
    p_nuevo_estado TEXT
)
RETURNS JSON AS $$
DECLARE
    v_fecha_orden TIMESTAMP;
BEGIN
    SELECT o.fecha_ingreso INTO v_fecha_orden
    FROM "Ordenes_Repuestos" orp
    JOIN "Ordenes" o ON o.id_orden = orp.orden_id
    WHERE orp.id_detalle_repuesto = p_id_detalle_repuesto;

    IF v_fecha_orden >= (NOW() - INTERVAL '30 minutes') THEN
        UPDATE "Ordenes_Repuestos"
        SET estado_aprobacion = UPPER(p_nuevo_estado)
        WHERE id_detalle_repuesto = p_id_detalle_repuesto;
        
        RETURN json_build_object('success', 'Estado de aprobación actualizado');
    ELSE
        RETURN json_build_object('error', 'No se puede cambiar la aprobación después de 30 minutos de creada la orden');
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.cambiar_password_usuario(
    p_actor_rol TEXT,
    p_id_usuario INT,
    p_nuevo_hash TEXT
)
RETURNS JSON AS $$
DECLARE
    v_usuario_existe BOOLEAN;
BEGIN
    IF p_actor_rol IS DISTINCT FROM 'admin_pro' THEN
        RETURN json_build_object('error', 'Solo admin_pro puede cambiar contrasenas de usuarios');
    END IF;

    IF p_id_usuario IS NULL OR p_nuevo_hash IS NULL OR LENGTH(TRIM(p_nuevo_hash)) = 0 THEN
        RETURN json_build_object('error', 'Usuario y nuevo hash son obligatorios');
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM "Usuarios"
        WHERE id_usuario = p_id_usuario
    ) INTO v_usuario_existe;

    IF NOT v_usuario_existe THEN
        RETURN json_build_object('error', 'Usuario no encontrado');
    END IF;

    UPDATE "Usuarios"
    SET contrasena_hash = p_nuevo_hash
    WHERE id_usuario = p_id_usuario;

    RETURN json_build_object('success', 'Contrasena actualizada correctamente');
END;
$$ LANGUAGE plpgsql;
