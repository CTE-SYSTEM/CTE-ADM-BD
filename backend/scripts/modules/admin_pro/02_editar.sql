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
    IF p_actor_rol NOT IN ('admin_pro', 'Administrador', 'Admin') THEN
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

CREATE OR REPLACE FUNCTION admin_pro.actualizar_estado_diagnostico(
    p_id_diagnostico INT,
    p_estado TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_row JSONB;
BEGIN
    UPDATE "Diagnosticos"
    SET estado_del_diagnostico = p_estado
    WHERE id_diagnostico = p_id_diagnostico
    RETURNING to_jsonb("Diagnosticos".*) INTO v_row;

    IF v_row IS NULL THEN
        RETURN jsonb_build_object('error', 'Diagnostico no encontrado');
    END IF;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.actualizar_orden(
    p_id_orden INT,
    p_estado TEXT,
    p_tecnico_id INT,
    p_cambiar_tecnico BOOLEAN,
    p_resultado_final TEXT,
    p_observacion_final TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_row JSONB;
BEGIN
    UPDATE "Ordenes"
    SET estado = COALESCE(p_estado, estado),
        tecnico_id = CASE WHEN p_cambiar_tecnico THEN p_tecnico_id ELSE tecnico_id END,
        resultado_final = COALESCE(p_resultado_final, resultado_final),
        observacion_final = COALESCE(p_observacion_final, observacion_final),
        fecha_cierre = CASE WHEN UPPER(COALESCE(p_estado, '')) = 'FINALIZADO' THEN NOW() ELSE fecha_cierre END
    WHERE id_orden = p_id_orden
    RETURNING to_jsonb("Ordenes".*) INTO v_row;

    IF v_row IS NULL THEN
        RETURN jsonb_build_object('error', 'Orden no encontrada');
    END IF;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.actualizar_repuesto(
    p_id_repuesto INT,
    p_nombre TEXT,
    p_descripcion TEXT,
    p_costo_individual NUMERIC,
    p_porcentaje_ganancia NUMERIC,
    p_activo BOOLEAN,
    p_descontinuada BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_row JSONB;
BEGIN
    UPDATE "Repuestos"
    SET nombre = COALESCE(p_nombre, nombre),
        descripcion = COALESCE(p_descripcion, descripcion),
        costo_individual = COALESCE(p_costo_individual, costo_individual),
        porcentaje_de_ganacia = COALESCE(p_porcentaje_ganancia, porcentaje_de_ganacia),
        activo = COALESCE(p_activo, activo),
        descontinuada = COALESCE(p_descontinuada, descontinuada)
    WHERE id_repuesto = p_id_repuesto
    RETURNING to_jsonb("Repuestos".*) INTO v_row;

    IF v_row IS NULL THEN
        RETURN jsonb_build_object('error', 'Repuesto no encontrado');
    END IF;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.actualizar_equipo(
    p_id_equipo INT,
    p_tipo TEXT,
    p_marca TEXT,
    p_modelo TEXT,
    p_numero_serie TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_row JSONB;
BEGIN
    UPDATE "Equipos"
    SET tipo = COALESCE(p_tipo, tipo),
        marca = COALESCE(p_marca, marca),
        modelo = COALESCE(p_modelo, modelo),
        numero_serie = COALESCE(p_numero_serie, numero_serie)
    WHERE id_equipo = p_id_equipo;

    SELECT to_jsonb(e.*) || jsonb_build_object('cliente', to_jsonb(c.*))
    INTO v_row
    FROM "Equipos" e
    JOIN "Clientes" c ON e.cliente_id = c.id_cliente
    WHERE e.id_equipo = p_id_equipo;

    IF v_row IS NULL THEN
        RETURN jsonb_build_object('error', 'Equipo no encontrado');
    END IF;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.crear_garantia(
    p_factura_id INT,
    p_condiciones TEXT,
    p_duracion_meses INT
)
RETURNS JSONB AS $$
DECLARE
    v_row JSONB;
    v_inicio TIMESTAMP := NOW();
BEGIN
    INSERT INTO "Garantias" (factura_id, condiciones, duracion_meses, fecha_inicio, fecha_vencimiento)
    VALUES (p_factura_id, p_condiciones, p_duracion_meses, v_inicio, v_inicio + (p_duracion_meses || ' months')::INTERVAL)
    RETURNING to_jsonb("Garantias".*) INTO v_row;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.actualizar_garantia(
    p_id_garantia INT,
    p_condiciones TEXT,
    p_duracion_meses INT,
    p_renovar BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
    v_actual "Garantias"%ROWTYPE;
    v_inicio TIMESTAMP;
    v_duracion INT;
    v_row JSONB;
BEGIN
    SELECT * INTO v_actual FROM "Garantias" WHERE id_garantia = p_id_garantia;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Garantia no encontrada');
    END IF;

    v_duracion := COALESCE(p_duracion_meses, v_actual.duracion_meses, 3);
    v_inicio := CASE WHEN p_renovar THEN NOW() ELSE COALESCE(v_actual.fecha_inicio, NOW()) END;

    UPDATE "Garantias"
    SET condiciones = COALESCE(p_condiciones, condiciones),
        duracion_meses = v_duracion,
        fecha_inicio = CASE WHEN p_duracion_meses IS NOT NULL OR p_renovar THEN v_inicio ELSE fecha_inicio END,
        fecha_vencimiento = CASE WHEN p_duracion_meses IS NOT NULL OR p_renovar THEN v_inicio + (v_duracion || ' months')::INTERVAL ELSE fecha_vencimiento END
    WHERE id_garantia = p_id_garantia
    RETURNING to_jsonb("Garantias".*) INTO v_row;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.crear_usuario(
    p_nombre_usuario TEXT,
    p_correo_electronico TEXT,
    p_rol TEXT,
    p_hash TEXT,
    p_activo BOOLEAN,
    p_especialidad TEXT,
    p_horario TEXT,
    p_contacto TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_usuario "Usuarios"%ROWTYPE;
    v_tecnico JSONB;
BEGIN
    INSERT INTO "Usuarios" (nombre_usuario, correo_electronico, rol, contrasena_hash, activo)
    VALUES (p_nombre_usuario, p_correo_electronico, p_rol, p_hash, COALESCE(p_activo, TRUE))
    RETURNING * INTO v_usuario;

    IF p_rol = 'Tecnico' THEN
        INSERT INTO "Tecnicos" (usuario_id, nombre, especialidad, horario, contacto, activo)
        VALUES (v_usuario.id_usuario, p_nombre_usuario, p_especialidad, p_horario, COALESCE(p_contacto, p_correo_electronico), TRUE)
        RETURNING to_jsonb("Tecnicos".*) INTO v_tecnico;
    END IF;

    RETURN jsonb_build_object('usuario', to_jsonb(v_usuario), 'tecnico', v_tecnico);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.actualizar_usuario(
    p_id_usuario INT,
    p_nombre_usuario TEXT,
    p_correo_electronico TEXT,
    p_rol TEXT,
    p_activo BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_row JSONB;
BEGIN
    UPDATE "Usuarios"
    SET nombre_usuario = COALESCE(p_nombre_usuario, nombre_usuario),
        correo_electronico = COALESCE(p_correo_electronico, correo_electronico),
        rol = COALESCE(p_rol, rol),
        activo = COALESCE(p_activo, activo)
    WHERE id_usuario = p_id_usuario
    RETURNING to_jsonb("Usuarios".*) INTO v_row;

    IF v_row IS NULL THEN
        RETURN jsonb_build_object('error', 'Usuario no encontrado');
    END IF;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_pro.desactivar_usuario(p_id_usuario INT)
RETURNS JSONB AS $$
DECLARE
    v_row JSONB;
BEGIN
    UPDATE "Usuarios"
    SET activo = FALSE
    WHERE id_usuario = p_id_usuario
    RETURNING to_jsonb("Usuarios".*) INTO v_row;

    IF v_row IS NULL THEN
        RETURN jsonb_build_object('error', 'Usuario no encontrado');
    END IF;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;
