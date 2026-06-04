CREATE OR REPLACE FUNCTION secretaria_emitir_garantia_factura()
RETURNS TRIGGER AS $$
DECLARE
  condiciones_garantia TEXT;
BEGIN
  condiciones_garantia :=
    'Garantia de 3 meses sujeta a la reparacion realizada y a los repuestos instalados por el centro tecnico. '
    || 'Cubre fallas directamente relacionadas con el trabajo facturado. '
    || 'No cubre golpes, humedad, derrames, variaciones electricas, mala manipulacion, software, virus, perdida de informacion, accesorios externos ni reparaciones realizadas por terceros.';

  INSERT INTO "Garantias" (
    factura_id,
    condiciones,
    duracion_meses,
    fecha_inicio,
    fecha_vencimiento
  )
  VALUES (
    NEW.id_factura,
    condiciones_garantia,
    3,
    COALESCE(NEW.fecha_emision, NOW()),
    COALESCE(NEW.fecha_emision, NOW()) + INTERVAL '3 months'
  )
  ON CONFLICT (factura_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_emitir_garantia_factura ON "Facturas";

CREATE TRIGGER trg_emitir_garantia_factura
AFTER INSERT ON "Facturas"
FOR EACH ROW
EXECUTE FUNCTION secretaria_emitir_garantia_factura();

CREATE INDEX IF NOT EXISTS idx_garantias_fecha_vencimiento
ON "Garantias" (fecha_vencimiento ASC, id_garantia DESC);

CREATE INDEX IF NOT EXISTS idx_garantias_factura_id
ON "Garantias" (factura_id);

CREATE OR REPLACE VIEW secretaria_garantias_detalle AS
SELECT
  g.id_garantia,
  g.fecha_vencimiento,
  jsonb_build_object(
    'id_garantia', g.id_garantia,
    'factura_id', g.factura_id,
    'condiciones', g.condiciones,
    'duracion_meses', g.duracion_meses,
    'fecha_inicio', g.fecha_inicio,
    'fecha_vencimiento', g.fecha_vencimiento,
    'factura', f.data - 'garantias'
  ) AS data
FROM "Garantias" g
JOIN secretaria_facturas_detalle f ON f.id_factura = g.factura_id;

CREATE OR REPLACE FUNCTION get_garantias_secretaria()
RETURNS TABLE (data JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT g.data
  FROM secretaria_garantias_detalle g
  ORDER BY g.fecha_vencimiento ASC NULLS LAST, g.id_garantia DESC;
END;
$$ LANGUAGE plpgsql;
