-- backend/scripts/demo_data.sql
-- Datos de prueba para validar nuevas funcionalidades:
-- - Inventario con stock_actual calculado desde compras y salidas aprobadas facturadas.
-- - Repuestos con proveedor principal, ganancia fija y variantes por compra.
-- - Diagnosticos con prioridad, aprobacion/rechazo y presupuestos.
-- - Ordenes en estados operativos: aprobada, en reparacion, esperando pieza,
--   finalizada, irreparable y entregada.
-- - Solicitudes de repuestos pendientes, aprobadas y denegadas.
-- - Facturas unicas por orden y garantias proximas a vencer.
-- Rango reservado para demo: IDs 9000-9999.

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

-- Limpiar solo datos demo. No toca datos reales fuera del rango 9000-9999.
DELETE FROM "Garantias" WHERE id_garantia BETWEEN 9000 AND 9999 OR factura_id BETWEEN 9000 AND 9999;
DELETE FROM "Facturas" WHERE id_factura BETWEEN 9000 AND 9999;
DELETE FROM "Ordenes_Repuestos" WHERE id_detalle_repuesto BETWEEN 9000 AND 9999;
DELETE FROM "Ordenes" WHERE id_orden BETWEEN 9000 AND 9999;
DELETE FROM "Compras" WHERE id_compra BETWEEN 9000 AND 9999;
DELETE FROM "Diagnosticos" WHERE id_diagnostico BETWEEN 9000 AND 9999;
DELETE FROM "Repuestos" WHERE id_repuesto BETWEEN 9000 AND 9999;
DELETE FROM "Categorias_Repuestos" WHERE id_tipo_repuesto BETWEEN 9000 AND 9999;
DELETE FROM "Proveedores" WHERE id_proveedor BETWEEN 9000 AND 9999;
DELETE FROM "Equipos" WHERE id_equipo BETWEEN 9000 AND 9999;
DELETE FROM "Clientes" WHERE id_cliente BETWEEN 9000 AND 9999;
DELETE FROM "Tecnicos" WHERE id_tecnico BETWEEN 9000 AND 9999;
DELETE FROM "Usuarios" WHERE id_usuario BETWEEN 9000 AND 9999;

INSERT INTO "Usuarios" (id_usuario, nombre_usuario, contrasena_hash, correo_electronico, rol, activo, fecha_creacion) VALUES
(9001, 'tecnico_demo_luis', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'luis.demo@cte.com', 'Tecnico', true, '2026-05-01 08:00:00'),
(9002, 'tecnico_demo_marta', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'marta.demo@cte.com', 'Tecnico', true, '2026-05-01 08:00:00'),
(9003, 'tecnico_demo_brayan', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'brayan.demo@cte.com', 'Tecnico', true, '2026-05-01 08:00:00'),
(9004, 'tecnico_demo_sofia', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'sofia.demo@cte.com', 'Tecnico', true, '2026-05-01 08:00:00');

INSERT INTO "Tecnicos" (id_tecnico, usuario_id, nombre, especialidad, horario, contacto, activo) VALUES
(9001, 9001, 'Luis Aragon', 'Diagnostico de laptops y estaciones de trabajo', 'L-V 08:00-17:00', '+505 8888-2101', true),
(9002, 9002, 'Marta Castillo', 'Celulares, tablets y micro soldadura', 'L-V 09:00-18:00', '+505 8888-2102', true),
(9003, 9003, 'Brayan Morales', 'Impresoras, monitores y proyectores', 'L-S 08:00-14:00', '+505 8888-2103', true),
(9004, 9004, 'Sofia Duarte', 'Consolas, GPU y equipos gamer', 'L-V 10:00-19:00', '+505 8888-2104', true);

INSERT INTO "Clientes" (id_cliente, nombre, telefono, direccion, correo, contacto_secundario, activo) VALUES
(9001, 'Agroexportadora Las Brisas', '+505 8124-9001', 'Carretera a Leon km 12, Managua', 'soporte@lasbrisas.example', '+505 2266-9010', true),
(9002, 'Daniela Vargas', '+505 8124-9002', 'Villa Libertad, Managua', 'daniela.vargas@mail.com', NULL, true),
(9003, 'Colegio Monte Sinai', '+505 8124-9003', 'Ciudad Jardin, Managua', 'admin@montesinai.edu.ni', '+505 2270-5511', true),
(9004, 'RentaCar Pacifico', '+505 8124-9004', 'Carretera Norte km 5', 'operaciones@rentapacifico.example', '+505 2248-1100', true),
(9005, 'Gabriel Oporta', '+505 8124-9005', 'Masaya, barrio San Miguel', 'gabriel.oporta@mail.com', NULL, true),
(9006, 'Clinica Los Robles', '+505 8124-9006', 'Los Robles, Managua', 'it@clinicalosrobles.example', '+505 2225-7730', true),
(9007, 'Paola Duarte', '+505 8124-9007', 'Altamira, Managua', 'paola.duarte@mail.com', NULL, true),
(9008, 'Ferreteria El Martillo', '+505 8124-9008', 'Mercado Mayoreo modulo C-18', 'compras@elmartillo.example', '+505 8760-3312', true),
(9009, 'Universidad Tecnica Central', '+505 8124-9009', 'Rotonda Universitaria 2c abajo', 'mesa.ayuda@utc.edu.ni', '+505 2278-4444', true),
(9010, 'Roberto Cardenas', '+505 8124-9010', 'Tipitapa, barrio Roberto Vargas', 'roberto.cardenas@mail.com', NULL, true);

INSERT INTO "Equipos" (id_equipo, cliente_id, tipo, marca, modelo, numero_serie) VALUES
(9001, 9001, 'Laptop', 'Dell', 'Precision 3561', 'DP3561-AB91'),
(9002, 9001, 'Pc Escritorio', 'HP', 'EliteDesk 800 G6', 'HP800G6-2210'),
(9003, 9002, 'Celular', 'Apple', 'iPhone 13', 'F17H9QLYQ05D'),
(9004, 9003, 'Proyector', 'Epson', 'PowerLite X49', 'EPX49-7742'),
(9005, 9004, 'Laptop', 'Lenovo', 'ThinkPad T14 Gen 2', 'PF4R0N9A'),
(9006, 9005, 'Consola', 'Microsoft', 'Xbox Series S', 'XSS-92014'),
(9007, 9006, 'Impresora', 'Brother', 'HL-L6200DW', 'BR6200-6501'),
(9008, 9006, 'Monitor', 'Samsung', 'Odyssey G5 27', 'SG5-27190'),
(9009, 9007, 'Tablet', 'Samsung', 'Galaxy Tab S7 FE', 'R52T90AA11'),
(9010, 9008, 'Impresora', 'Canon', 'G3110', 'CN-G3110-3319'),
(9011, 9009, 'Laptop', 'Asus', 'ZenBook 14 OLED', 'ASZ14-6023'),
(9012, 9009, 'Laptop', 'Acer', 'Nitro 5 AN515', 'NHQF8-1788'),
(9013, 9010, 'Celular', 'Xiaomi', 'Poco X5 Pro', 'XM-PX5-4432'),
(9014, 9010, 'Monitor', 'LG', '27MP400', 'LG27MP-8790');

INSERT INTO "Proveedores" (id_proveedor, nombre, telefono, direccion, correo, web, notas, descontinuada) VALUES
(9001, 'Central Parts NI', '+505 2255-9101', 'Plaza Espana, Managua', 'ventas@centralparts.example', 'https://centralparts.example', 'Proveedor principal para SSD, RAM, fuentes y cargadores.', false),
(9002, 'MovilLab Mayoreo', '+505 2255-9102', 'Mercado Oriental, Managua', 'pedidos@movillab.example', NULL, 'Pantallas, baterias y flex de celulares. Validar calidad de tactil.', false),
(9003, 'Importadora MicroFix', '+505 2255-9103', 'Carretera a Masaya km 9.8', 'compras@microfix.example', 'https://microfix.example', 'Repuestos bajo pedido y componentes de micro soldadura.', false),
(9004, 'Printer Hub Nicaragua', '+505 2255-9104', 'Los Robles, Managua', 'ventas@printerhub.example', NULL, 'Rodillos, fusores, almohadillas y tintas.', false),
(9005, 'GameBoard Supply', '+505 2255-9105', 'Altamira, Managua', 'supply@gameboard.example', NULL, 'Consolas, puertos HDMI, retimers y controles.', false),
(9006, 'Display Boards Centroamerica', '+505 2255-9106', 'Ciudad Jardin, Managua', 'ventas@displayboards.example', NULL, 'Tarjetas main board y power board usadas certificadas.', false),
(9007, 'Energia y Baterias Digitales', '+505 2255-9107', 'Masaya centro', 'ventas@energiadigital.example', NULL, 'Baterias, cargadores USB-C y fuentes de poder.', false),
(9008, 'Proveedor Legacy Suspendido', '+505 2255-9199', 'Managua', 'legacy@suspendido.example', NULL, 'Proveedor descontinuado para validar filtros.', true);

INSERT INTO "Categorias_Repuestos" (id_tipo_repuesto, nombre_tipo, electronico) VALUES
(9001, 'Pantallas y displays', 'Laptop/Celular/Tablet/Monitor'),
(9002, 'Energia y carga', 'Laptop/PC/Celular/Tablet'),
(9003, 'Almacenamiento', 'Laptop/PC'),
(9004, 'Memoria RAM', 'Laptop/PC'),
(9005, 'Conectores y flex', 'Celular/Tablet/Laptop/Consola'),
(9006, 'Enfriamiento', 'Laptop/Consola/PC'),
(9007, 'Impresion', 'Impresora'),
(9008, 'Tarjetas electronicas', 'Monitor/Consola/Proyector'),
(9009, 'Baterias', 'Laptop/Celular/Tablet'),
(9010, 'Perifericos internos', 'Laptop/PC');

INSERT INTO "Repuestos" (
  id_repuesto, tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual,
  porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada
) VALUES
(9001, 9003, 9001, 'SSD NVMe 1TB Kingston NV2', 'Unidad M.2 PCIe para laptops y estaciones de trabajo', 68.00, 0.25, 850.00, 0, true, false),
(9002, 9004, 9001, 'RAM DDR4 16GB 3200 SODIMM', 'Memoria para laptop empresarial', 42.00, 0.30, 520.00, 0, true, false),
(9003, 9002, 9007, 'Cargador USB-C 90W PD', 'Adaptador para laptop con proteccion de voltaje', 31.50, 0.35, 410.00, 0, true, false),
(9004, 9002, 9001, 'Fuente ATX 650W 80 Plus Bronze', 'Fuente para PC de escritorio', 58.00, 0.28, 760.00, 0, true, false),
(9005, 9005, 9002, 'Flex de carga iPhone 13', 'Sub board con puerto Lightning y microfono', 18.75, 0.45, 360.00, 0, true, false),
(9006, 9009, 9002, 'Bateria iPhone 13', 'Bateria compatible alta capacidad', 29.00, 0.40, 480.00, 0, true, false),
(9007, 9008, 9006, 'Power board Samsung Odyssey G5', 'Tarjeta de alimentacion probada para monitor G5', 49.00, 0.30, 700.00, 0, true, false),
(9008, 9008, 9006, 'Main board Epson PowerLite X49', 'Tarjeta logica usada certificada', 86.00, 0.24, 1100.00, 0, true, false),
(9009, 9007, 9004, 'Fusor Brother HL-L6200DW', 'Unidad fusora compatible', 74.00, 0.26, 900.00, 0, true, false),
(9010, 9007, 9004, 'Rodillo alimentacion Canon G3110', 'Kit de rodillos para bandeja principal', 12.00, 0.50, 220.00, 0, true, false),
(9011, 9005, 9005, 'Puerto HDMI Xbox Series S', 'Conector HDMI para placa de consola', 6.50, 0.70, 180.00, 0, true, false),
(9012, 9006, 9005, 'Retimer HDMI Xbox Series S', 'Circuito retimer compatible', 22.00, 0.45, 390.00, 0, true, false),
(9013, 9006, 9001, 'Ventilador Acer Nitro 5 AN515', 'Fan CPU/GPU compatible', 19.50, 0.40, 330.00, 0, true, false),
(9014, 9006, 9001, 'Kit pasta termica premium', 'Pasta termica y pads para CPU/GPU', 8.00, 0.55, 160.00, 0, true, false),
(9015, 9001, 9002, 'Pantalla Poco X5 Pro AMOLED', 'Modulo completo con tactil', 96.00, 0.32, 980.00, 0, true, false),
(9016, 9005, 9003, 'Jack DC Asus ZenBook 14', 'Conector de carga con cable flexible', 11.50, 0.48, 260.00, 0, true, false),
(9017, 9009, 9007, 'Bateria Galaxy Tab S7 FE', 'Bateria compatible para tablet Samsung', 44.00, 0.36, 620.00, 0, true, false),
(9018, 9010, 9001, 'Teclado ThinkPad T14 LA', 'Teclado latinoamericano retroiluminado', 34.00, 0.35, 520.00, 0, true, false),
(9019, 9008, 9008, 'Main board LG 27MP400 legacy', 'Tarjeta usada de proveedor suspendido', 39.00, 0.20, 400.00, 0, false, true),
(9020, 9002, 9007, 'Cargador propietario Lenovo 65W', 'Adaptador rectangular slim tip', 23.50, 0.34, 320.00, 0, true, false);

INSERT INTO "Compras" (
  id_compra, repuesto_id, proveedor_id, documento, fecha_obtencion,
  cantidad, costo_unitario, metodo_pago
) VALUES
(9001, 9001, 9001, 'FAC-CPN-2026-0801', '2026-05-02 09:10:00', 8, 68.00, 'Transferencia'),
(9002, 9002, 9001, 'FAC-CPN-2026-0802', '2026-05-02 09:15:00', 10, 42.00, 'Transferencia'),
(9003, 9003, 9007, 'FAC-EBD-4410', '2026-05-03 11:40:00', 6, 31.50, 'Tarjeta'),
(9004, 9004, 9001, 'FAC-CPN-2026-0815', '2026-05-04 10:20:00', 4, 58.00, 'Transferencia'),
(9005, 9005, 9002, 'REC-MLM-9102', '2026-05-04 15:30:00', 7, 18.75, 'Efectivo'),
(9006, 9006, 9002, 'REC-MLM-9103', '2026-05-04 15:35:00', 5, 29.00, 'Efectivo'),
(9007, 9007, 9006, 'FAC-DBC-3310', '2026-05-05 08:55:00', 2, 49.00, 'Transferencia'),
(9008, 9008, 9006, 'FAC-DBC-3311', '2026-05-05 09:00:00', 1, 86.00, 'Transferencia'),
(9009, 9009, 9004, 'FAC-PHN-7150', '2026-05-06 13:20:00', 2, 74.00, 'Tarjeta'),
(9010, 9010, 9004, 'FAC-PHN-7151', '2026-05-06 13:25:00', 6, 12.00, 'Tarjeta'),
(9011, 9011, 9005, 'FAC-GBS-2217', '2026-05-07 10:10:00', 8, 6.50, 'Efectivo'),
(9012, 9012, 9005, 'FAC-GBS-2218', '2026-05-07 10:12:00', 4, 22.00, 'Efectivo'),
(9013, 9013, 9001, 'FAC-CPN-2026-0830', '2026-05-08 09:40:00', 4, 19.50, 'Transferencia'),
(9014, 9014, 9001, 'FAC-CPN-2026-0831', '2026-05-08 09:42:00', 12, 8.00, 'Transferencia'),
(9015, 9015, 9002, 'REC-MLM-9140', '2026-05-09 16:05:00', 3, 96.00, 'Efectivo'),
(9016, 9016, 9003, 'FAC-MFX-5201', '2026-05-10 12:00:00', 5, 11.50, 'Transferencia'),
(9017, 9017, 9007, 'FAC-EBD-4452', '2026-05-10 12:30:00', 3, 44.00, 'Tarjeta'),
(9018, 9018, 9001, 'FAC-CPN-2026-0840', '2026-05-11 09:50:00', 3, 34.00, 'Transferencia'),
(9019, 9020, 9007, 'FAC-EBD-4460', '2026-05-11 15:10:00', 5, 23.50, 'Transferencia'),
(9020, 9001, 9003, 'FAC-MFX-5240', '2026-05-15 10:00:00', 2, 66.00, 'Transferencia');

INSERT INTO "Diagnosticos" (
  id_diagnostico, equipo_id, tecnico_id, falla_reportada, diagnostico_real,
  presupuesto_estimado, prioridad, fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
  deja_cargador, enciende, usa_corriente_ac
) VALUES
(9001, 9001, 9001, 'Equipo tarda demasiado en iniciar y muestra errores SMART.', 'SSD degradado; se recomienda cambio a NVMe 1TB y migracion de datos.', 3850.00, 'Alta', '2026-05-12 08:30:00', '2026-05-12 09:00:00', 'DIAGNOSTICADO', 'Aprobado', true, true, true),
(9002, 9002, 9001, 'No enciende despues de variacion electrica.', 'Fuente ATX sin salida estable; placa madre responde con fuente de prueba.', 2950.00, 'Urgente', '2026-05-12 10:20:00', '2026-05-12 10:45:00', 'DIAGNOSTICADO', 'Aprobado', false, false, true),
(9003, 9003, 9002, 'No carga y reinicia al mover el cable.', 'Flex de carga con sulfato; bateria aun funcional.', 1850.00, 'Normal', '2026-05-13 09:10:00', '2026-05-13 09:40:00', 'EN_REVISION', 'Pendiente', false, true, false),
(9004, 9004, 9003, 'Proyector prende pero no muestra imagen por HDMI.', 'Main board con falla en entrada HDMI; requiere tarjeta bajo pedido.', 5200.00, 'Alta', '2026-05-13 11:25:00', '2026-05-13 12:00:00', 'DIAGNOSTICADO', 'Pendiente', true, true, true),
(9005, 9005, NULL, 'Teclado escribe teclas repetidas y algunas no responden.', NULL, NULL, 'Normal', '2026-05-14 08:50:00', NULL, 'PENDIENTE', 'Pendiente', true, true, true),
(9006, 9006, 9004, 'No da senal HDMI y puerto se ve flojo.', 'Puerto HDMI danado y retimer con lectura inestable.', 2700.00, 'Urgente', '2026-05-14 10:15:00', '2026-05-14 10:40:00', 'DIAGNOSTICADO', 'Aprobado', true, true, true),
(9007, 9007, 9003, 'Impresora mancha hojas y marca error de temperatura.', 'Fusor con pelicula desgastada; requiere reemplazo.', 4100.00, 'Alta', '2026-05-15 09:30:00', '2026-05-15 10:00:00', 'COMPLETADO', 'Aprobado', false, true, true),
(9008, 9008, 9003, 'Monitor se apaga despues de unos minutos.', 'Power board inestable bajo carga termica.', 2550.00, 'Normal', '2026-05-15 12:10:00', '2026-05-15 12:30:00', 'DIAGNOSTICADO', 'Rechazado', false, true, true),
(9009, 9009, 9002, 'Bateria dura menos de una hora y se hincho la tapa.', 'Bateria degradada con abultamiento; no se recomienda uso hasta reemplazo.', 3400.00, 'Urgente', '2026-05-16 08:25:00', '2026-05-16 09:00:00', 'DIAGNOSTICADO', 'Aprobado', true, true, true),
(9010, 9010, 9003, 'Atasco frecuente en bandeja y arrastre doble.', 'Rodillos gastados; limpieza general pendiente.', 1350.00, 'Normal', '2026-05-16 11:00:00', '2026-05-16 11:30:00', 'COMPLETADO', 'Aprobado', false, true, true),
(9011, 9011, NULL, 'No carga con cargador original ni universal.', NULL, NULL, 'Alta', '2026-05-17 09:45:00', NULL, 'PENDIENTE', 'Pendiente', true, false, true),
(9012, 9012, 9004, 'Se apaga durante juegos y tiene olor a quemado.', 'VRM de GPU con corto; reparacion no viable por costo y riesgo.', 0.00, 'Urgente', '2026-05-17 13:20:00', '2026-05-17 13:50:00', 'COMPLETADO', 'Rechazado', true, false, true),
(9013, 9013, 9002, 'Pantalla quebrada y no responde tactil.', 'Modulo AMOLED quebrado; requiere pantalla completa.', 4600.00, 'Alta', '2026-05-18 10:05:00', '2026-05-18 10:30:00', 'DIAGNOSTICADO', 'Pendiente', false, true, false),
(9014, 9014, NULL, 'No da imagen y LED parpadea.', NULL, NULL, 'Normal', '2026-05-18 14:15:00', NULL, 'PENDIENTE', 'Pendiente', false, true, true);

INSERT INTO "Ordenes" (
  id_orden, diagnostico_id, tecnico_id, prioridad, estado, fecha_ingreso,
  resultado_final, enciende_salida, usa_corriente_ac_salida, observacion_final, fecha_cierre
) VALUES
(9001, 9001, 9001, 'Alta', 'EN_REPARACION', '2026-05-12 14:00:00', NULL, NULL, NULL, NULL, NULL),
(9002, 9002, 9001, 'Urgente', 'APROBADO', '2026-05-12 15:10:00', NULL, NULL, NULL, NULL, NULL),
(9003, 9004, NULL, 'Alta', 'ESPERANDO_PIEZA', '2026-05-13 15:20:00', NULL, NULL, NULL, 'Pendiente aprobacion de tarjeta main board bajo pedido.', NULL),
(9004, 9006, 9004, 'Urgente', 'EN_REPARACION', '2026-05-14 12:00:00', NULL, NULL, NULL, NULL, NULL),
(9005, 9007, 9003, 'Alta', 'FINALIZADO', '2026-05-15 11:00:00', 'REPARADO', true, true, 'Fusor reemplazado, limpieza interna y pruebas de 50 paginas correctas.', '2026-05-17 16:30:00'),
(9006, 9010, 9003, 'Normal', 'ENTREGADO', '2026-05-16 13:00:00', 'REPARADO', true, true, 'Equipo entregado con prueba de impresion y limpieza de bandeja.', '2026-05-18 10:20:00'),
(9007, 9012, 9004, 'Urgente', 'IRREPARABLE', '2026-05-17 15:00:00', 'IRREPARABLE', false, true, 'Corto en VRM de GPU; cliente no autoriza cambio de placa por costo.', '2026-05-18 09:00:00'),
(9008, 9009, 9002, 'Urgente', 'ESPERANDO_PIEZA', '2026-05-16 10:30:00', NULL, NULL, NULL, 'Bateria aprobada, pendiente llegada de lote adicional.', NULL),
(9009, 9013, NULL, 'Alta', 'PENDIENTE', '2026-05-18 12:00:00', NULL, NULL, NULL, NULL, NULL);

INSERT INTO "Ordenes_Repuestos" (
  id_detalle_repuesto, orden_id, repuesto_id, pieza_solicitada, cantidad_usada, estado_aprobacion
) VALUES
(9001, 9001, 9001, 'SSD NVMe 1TB para migracion', 1, 'APROBADO'),
(9002, 9001, 9002, 'RAM DDR4 16GB para ampliacion solicitada por cliente', 1, 'PENDIENTE'),
(9003, 9002, 9004, 'Fuente ATX 650W certificada', 1, 'APROBADO'),
(9004, 9003, 9008, 'Main board Epson PowerLite X49', 1, 'PENDIENTE'),
(9005, 9004, 9011, 'Puerto HDMI Xbox Series S', 1, 'APROBADO'),
(9006, 9004, 9012, 'Retimer HDMI Xbox Series S', 1, 'APROBADO'),
(9007, 9005, 9009, 'Fusor Brother HL-L6200DW', 1, 'APROBADO'),
(9008, 9006, 9010, 'Rodillo alimentacion Canon G3110', 1, 'APROBADO'),
(9009, 9007, NULL, 'Placa madre Acer Nitro 5 AN515 usada', 1, 'DENEGADO'),
(9010, 9008, 9017, 'Bateria Galaxy Tab S7 FE', 2, 'PENDIENTE'),
(9011, 9009, 9015, 'Pantalla Poco X5 Pro AMOLED', 1, 'PENDIENTE'),
(9012, 9003, NULL, 'Cable flex HDMI alternativo para proyector', 1, 'DENEGADO');

-- El trigger de facturas crea garantias automaticamente; reserva IDs demo para esas filas.
SELECT setval(
  pg_get_serial_sequence('"Garantias"', 'id_garantia'),
  GREATEST(
    COALESCE((SELECT max(id_garantia) FROM "Garantias" WHERE id_garantia NOT BETWEEN 9000 AND 9999), 0),
    9000
  )
);

INSERT INTO "Facturas" (
  id_factura, orden_id, fecha_emision, monto_repuestos, mano_obra,
  subtotal, impuestos, total, metodo_pago
) VALUES
(9001, 9005, '2026-05-17 17:00:00', 974.00, 1200.00, 2174.00, 326.10, 2500.10, 'Transferencia'),
(9002, 9006, '2026-05-18 10:30:00', 400.00, 850.00, 1250.00, 187.50, 1437.50, 'Efectivo'),
(9003, 9007, '2026-05-18 09:15:00', 0.00, 650.00, 650.00, 97.50, 747.50, 'Tarjeta');

INSERT INTO "Garantias" (
  factura_id, condiciones, duracion_meses, fecha_inicio, fecha_vencimiento
) VALUES
(9001, 'Garantia sobre fusor instalado y limpieza interna. No cubre toner de baja calidad ni humedad.', 3, '2026-05-17 17:00:00', '2026-08-17 17:00:00'),
(9002, 'Garantia sobre rodillos y ajuste de bandeja. No cubre papel humedo o fuera de especificacion.', 2, '2026-05-18 10:30:00', '2026-07-18 10:30:00'),
(9003, 'Servicio de diagnostico sin garantia de reparacion por equipo declarado irreparable.', 1, '2026-05-18 09:15:00', '2026-06-18 09:15:00')
ON CONFLICT (factura_id) DO UPDATE
SET condiciones = EXCLUDED.condiciones,
    duracion_meses = EXCLUDED.duracion_meses,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_vencimiento = EXCLUDED.fecha_vencimiento;

-- Deja stock_actual consistente incluso si los triggers aun no estaban cargados.
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
