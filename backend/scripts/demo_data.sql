-- backend/scripts/demo_data.sql
-- Datos de prueba realistas para validar el flujo actual:
-- Secretaria: clientes, equipos, diagnosticos, proveedores, categorias, repuestos y compras.
-- Jefe tecnico: diagnosticos pendientes/asignados y ordenes listas para asignar.
-- Rango reservado para demo: IDs 9000-9999.

BEGIN;

ALTER TABLE "Diagnosticos"
ADD COLUMN IF NOT EXISTS presupuesto_estimado DECIMAL(18, 2);

-- Limpiar solo datos demo. No toca datos reales fuera del rango 9000-9999.
DELETE FROM "Garantias" WHERE id_garantia BETWEEN 9000 AND 9999;
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
(9001, 'tecnico_demo_marcos', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'marcos.demo@cte.com', 'Tecnico', true, '2026-05-01 08:00:00'),
(9002, 'tecnico_demo_elena', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'elena.demo@cte.com', 'Tecnico', true, '2026-05-01 08:00:00'),
(9003, 'tecnico_demo_roberto', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'roberto.demo@cte.com', 'Tecnico', true, '2026-05-01 08:00:00'),
(9004, 'tecnico_demo_juan', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'juan.demo@cte.com', 'Tecnico', true, '2026-05-01 08:00:00');

INSERT INTO "Tecnicos" (id_tecnico, usuario_id, nombre, especialidad, horario, contacto, activo) VALUES
(9001, 9001, 'Marcos Galindo', 'Microelectronica y soldadura SMD', 'L-V 08:00-17:00', '+505 8888-1101', true),
(9002, 9002, 'Elena Rodriguez', 'Laptops y ultrabooks', 'L-V 09:00-18:00', '+505 8888-1102', true),
(9003, 9003, 'Roberto Sosa', 'Consolas, monitores y perifericos', 'L-S 08:00-14:00', '+505 8888-1103', true),
(9004, 9004, 'Juan Perez', 'Celulares y tablets', 'L-V 08:00-17:00', '+505 8888-1104', true);

INSERT INTO "Clientes" (id_cliente, nombre, telefono, direccion, correo, contacto_secundario, activo) VALUES
(9001, 'Carlos Mendoza', '+505 8123-4501', 'Reparto San Juan, Managua', 'carlos.mendoza@mail.com', '+505 8788-1201', true),
(9002, 'Maria Fernanda Lopez', '+505 8123-4502', 'Villa Fontana, Managua', 'maria.lopez@mail.com', NULL, true),
(9003, 'Tecnologia Rivera S.A.', '+505 8123-4503', 'Carretera a Masaya km 8.5', 'soporte@rivera.com.ni', '+505 2255-1030', true),
(9004, 'Jorge Salinas', '+505 8123-4504', 'Residencial Las Colinas', 'jorge.salinas@mail.com', NULL, true),
(9005, 'Clinica Santa Elena', '+505 8123-4505', 'Bolonia, Managua', 'admin@santaelena.com.ni', '+505 2222-8820', true),
(9006, 'Ana Patricia Cruz', '+505 8123-4506', 'Ciudad Sandino zona 6', 'ana.cruz@mail.com', NULL, true),
(9007, 'Hotel Camino Norte', '+505 8123-4507', 'Carretera Norte km 6', 'recepcion@caminonorte.com', '+505 2244-4400', true),
(9008, 'Luis Alberto Mairena', '+505 8123-4508', 'Altamira, Managua', 'luis.mairena@mail.com', NULL, true),
(9009, 'Universidad San Gabriel', '+505 8123-4509', 'Los Robles, Managua', 'it@sangabriel.edu.ni', '+505 2277-7711', true),
(9010, 'Karla Gutierrez', '+505 8123-4510', 'Masaya centro', 'karla.gutierrez@mail.com', NULL, true),
(9011, 'Distribuidora El Punto', '+505 8123-4511', 'Mercado Oriental modulo B-12', 'compras@elpunto.com', '+505 8766-5011', true),
(9012, 'Oscar Molina', '+505 8123-4512', 'Tipitapa, barrio San Jose', 'oscar.molina@mail.com', NULL, true);

INSERT INTO "Equipos" (id_equipo, cliente_id, tipo, marca, modelo, numero_serie) VALUES
(9001, 9001, 'Laptop', 'HP', 'Victus 15-fa1093dx', '5CD3428LQ1'),
(9002, 9001, 'Celular', 'Samsung', 'Galaxy A54', 'R58W42K9L2P'),
(9003, 9002, 'Laptop', 'Lenovo', 'IdeaPad 3 15ALC6', 'PF3K91XA'),
(9004, 9003, 'Pc Escritorio', 'Dell', 'OptiPlex 7090', 'DL-7090-0217'),
(9005, 9003, 'Monitor', 'AOC', '24B2XH', 'AOC24-8831'),
(9006, 9004, 'Consola', 'Sony', 'PlayStation 5', 'S01-F3249902'),
(9007, 9005, 'Impresora', 'Epson', 'EcoTank L3250', 'X8R2039181'),
(9008, 9006, 'Tablet', 'Apple', 'iPad 9th Gen', 'GG7YQ4N0Q1'),
(9009, 9007, 'Laptop', 'Dell', 'Latitude 5420', 'LAT5420-77KQ'),
(9010, 9008, 'Celular', 'Xiaomi', 'Redmi Note 12', 'XM-RN12-8810'),
(9011, 9009, 'Laptop', 'Asus', 'TUF Gaming F15', 'AS-F15-5521'),
(9012, 9009, 'Proyector', 'BenQ', 'MS550', 'BQ-MS550-0902'),
(9013, 9010, 'Laptop', 'Acer', 'Aspire 5', 'NXA55-2091'),
(9014, 9011, 'Impresora', 'HP', 'LaserJet Pro M404dn', 'HP-M404-6682'),
(9015, 9012, 'Celular', 'Motorola', 'Moto G Power', 'MOT-GP-4410'),
(9016, 9012, 'Monitor', 'LG', 'UltraGear 27GN750', 'LG27-5019');

INSERT INTO "Categorias_Repuestos" (id_tipo_repuesto, nombre_tipo, electronico) VALUES
(9001, 'Pantallas', 'Laptop/Celular/Tablet'),
(9002, 'Alimentacion', 'Laptop/PC/Monitor'),
(9003, 'Almacenamiento', 'Laptop/PC'),
(9004, 'Memoria RAM', 'Laptop/PC'),
(9005, 'Teclados y flex', 'Laptop/Celular'),
(9006, 'Enfriamiento', 'Laptop/Consola/PC'),
(9007, 'Impresion', 'Impresora'),
(9008, 'Conectores', 'Celular/Tablet/Laptop'),
(9009, 'Tarjetas electronicas', 'Monitor/Consola/Impresora'),
(9010, 'Baterias', 'Laptop/Celular/Tablet');

INSERT INTO "Repuestos" (
  id_repuesto, tipo_repuesto_id, nombre, descripcion, costo_individual,
  porcentaje_de_ganacia, activo, descontinuada
) VALUES
(9001, 9001, 'Pantalla 15.6 IPS FHD 30 pines', 'Panel compatible para laptops HP, Dell y Lenovo', 68.00, 0.35, true, false),
(9002, 9001, 'Display Samsung A54 OLED', 'Modulo de pantalla completo con tactil', 92.50, 0.30, true, false),
(9003, 9002, 'Cargador laptop USB-C 65W', 'Adaptador universal PD con puntas USB-C', 24.00, 0.40, true, false),
(9004, 9002, 'Fuente ATX 500W 80 Plus', 'Fuente para PC de escritorio', 38.00, 0.32, true, false),
(9005, 9003, 'SSD NVMe 500GB Kingston', 'Unidad M.2 PCIe 3.0', 43.00, 0.28, true, false),
(9006, 9003, 'SSD SATA 480GB Crucial', 'Unidad 2.5 pulgadas', 39.00, 0.28, true, false),
(9007, 9004, 'RAM DDR4 8GB 3200 SODIMM', 'Memoria para laptop', 22.00, 0.35, true, false),
(9008, 9004, 'RAM DDR4 16GB 3200 DIMM', 'Memoria para PC de escritorio', 41.00, 0.30, true, false),
(9009, 9005, 'Teclado Lenovo IdeaPad 3', 'Teclado latinoamericano con flex', 26.00, 0.38, true, false),
(9010, 9005, 'Flex de carga Redmi Note 12', 'Sub board con conector USB-C y microfono', 13.50, 0.45, true, false),
(9011, 9006, 'Ventilador HP Victus 15', 'Fan izquierdo compatible serie 15-fa', 18.00, 0.40, true, false),
(9012, 9006, 'Kit pasta termica MX-4', 'Pasta termica para CPU/GPU', 7.00, 0.55, true, false),
(9013, 9007, 'Kit almohadillas Epson L3250', 'Almohadillas de absorcion de tinta', 9.50, 0.50, true, false),
(9014, 9007, 'Rodillo HP LaserJet M404', 'Pickup roller compatible', 11.00, 0.45, true, false),
(9015, 9008, 'Puerto HDMI PS5', 'Conector HDMI para consola PlayStation 5', 5.50, 0.70, true, false),
(9016, 9008, 'Jack DC Acer Aspire 5', 'Conector de carga con cable', 8.75, 0.55, true, false),
(9017, 9009, 'Main board monitor LG 27GN750', 'Tarjeta controladora usada certificada', 58.00, 0.28, true, false),
(9018, 9009, 'Power board AOC 24B2XH', 'Tarjeta de alimentacion para monitor AOC', 31.00, 0.35, true, false),
(9019, 9010, 'Bateria iPad 9th Gen', 'Bateria compatible alta capacidad', 36.00, 0.38, true, false),
(9020, 9010, 'Bateria Motorola G Power', 'Bateria compatible modelo XT', 18.50, 0.45, true, false);

INSERT INTO "Proveedores" (id_proveedor, nombre, telefono, direccion, correo, web, notas, descontinuada) VALUES
(9001, 'CompuPartes Nicaragua', '+505 2255-9001', 'Plaza Espana, Managua', 'ventas@compupartes.com.ni', 'https://compupartes.example', 'Buen stock de SSD, RAM y cargadores. Entrega el mismo dia.', false),
(9002, 'Movil Repuestos Mayoreo', '+505 2255-9002', 'Mercado Oriental, Managua', 'pedidos@movilrepuestos.example', NULL, 'Pantallas y flex para celulares. Revisar calidad antes de instalar.', false),
(9003, 'TecnoImport Centroamerica', '+505 2255-9003', 'Carretera a Masaya km 10', 'compras@tecnoimport.example', 'https://tecnoimport.example', 'Trae repuestos bajo pedido en 5 a 7 dias.', false),
(9004, 'Electronica Bolonia', '+505 2255-9004', 'Bolonia, Managua', 'contacto@electronicabolonia.example', NULL, 'Conectores, soldadura, flux y componentes SMD.', false),
(9005, 'Printer Service Parts', '+505 2255-9005', 'Los Robles, Managua', 'ventas@printerparts.example', NULL, 'Rodillos, almohadillas y kits de mantenimiento.', false),
(9006, 'GameFix Supply', '+505 2255-9006', 'Altamira, Managua', 'supply@gamefix.example', NULL, 'Especialistas en consolas y controles.', false),
(9007, 'Monitores y Boards SA', '+505 2255-9007', 'Ciudad Jardin, Managua', 'ventas@boards.example', NULL, 'Tarjetas de monitores usadas probadas.', false),
(9008, 'Energia Digital', '+505 2255-9008', 'Masaya', 'ventas@energiadigital.example', NULL, 'Fuentes, cargadores y baterias.', false);

INSERT INTO "Compras" (
  id_compra, repuesto_id, proveedor_id, documento, fecha_obtencion,
  cantidad, costo_unitario, metodo_pago
) VALUES
(9001, 9001, 9003, 'FAC-TI-2026-0142', '2026-04-22 09:30:00', 6, 68.00, 'Transferencia'),
(9002, 9002, 9002, 'REC-MOV-5581', '2026-04-23 11:15:00', 4, 92.50, 'Efectivo'),
(9003, 9003, 9008, 'FAC-ED-3320', '2026-04-24 14:20:00', 10, 24.00, 'Transferencia'),
(9004, 9005, 9001, 'FAC-CP-8820', '2026-04-25 10:05:00', 12, 43.00, 'Tarjeta'),
(9005, 9007, 9001, 'FAC-CP-8821', '2026-04-25 10:08:00', 10, 22.00, 'Tarjeta'),
(9006, 9010, 9002, 'REC-MOV-5594', '2026-04-26 15:40:00', 8, 13.50, 'Efectivo'),
(9007, 9011, 9003, 'FAC-TI-2026-0155', '2026-04-27 08:50:00', 3, 18.00, 'Transferencia'),
(9008, 9013, 9005, 'FAC-PSP-2120', '2026-04-28 13:10:00', 5, 9.50, 'Efectivo'),
(9009, 9015, 9006, 'FAC-GF-0710', '2026-04-29 16:25:00', 6, 5.50, 'Efectivo'),
(9010, 9018, 9007, 'FAC-MB-1245', '2026-04-30 09:00:00', 2, 31.00, 'Transferencia'),
(9011, 9019, 9008, 'FAC-ED-3342', '2026-05-01 10:30:00', 3, 36.00, 'Transferencia'),
(9012, 9020, 9008, 'FAC-ED-3343', '2026-05-01 10:35:00', 5, 18.50, 'Transferencia'),
(9013, 9014, 9005, 'FAC-PSP-2144', '2026-05-03 12:20:00', 4, 11.00, 'Efectivo'),
(9014, 9016, 9004, 'REC-EB-9022', '2026-05-04 15:10:00', 8, 8.75, 'Efectivo');

INSERT INTO "Diagnosticos" (
  id_diagnostico, equipo_id, tecnico_id, falla_reportada, diagnostico_real,
  presupuesto_estimado, fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
  deja_cargador, enciende, usa_corriente_ac
) VALUES
(9001, 9001, NULL, 'No da imagen despues de encender, ventiladores giran fuerte.', NULL, NULL, '2026-05-05 08:30:00', NULL, 'PENDIENTE', 'Pendiente', true, true, true),
(9002, 9002, NULL, 'Pantalla quebrada, tactil responde por zonas.', NULL, NULL, '2026-05-05 09:20:00', NULL, 'PENDIENTE', 'Pendiente', false, true, false),
(9003, 9003, 9002, 'Equipo muy lento y se congela al abrir navegador.', 'Disco mecanico con sectores reasignados; se recomienda SSD y limpieza de sistema.', 2450.00, '2026-05-04 10:15:00', '2026-05-04 11:00:00', 'DIAGNOSTICADO', 'Pendiente', true, true, true),
(9004, 9004, 9001, 'No enciende despues de apagon electrico.', 'Fuente ATX danada; placa madre sin corto aparente.', 1850.00, '2026-05-03 13:45:00', '2026-05-03 14:05:00', 'DIAGNOSTICADO', 'Aprobado', false, false, true),
(9005, 9005, 9003, 'Monitor prende y se apaga a los segundos.', 'Tarjeta de alimentacion con capacitores inflados.', 1600.00, '2026-05-02 16:30:00', '2026-05-02 17:00:00', 'EN_REVISION', 'Pendiente', false, true, true),
(9006, 9006, NULL, 'Puerto HDMI flojo; no hay senal en TV.', NULL, NULL, '2026-05-06 08:10:00', NULL, 'PENDIENTE', 'Pendiente', true, true, true),
(9007, 9007, 9004, 'Impresion con lineas y mensaje de almohadillas agotadas.', 'Contador de almohadillas al limite; requiere kit de mantenimiento y limpieza.', 1450.00, '2026-05-01 11:40:00', '2026-05-01 12:05:00', 'COMPLETADO', 'Aprobado', false, true, true),
(9008, 9008, 9004, 'Bateria se descarga en menos de una hora.', 'Bateria degradada al 58%; se recomienda reemplazo.', 3200.00, '2026-05-01 15:00:00', '2026-05-01 15:25:00', 'DIAGNOSTICADO', 'Pendiente', true, true, true),
(9009, 9009, 9002, 'No carga por USB-C, solo enciende con base docking.', 'Puerto USB-C con pines levantados; requiere reemplazo de jack/sub board.', 1950.00, '2026-04-30 09:35:00', '2026-04-30 10:00:00', 'EN_REVISION', 'Pendiente', true, true, true),
(9010, 9010, NULL, 'No reconoce cargador, se descarga aun conectado.', NULL, NULL, '2026-05-06 12:20:00', NULL, 'PENDIENTE', 'Pendiente', false, false, true),
(9011, 9011, 9002, 'Se apaga al entrar a juegos y sube mucho la temperatura.', 'Sistema de enfriamiento obstruido; requiere limpieza profunda y pasta termica.', 2300.00, '2026-04-29 10:20:00', '2026-04-29 11:10:00', 'COMPLETADO', 'Aprobado', true, true, true),
(9012, 9014, 9003, 'Atasco frecuente de papel en bandeja 1.', 'Rodillo de arrastre gastado; requiere reemplazo.', 980.00, '2026-05-02 08:15:00', '2026-05-02 09:00:00', 'DIAGNOSTICADO', 'Pendiente', false, true, true);

INSERT INTO "Ordenes" (
  id_orden, diagnostico_id, tecnico_id, prioridad, estado, fecha_ingreso
) VALUES
(9001, 9004, NULL, 'Urgente', 'PENDIENTE', '2026-05-03 15:00:00'),
(9002, 9007, 9004, 'Normal', 'FINALIZADO', '2026-05-01 13:00:00'),
(9003, 9011, 9002, 'Alta', 'FINALIZADO', '2026-04-29 12:00:00'),
(9004, 9003, NULL, 'Normal', 'PENDIENTE', '2026-05-04 12:00:00'),
(9005, 9008, NULL, 'Normal', 'PENDIENTE', '2026-05-01 16:10:00');

INSERT INTO "Ordenes_Repuestos" (
  id_detalle_repuesto, orden_id, repuesto_id, cantidad_usada, estado_aprobacion
) VALUES
(9001, 9001, 9004, 1, 'APROBADO'),
(9002, 9002, 9013, 1, 'APROBADO'),
(9003, 9003, 9012, 1, 'APROBADO'),
(9004, 9003, 9011, 1, 'APROBADO'),
(9005, 9004, 9005, 1, 'PENDIENTE'),
(9006, 9004, 9007, 1, 'PENDIENTE'),
(9007, 9005, 9019, 1, 'PENDIENTE'),
(9008, 9001, 9004, 1, 'PENDIENTE');

INSERT INTO "Facturas" (
  id_factura, orden_id, fecha_emision, monto_repuestos, mano_obra,
  subtotal, impuestos, total, metodo_pago
) VALUES
(9001, 9002, '2026-05-02 10:30:00', 14.25, 22.00, 36.25, 5.44, 41.69, 'Efectivo'),
(9002, 9003, '2026-05-01 17:45:00', 35.00, 45.00, 80.00, 12.00, 92.00, 'Transferencia');

INSERT INTO "Garantias" (
  id_garantia, factura_id, condiciones, duracion_meses, fecha_inicio, fecha_vencimiento
) VALUES
(9001, 9001, 'Garantia sobre mantenimiento y repuesto instalado. No cubre danos por derrame o golpe.', 2, '2026-05-02 10:30:00', '2026-07-02 10:30:00'),
(9002, 9002, 'Garantia de limpieza termica y ventilador instalado. No cubre manipulacion externa.', 3, '2026-05-01 17:45:00', '2026-08-01 17:45:00');

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
