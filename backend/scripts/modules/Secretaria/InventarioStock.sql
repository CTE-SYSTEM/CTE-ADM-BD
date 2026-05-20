-- Control de stock de repuestos.
-- Entradas: Compras. Salidas: solicitudes de repuesto aprobadas en ordenes facturadas.

ALTER TABLE "Repuestos"
  ADD COLUMN IF NOT EXISTS stock_actual INT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Repuestos'
      AND column_name = 'cantidad_disponible'
  ) THEN
    UPDATE "Repuestos"
    SET stock_actual = GREATEST(stock_actual, cantidad_disponible);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_repuestos_stock_actual') THEN
    ALTER TABLE "Repuestos"
      ADD CONSTRAINT chk_repuestos_stock_actual
      CHECK (stock_actual >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION recalcular_stock_repuestos()
RETURNS VOID AS $$
BEGIN
  UPDATE "Repuestos" r
  SET stock_actual = GREATEST(
    COALESCE(entradas.total_entradas, 0) - COALESCE(salidas.total_salidas, 0),
    0
  )
  FROM (
    SELECT id_repuesto FROM "Repuestos"
  ) base
  LEFT JOIN (
    SELECT repuesto_id, COALESCE(SUM(cantidad), 0)::INT AS total_entradas
    FROM "Compras"
    GROUP BY repuesto_id
  ) entradas ON entradas.repuesto_id = base.id_repuesto
  LEFT JOIN (
    SELECT repuesto_id, COALESCE(SUM(cantidad_usada), 0)::INT AS total_salidas
    FROM "Ordenes_Repuestos" orp
    INNER JOIN "Facturas" f ON f.orden_id = orp.orden_id
    WHERE orp.estado_aprobacion = 'APROBADO'
      AND orp.repuesto_id IS NOT NULL
    GROUP BY orp.repuesto_id
  ) salidas ON salidas.repuesto_id = base.id_repuesto
  WHERE r.id_repuesto = base.id_repuesto;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ajustar_stock_por_compra()
RETURNS TRIGGER AS $$
DECLARE
  v_delta INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "Repuestos"
    SET stock_actual = stock_actual + COALESCE(NEW.cantidad, 0)
    WHERE id_repuesto = NEW.repuesto_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.repuesto_id IS DISTINCT FROM NEW.repuesto_id THEN
      UPDATE "Repuestos"
      SET stock_actual = stock_actual - COALESCE(OLD.cantidad, 0)
      WHERE id_repuesto = OLD.repuesto_id;

      UPDATE "Repuestos"
      SET stock_actual = stock_actual + COALESCE(NEW.cantidad, 0)
      WHERE id_repuesto = NEW.repuesto_id;
    ELSE
      v_delta := COALESCE(NEW.cantidad, 0) - COALESCE(OLD.cantidad, 0);
      UPDATE "Repuestos"
      SET stock_actual = stock_actual + v_delta
      WHERE id_repuesto = NEW.repuesto_id;
    END IF;

    RETURN NEW;
  END IF;

  UPDATE "Repuestos"
  SET stock_actual = stock_actual - COALESCE(OLD.cantidad, 0)
  WHERE id_repuesto = OLD.repuesto_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION aplicar_delta_stock_repuesto(
  p_repuesto_id INT,
  p_delta INT,
  p_contexto TEXT DEFAULT 'salida'
) RETURNS VOID AS $$
DECLARE
  v_stock INT;
BEGIN
  IF p_repuesto_id IS NULL OR COALESCE(p_delta, 0) = 0 THEN
    RETURN;
  END IF;

  SELECT stock_actual
  INTO v_stock
  FROM "Repuestos"
  WHERE id_repuesto = p_repuesto_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El repuesto seleccionado no existe';
  END IF;

  IF p_delta < 0 AND v_stock < ABS(p_delta) THEN
    RAISE EXCEPTION 'Stock insuficiente para %. Disponible: %, solicitado: %',
      p_contexto,
      v_stock,
      ABS(p_delta);
  END IF;

  UPDATE "Repuestos"
  SET stock_actual = stock_actual + p_delta
  WHERE id_repuesto = p_repuesto_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION orden_tiene_factura(p_orden_id INT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM "Facturas"
    WHERE orden_id = p_orden_id
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION aplicar_stock_por_orden_facturada(
  p_orden_id INT,
  p_signo INT,
  p_contexto TEXT DEFAULT 'facturacion'
) RETURNS VOID AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT repuesto_id, COALESCE(SUM(cantidad_usada), 0)::INT AS cantidad
    FROM "Ordenes_Repuestos"
    WHERE orden_id = p_orden_id
      AND estado_aprobacion = 'APROBADO'
      AND repuesto_id IS NOT NULL
    GROUP BY repuesto_id
  LOOP
    PERFORM aplicar_delta_stock_repuesto(
      v_item.repuesto_id,
      p_signo * v_item.cantidad,
      p_contexto
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ajustar_stock_por_factura()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM aplicar_stock_por_orden_facturada(NEW.orden_id, -1, 'facturar la orden');
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.orden_id IS DISTINCT FROM NEW.orden_id THEN
      PERFORM aplicar_stock_por_orden_facturada(OLD.orden_id, 1, 'corregir la factura anterior');
      PERFORM aplicar_stock_por_orden_facturada(NEW.orden_id, -1, 'facturar la orden');
    END IF;
    RETURN NEW;
  END IF;

  PERFORM aplicar_stock_por_orden_facturada(OLD.orden_id, 1, 'eliminar la factura');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validar_y_ajustar_stock_salida_facturada()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.estado_aprobacion = 'APROBADO'
       AND OLD.repuesto_id IS NOT NULL
       AND orden_tiene_factura(OLD.orden_id) THEN
      PERFORM aplicar_delta_stock_repuesto(
        OLD.repuesto_id,
        COALESCE(OLD.cantidad_usada, 1),
        'corregir repuesto facturado'
      );
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.estado_aprobacion = 'APROBADO'
     AND OLD.repuesto_id IS NOT NULL
     AND orden_tiene_factura(OLD.orden_id) THEN
    PERFORM aplicar_delta_stock_repuesto(
      OLD.repuesto_id,
      COALESCE(OLD.cantidad_usada, 1),
      'corregir repuesto facturado'
    );
  END IF;

  IF NEW.estado_aprobacion = 'APROBADO'
     AND NEW.repuesto_id IS NOT NULL
     AND orden_tiene_factura(NEW.orden_id) THEN
    PERFORM aplicar_delta_stock_repuesto(
      NEW.repuesto_id,
      -COALESCE(NEW.cantidad_usada, 1),
      'corregir repuesto facturado'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compras_stock_repuestos ON "Compras";
CREATE TRIGGER trg_compras_stock_repuestos
AFTER INSERT OR UPDATE OR DELETE ON "Compras"
FOR EACH ROW
EXECUTE FUNCTION ajustar_stock_por_compra();

DROP TRIGGER IF EXISTS trg_ordenes_repuestos_stock_salida ON "Ordenes_Repuestos";
CREATE TRIGGER trg_ordenes_repuestos_stock_salida
BEFORE INSERT OR UPDATE OR DELETE ON "Ordenes_Repuestos"
FOR EACH ROW
EXECUTE FUNCTION validar_y_ajustar_stock_salida_facturada();

DROP TRIGGER IF EXISTS trg_facturas_stock_repuestos ON "Facturas";
CREATE TRIGGER trg_facturas_stock_repuestos
BEFORE INSERT OR UPDATE OR DELETE ON "Facturas"
FOR EACH ROW
EXECUTE FUNCTION ajustar_stock_por_factura();

SELECT recalcular_stock_repuestos();
