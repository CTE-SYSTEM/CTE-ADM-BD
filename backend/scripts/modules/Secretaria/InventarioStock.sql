-- Control de stock de repuestos.
-- Entradas: Compras. Salidas: solicitudes de repuesto aprobadas.

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
    FROM "Ordenes_Repuestos"
    WHERE estado_aprobacion = 'APROBADO'
      AND repuesto_id IS NOT NULL
    GROUP BY repuesto_id
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

CREATE OR REPLACE FUNCTION validar_y_ajustar_stock_salida()
RETURNS TRIGGER AS $$
DECLARE
  v_old_salida INT := 0;
  v_new_salida INT := 0;
  v_stock INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.estado_aprobacion = 'APROBADO' AND OLD.repuesto_id IS NOT NULL THEN
      UPDATE "Repuestos"
      SET stock_actual = stock_actual + COALESCE(OLD.cantidad_usada, 1)
      WHERE id_repuesto = OLD.repuesto_id;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.estado_aprobacion = 'APROBADO'
     AND OLD.repuesto_id IS NOT NULL THEN
    v_old_salida := COALESCE(OLD.cantidad_usada, 1);
  END IF;

  IF NEW.estado_aprobacion = 'APROBADO' AND NEW.repuesto_id IS NOT NULL THEN
    v_new_salida := COALESCE(NEW.cantidad_usada, 1);
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.repuesto_id IS NOT NULL
     AND OLD.repuesto_id IS DISTINCT FROM NEW.repuesto_id
     AND v_old_salida > 0 THEN
    UPDATE "Repuestos"
    SET stock_actual = stock_actual + v_old_salida
    WHERE id_repuesto = OLD.repuesto_id;
    v_old_salida := 0;
  END IF;

  IF NEW.repuesto_id IS NOT NULL THEN
    SELECT stock_actual
    INTO v_stock
    FROM "Repuestos"
    WHERE id_repuesto = NEW.repuesto_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El repuesto seleccionado no existe';
    END IF;

    IF v_new_salida > v_old_salida AND v_stock < (v_new_salida - v_old_salida) THEN
      RAISE EXCEPTION 'Stock insuficiente para aprobar la salida. Disponible: %, solicitado: %',
        v_stock,
        v_new_salida - v_old_salida;
    END IF;

    UPDATE "Repuestos"
    SET stock_actual = stock_actual - (v_new_salida - v_old_salida)
    WHERE id_repuesto = NEW.repuesto_id
      AND (v_new_salida - v_old_salida) <> 0;
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
EXECUTE FUNCTION validar_y_ajustar_stock_salida();

SELECT recalcular_stock_repuestos();
