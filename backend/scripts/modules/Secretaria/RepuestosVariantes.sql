-- Soporte para variantes de repuestos por proveedor/costo y stock acumulado.
-- Ejecutar una vez en la base antes de usar la nueva logica de Compras.

ALTER TABLE "Repuestos"
  ADD COLUMN IF NOT EXISTS proveedor_id INT,
  ADD COLUMN IF NOT EXISTS cantidad_disponible INT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Repuestos_proveedor_id_fkey'
  ) THEN
    ALTER TABLE "Repuestos"
      ADD CONSTRAINT "Repuestos_proveedor_id_fkey"
      FOREIGN KEY (proveedor_id)
      REFERENCES "Proveedores"(id_proveedor)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

UPDATE "Repuestos" r
SET proveedor_id = latest.proveedor_id
FROM (
  SELECT DISTINCT ON (repuesto_id)
    repuesto_id,
    proveedor_id
  FROM "Compras"
  WHERE proveedor_id IS NOT NULL
  ORDER BY repuesto_id, id_compra DESC
) latest
WHERE r.id_repuesto = latest.repuesto_id
  AND r.proveedor_id IS NULL;

UPDATE "Repuestos" r
SET cantidad_disponible = totals.cantidad_total
FROM (
  SELECT
    repuesto_id,
    COALESCE(SUM(cantidad), 0)::INT AS cantidad_total
  FROM "Compras"
  GROUP BY repuesto_id
) totals
WHERE r.id_repuesto = totals.repuesto_id;
