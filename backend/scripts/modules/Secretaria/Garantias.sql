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
