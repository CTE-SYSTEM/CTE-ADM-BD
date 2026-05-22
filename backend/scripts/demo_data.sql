-- backend/scripts/demo_data.sql
-- Carga demo amplia para la base del Centro Tecnico Electronico.
-- Borra los datos actuales, reinicia identidades y conserva los perfiles base del seed.
-- Las tablas de usuarios y tecnicos quedan iguales al seed base.
-- Las demas tablas quedan con al menos 100 filas para probar filtros, ordenamiento y paginacion.

BEGIN;

ALTER TABLE "Diagnosticos"
  ADD COLUMN IF NOT EXISTS presupuesto_estimado DECIMAL(18, 2),
  ADD COLUMN IF NOT EXISTS prioridad TEXT DEFAULT 'Normal';

ALTER TABLE "Repuestos"
  ADD COLUMN IF NOT EXISTS proveedor_id INT,
  ADD COLUMN IF NOT EXISTS ganancia_cordobas DECIMAL(18, 2),
  ADD COLUMN IF NOT EXISTS stock_actual INT NOT NULL DEFAULT 0;

ALTER TABLE "Ordenes"
  ADD COLUMN IF NOT EXISTS resultado_final TEXT,
  ADD COLUMN IF NOT EXISTS enciende_salida BOOLEAN,
  ADD COLUMN IF NOT EXISTS usa_corriente_ac_salida BOOLEAN,
  ADD COLUMN IF NOT EXISTS observacion_final TEXT,
  ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP;

ALTER TABLE "Ordenes_Repuestos"
  ADD COLUMN IF NOT EXISTS pieza_solicitada TEXT;

TRUNCATE TABLE
  "Garantias",
  "Facturas",
  "Ordenes_Repuestos",
  "Ordenes",
  "Compras",
  "Diagnosticos",
  "Repuestos",
  "Categorias_Repuestos",
  "Proveedores",
  "Equipos",
  "Clientes",
  "Tecnicos",
  "Usuarios"
RESTART IDENTITY CASCADE;

INSERT INTO "Usuarios" (id_usuario, nombre_usuario, contrasena_hash, correo_electronico, rol, activo, fecha_creacion)
VALUES
(1, 'admin_pro', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'admin@cte.com', 'Administrador', true, '2026-05-01 03:26:37.131'),
(6, 'secretaria_ana', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'secretaria@cte.com', 'Secretaria', true, '2026-05-01 03:27:51.627'),
(3, 'jefe_tecnico', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'jefe@cte.com', 'TecnicoJefe', true, '2026-05-01 03:26:37.131'),
(4, 'tecnico_juan', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'juan.perez@cte.com', 'Tecnico', true, '2026-05-01 03:26:37.131'),
(13, 'marcos_fix', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'marcos.fix@cte.com', 'Tecnico', true, '2026-05-04 21:55:19.615'),
(14, 'elena_tech', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'elena.tech@cte.com', 'Tecnico', true, '2026-05-04 21:55:33.366'),
(15, 'roberto_vga', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'roberto.vga@cte.com', 'Tecnico', true, '2026-05-04 21:55:46.188');

INSERT INTO "Tecnicos" (id_tecnico, nombre, especialidad, horario, contacto, usuario_id, activo)
VALUES
(1, 'Marcos Galindo', 'Microelectronica y Reballing', 'L-V 09:00-18:00', '+505 8888-1111', 13, true),
(3, 'Elena Rodriguez', 'Reparacion de Laptops High-End', 'L-V 08:00-17:00', 'elena.rodriguez@email.com', 14, true),
(4, 'Roberto Sosa', 'Consolas y Perifericos', 'Sabados 08:00-14:00', 'Ext. 104', 15, true),
(5, 'Juan Perez', 'Reparacion General y Moviles', 'L-V 08:00-17:00', 'tecnico@cte.com', 4, true),
(6, 'Ing. Ricardo Mendez', 'Jefe de Taller y Diagnostico', 'L-S 08:00-17:00', 'jefe@cte.com', 3, true);

INSERT INTO "Clientes" (
  id_cliente, nombre, telefono, direccion, correo, contacto_secundario, activo
)
SELECT
  gs,
  CASE
    WHEN gs % 5 = 0 THEN empresas[((gs - 1) % array_length(empresas, 1)) + 1] || ' ' || lpad(gs::text, 2, '0')
    ELSE nombres[((gs - 1) % array_length(nombres, 1)) + 1] || ' ' ||
      apellidos[((gs - 1) % array_length(apellidos, 1)) + 1]
  END,
  '+505 8124-' || lpad(gs::text, 4, '0'),
  direcciones[((gs - 1) % array_length(direcciones, 1)) + 1],
  lower(
    replace(nombres[((gs - 1) % array_length(nombres, 1)) + 1] || '.' ||
    apellidos[((gs - 1) % array_length(apellidos, 1)) + 1] || gs::text, ' ', '')
  ) || '@cliente.demo',
  CASE WHEN gs % 4 = 0 THEN '+505 2266-' || lpad(gs::text, 4, '0') ELSE NULL END,
  true
FROM generate_series(1, 120) AS gs
CROSS JOIN (
  SELECT
    ARRAY['Daniela','Gabriel','Paola','Roberto','Mariana','Kevin','Lucia','Oscar','Fernanda','Ricardo'] AS nombres,
    ARRAY['Vargas','Oporta','Duarte','Cardenas','Solis','Blandon','Reyes','Navarro','Pineda','Mendoza'] AS apellidos,
    ARRAY['Agroexportadora Las Brisas','Colegio Monte Sinai','RentaCar Pacifico','Clinica Los Robles','Ferreteria El Martillo'] AS empresas,
    ARRAY[
      'Managua, Altamira',
      'Masaya, barrio San Miguel',
      'Carretera Norte km 5',
      'Ciudad Jardin, Managua',
      'Tipitapa, barrio Roberto Vargas',
      'Los Robles, Managua',
      'Villa Libertad, Managua',
      'Carretera a Leon km 12'
    ] AS direcciones
) AS catalogos;

INSERT INTO "Equipos" (id_equipo, cliente_id, tipo, marca, modelo, numero_serie)
SELECT
  gs,
  gs,
  tipos[((gs - 1) % array_length(tipos, 1)) + 1],
  marcas[((gs - 1) % array_length(marcas, 1)) + 1],
  modelos[((gs - 1) % array_length(modelos, 1)) + 1] || ' ' || (100 + gs),
  'CTE-' || lpad(gs::text, 4, '0') || '-' || upper(substr(md5(gs::text), 1, 6))
FROM generate_series(1, 120) AS gs
CROSS JOIN (
  SELECT
    ARRAY['Laptop','PC Escritorio','Celular','Tablet','Impresora','Monitor','Consola','Proyector'] AS tipos,
    ARRAY['Dell','HP','Lenovo','Apple','Samsung','Asus','Acer','Canon','Brother','Epson','LG','Xiaomi'] AS marcas,
    ARRAY['Precision','EliteDesk','ThinkPad','iPhone','Galaxy','ZenBook','Nitro','G3110','HL-L6200DW','PowerLite','Odyssey','Poco'] AS modelos
) AS catalogos;

INSERT INTO "Proveedores" (
  id_proveedor, nombre, telefono, direccion, correo, web, notas, descontinuada
)
SELECT
  gs,
  proveedores[((gs - 1) % array_length(proveedores, 1)) + 1] || ' ' || lpad(gs::text, 2, '0'),
  '+505 2255-' || lpad((9000 + gs)::text, 4, '0'),
  direcciones[((gs - 1) % array_length(direcciones, 1)) + 1],
  'ventas' || gs::text || '@proveedor.demo',
  CASE WHEN gs % 3 = 0 THEN 'https://proveedor' || gs::text || '.demo' ELSE NULL END,
  notas[((gs - 1) % array_length(notas, 1)) + 1],
  gs % 10 = 0
FROM generate_series(1, 120) AS gs
CROSS JOIN (
  SELECT
    ARRAY['Central Parts NI','MovilLab Mayoreo','Importadora MicroFix','Printer Hub Nicaragua','GameBoard Supply','Display Boards CA','Energia Digital','Tecno Repuestos'] AS proveedores,
    ARRAY['Plaza Espana, Managua','Mercado Oriental, Managua','Carretera a Masaya km 9','Los Robles, Managua','Altamira, Managua','Ciudad Jardin, Managua'] AS direcciones,
    ARRAY[
      'Proveedor de inventario regular.',
      'Validar lote antes de instalar.',
      'Buen tiempo de entrega en pedidos urgentes.',
      'Mantiene garantia limitada por pieza.',
      'Usar para repuestos bajo pedido.'
    ] AS notas
) AS catalogos;

INSERT INTO "Categorias_Repuestos" (id_tipo_repuesto, nombre_tipo, electronico)
SELECT
  gs,
  categorias[((gs - 1) % array_length(categorias, 1)) + 1] || ' ' || lpad(gs::text, 2, '0'),
  electronicos[((gs - 1) % array_length(electronicos, 1)) + 1]
FROM generate_series(1, 120) AS gs
CROSS JOIN (
  SELECT
    ARRAY[
      'Pantallas y displays',
      'Energia y carga',
      'Almacenamiento',
      'Memoria RAM',
      'Conectores y flex',
      'Enfriamiento',
      'Impresion',
      'Tarjetas electronicas',
      'Baterias',
      'Perifericos internos'
    ] AS categorias,
    ARRAY[
      'Laptop/Celular/Tablet',
      'Laptop/PC/Celular',
      'Laptop/PC',
      'Impresora',
      'Monitor/Consola/Proyector',
      'Equipos varios'
    ] AS electronicos
) AS catalogos;

INSERT INTO "Repuestos" (
  id_repuesto, tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual,
  porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada
)
SELECT
  gs,
  ((gs - 1) % 120) + 1,
  ((gs - 1) % 120) + 1,
  piezas[((gs - 1) % array_length(piezas, 1)) + 1] || ' ' || lpad(gs::text, 2, '0'),
  'Repuesto demo para pruebas de inventario y ordenes #' || gs::text,
  round((8 + (gs * 3.75))::numeric, 2),
  round((0.20 + ((gs % 8) * 0.04))::numeric, 2),
  round((120 + (gs * 35.50))::numeric, 2),
  0,
  gs % 12 <> 0,
  gs % 15 = 0
FROM generate_series(1, 120) AS gs
CROSS JOIN (
  SELECT ARRAY[
    'SSD NVMe 1TB',
    'RAM DDR4 16GB SODIMM',
    'Cargador USB-C 90W',
    'Fuente ATX 650W',
    'Flex de carga',
    'Bateria interna',
    'Power board',
    'Main board',
    'Fusor laser',
    'Rodillo de alimentacion',
    'Puerto HDMI',
    'Retimer HDMI',
    'Ventilador CPU',
    'Kit pasta termica',
    'Pantalla AMOLED',
    'Jack DC',
    'Teclado latinoamericano',
    'Cable flex LVDS',
    'Conector USB',
    'Modulo WiFi'
  ] AS piezas
) AS catalogos;

INSERT INTO "Compras" (
  id_compra, repuesto_id, proveedor_id, documento, fecha_obtencion,
  cantidad, costo_unitario, metodo_pago
)
SELECT
  gs,
  gs,
  gs,
  'FAC-DEMO-2026-' || lpad(gs::text, 4, '0'),
  TIMESTAMP '2026-05-02 09:00:00' + ((gs - 1) * INTERVAL '7 hours'),
  4 + (gs % 9),
  round((8 + (gs * 3.75))::numeric, 2),
  metodos[((gs - 1) % array_length(metodos, 1)) + 1]
FROM generate_series(1, 120) AS gs
CROSS JOIN (SELECT ARRAY['Efectivo','Transferencia','Tarjeta','Transferencia'] AS metodos) AS catalogos;

INSERT INTO "Diagnosticos" (
  id_diagnostico, equipo_id, tecnico_id, falla_reportada, diagnostico_real,
  presupuesto_estimado, prioridad, fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
  deja_cargador, enciende, usa_corriente_ac
)
SELECT
  gs,
  gs,
  tecnico_ids[((gs - 1) % array_length(tecnico_ids, 1)) + 1],
  fallas[((gs - 1) % array_length(fallas, 1)) + 1],
  diagnosticos[((gs - 1) % array_length(diagnosticos, 1)) + 1],
  round((950 + (gs * 185.75))::numeric, 2),
  prioridades[((gs - 1) % array_length(prioridades, 1)) + 1],
  TIMESTAMP '2026-05-05 08:00:00' + ((gs - 1) * INTERVAL '5 hours'),
  TIMESTAMP '2026-05-05 09:00:00' + ((gs - 1) * INTERVAL '5 hours'),
  estados_diag[((gs - 1) % array_length(estados_diag, 1)) + 1],
  aprobaciones[((gs - 1) % array_length(aprobaciones, 1)) + 1],
  gs % 2 = 0,
  gs % 5 <> 0,
  gs % 3 <> 0
FROM generate_series(1, 120) AS gs
CROSS JOIN (
  SELECT
    ARRAY[
      'Equipo no enciende despues de variacion electrica.',
      'Arranca lento y presenta errores de disco.',
      'No carga y se apaga al mover el cable.',
      'Pantalla quebrada sin respuesta tactil.',
      'Se recalienta durante uso normal.',
      'Imprime con manchas y atasco frecuente.',
      'No da imagen por HDMI.',
      'Bateria dura menos de una hora.',
      'Teclado escribe caracteres repetidos.',
      'Se reinicia al abrir aplicaciones pesadas.'
    ] AS fallas,
    ARRAY[
      'Fuente con salida inestable; requiere reemplazo.',
      'Unidad de almacenamiento degradada; se recomienda cambio y migracion.',
      'Puerto de carga con sulfato; requiere cambio de flex.',
      'Modulo de pantalla danado; requiere sustitucion completa.',
      'Sistema de enfriamiento obstruido; requiere limpieza y pasta termica.',
      'Rodillos y fusor desgastados; requiere kit de mantenimiento.',
      'Tarjeta principal con falla en entrada de video.',
      'Bateria degradada; no usar hasta reemplazo.',
      'Teclado con membrana defectuosa.',
      'Memoria RAM inestable bajo carga.'
    ] AS diagnosticos,
    ARRAY[1,3,4,5,6] AS tecnico_ids,
    ARRAY['Urgente','Alta','Normal','Normal'] AS prioridades,
    ARRAY['DIAGNOSTICADO','EN_REVISION','COMPLETADO','PENDIENTE'] AS estados_diag,
    ARRAY['Aprobado','Pendiente','Rechazado','Pendiente'] AS aprobaciones
) AS catalogos;

INSERT INTO "Ordenes" (
  id_orden, diagnostico_id, tecnico_id, prioridad, estado, fecha_ingreso,
  resultado_final, enciende_salida, usa_corriente_ac_salida, observacion_final, fecha_cierre
)
SELECT
  gs,
  gs,
  tecnico_ids[((gs - 1) % array_length(tecnico_ids, 1)) + 1],
  prioridades[((gs - 1) % array_length(prioridades, 1)) + 1],
  estados[((gs - 1) % array_length(estados, 1)) + 1],
  TIMESTAMP '2026-05-06 08:30:00' + ((gs - 1) * INTERVAL '6 hours'),
  CASE WHEN gs % 4 IN (0, 1) THEN resultados[((gs - 1) % array_length(resultados, 1)) + 1] ELSE NULL END,
  CASE WHEN gs % 4 IN (0, 1) THEN gs % 5 <> 0 ELSE NULL END,
  CASE WHEN gs % 4 IN (0, 1) THEN gs % 3 <> 0 ELSE NULL END,
  observaciones[((gs - 1) % array_length(observaciones, 1)) + 1],
  CASE WHEN gs % 4 IN (0, 1) THEN TIMESTAMP '2026-05-12 16:00:00' + (gs * INTERVAL '3 hours') ELSE NULL END
FROM generate_series(1, 120) AS gs
CROSS JOIN (
  SELECT
    ARRAY[1,3,4,5,6] AS tecnico_ids,
    ARRAY['Urgente','Alta','Normal','Normal'] AS prioridades,
    ARRAY['PENDIENTE','APROBADO','EN_REPARACION','ESPERANDO_PIEZA','FINALIZADO','ENTREGADO','IRREPARABLE','APROBADO'] AS estados,
    ARRAY['REPARADO','IRREPARABLE','REPARADO','IRREPARABLE'] AS resultados,
    ARRAY[
      'Orden demo para flujo tecnico.',
      'Pendiente confirmacion del cliente.',
      'Repuesto solicitado a inventario.',
      'Pruebas funcionales en proceso.',
      'Equipo listo para revision final.'
    ] AS observaciones
) AS catalogos;

INSERT INTO "Ordenes_Repuestos" (
  id_detalle_repuesto, orden_id, repuesto_id, pieza_solicitada, cantidad_usada, estado_aprobacion
)
SELECT
  gs,
  gs,
  ((gs - 1) % 120) + 1,
  'Pieza solicitada demo #' || lpad(gs::text, 2, '0'),
  1 + (gs % 3),
  estados[((gs - 1) % array_length(estados, 1)) + 1]
FROM generate_series(1, 120) AS gs
CROSS JOIN (SELECT ARRAY['APROBADO','PENDIENTE','DENEGADO','APROBADO'] AS estados) AS catalogos;

INSERT INTO "Facturas" (
  id_factura, orden_id, fecha_emision, monto_repuestos, mano_obra,
  subtotal, impuestos, total, metodo_pago
)
SELECT
  gs,
  gs,
  TIMESTAMP '2026-05-13 10:00:00' + ((gs - 1) * INTERVAL '8 hours'),
  round((300 + (gs * 42.25))::numeric, 2) AS monto_repuestos,
  round((650 + (gs * 28.50))::numeric, 2) AS mano_obra,
  round((950 + (gs * 70.75))::numeric, 2) AS subtotal,
  round(((950 + (gs * 70.75)) * 0.15)::numeric, 2) AS impuestos,
  round(((950 + (gs * 70.75)) * 1.15)::numeric, 2) AS total,
  metodos[((gs - 1) % array_length(metodos, 1)) + 1]
FROM generate_series(1, 120) AS gs
CROSS JOIN (SELECT ARRAY['Efectivo','Transferencia','Tarjeta','Transferencia'] AS metodos) AS catalogos;

INSERT INTO "Garantias" (
  factura_id, condiciones, duracion_meses, fecha_inicio, fecha_vencimiento
)
SELECT
  gs,
  condiciones[((gs - 1) % array_length(condiciones, 1)) + 1],
  1 + (gs % 6),
  TIMESTAMP '2026-05-13 10:00:00' + ((gs - 1) * INTERVAL '8 hours'),
  TIMESTAMP '2026-05-13 10:00:00' + ((gs - 1) * INTERVAL '8 hours') + ((1 + (gs % 6)) * INTERVAL '1 month')
FROM generate_series(1, 120) AS gs
CROSS JOIN (
  SELECT ARRAY[
    'Garantia limitada sobre repuesto instalado; no cubre humedad ni golpes.',
    'Garantia sobre mano de obra y ajuste final del equipo.',
    'Garantia condicionada a uso correcto y regulacion electrica.',
    'Servicio de diagnostico con garantia limitada por revision.',
    'Garantia sobre limpieza, calibracion y pruebas funcionales.'
  ] AS condiciones
) AS catalogos
ON CONFLICT (factura_id) DO UPDATE
SET condiciones = EXCLUDED.condiciones,
    duracion_meses = EXCLUDED.duracion_meses,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_vencimiento = EXCLUDED.fecha_vencimiento;

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

SELECT setval(pg_get_serial_sequence('"Usuarios"', 'id_usuario'), GREATEST((SELECT max(id_usuario) FROM "Usuarios"), 1));
SELECT setval(pg_get_serial_sequence('"Tecnicos"', 'id_tecnico'), GREATEST((SELECT max(id_tecnico) FROM "Tecnicos"), 1));
SELECT setval(pg_get_serial_sequence('"Clientes"', 'id_cliente'), GREATEST((SELECT max(id_cliente) FROM "Clientes"), 1));
SELECT setval(pg_get_serial_sequence('"Equipos"', 'id_equipo'), GREATEST((SELECT max(id_equipo) FROM "Equipos"), 1));
SELECT setval(pg_get_serial_sequence('"Categorias_Repuestos"', 'id_tipo_repuesto'), GREATEST((SELECT max(id_tipo_repuesto) FROM "Categorias_Repuestos"), 1));
SELECT setval(pg_get_serial_sequence('"Repuestos"', 'id_repuesto'), GREATEST((SELECT max(id_repuesto) FROM "Repuestos"), 1));
SELECT setval(pg_get_serial_sequence('"Proveedores"', 'id_proveedor'), GREATEST((SELECT max(id_proveedor) FROM "Proveedores"), 1));
SELECT setval(pg_get_serial_sequence('"Compras"', 'id_compra'), GREATEST((SELECT max(id_compra) FROM "Compras"), 1));
SELECT setval(pg_get_serial_sequence('"Diagnosticos"', 'id_diagnostico'), GREATEST((SELECT max(id_diagnostico) FROM "Diagnosticos"), 1));
SELECT setval(pg_get_serial_sequence('"Ordenes"', 'id_orden'), GREATEST((SELECT max(id_orden) FROM "Ordenes"), 1));
SELECT setval(pg_get_serial_sequence('"Ordenes_Repuestos"', 'id_detalle_repuesto'), GREATEST((SELECT max(id_detalle_repuesto) FROM "Ordenes_Repuestos"), 1));
SELECT setval(pg_get_serial_sequence('"Facturas"', 'id_factura'), GREATEST((SELECT max(id_factura) FROM "Facturas"), 1));
SELECT setval(pg_get_serial_sequence('"Garantias"', 'id_garantia'), GREATEST((SELECT max(id_garantia) FROM "Garantias"), 1));

COMMIT;
