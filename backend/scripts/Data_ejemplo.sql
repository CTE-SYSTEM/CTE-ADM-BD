-- Datos operativos realistas para desarrollo.
-- No crea ni modifica usuarios o tecnicos.

DO $$
DECLARE
  v_cliente_maria INT;
  v_cliente_carlos INT;
  v_cliente_pulperia INT;
  v_cliente_universidad INT;
  v_cliente_rosa INT;
  v_cliente_jose INT;
  v_cliente_clinica INT;
  v_cliente_luis INT;

  v_hp_probook INT;
  v_dell_inspiron INT;
  v_epson_l3150 INT;
  v_lenovo_thinkpad INT;
  v_galaxy_a32 INT;
  v_ps4 INT;
  v_iphone_11 INT;
  v_dell_optiplex INT;

  v_prov_tecnopartes INT;
  v_prov_zona_digital INT;
  v_prov_compuserv INT;
  v_prov_impresoras INT;

  v_cat_almacenamiento INT;
  v_cat_pantallas INT;
  v_cat_cargadores INT;
  v_cat_teclados INT;
  v_cat_impresoras INT;
  v_cat_moviles INT;
  v_cat_consolas INT;

  v_ssd_480 INT;
  v_pantalla_156 INT;
  v_cargador_hp INT;
  v_teclado_hp INT;
  v_bateria_dell INT;
  v_tinta_epson INT;
  v_puerto_hdmi_ps4 INT;
  v_bateria_iphone INT;

  v_diag_pendiente INT;
  v_diag_revision INT;
  v_diag_listo_ssd INT;
  v_diag_listo_impresora INT;
  v_diag_orden_pendiente INT;
  v_diag_reparacion INT;
  v_diag_pieza INT;
  v_diag_finalizado INT;
  v_diag_irreparable INT;

  v_orden_pendiente INT;
  v_orden_reparacion INT;
  v_orden_pieza INT;
  v_orden_finalizada INT;
  v_orden_irreparable INT;
  v_factura INT;
BEGIN
  INSERT INTO "Clientes" (nombre, telefono, direccion, correo, contacto_secundario, activo)
  VALUES
    ('Maria Fernanda Rivas', '50588812010', 'Villa Fontana, Managua', 'maria.rivas@example.com', 'WhatsApp 50586662010', true),
    ('Carlos Mejia Lopez', '50577804512', 'Reparto San Juan, Managua', 'carlos.mejia@example.com', '50522501234', true),
    ('Pulperia La Bendicion', '50582223344', 'Barrio Monimbo, Masaya', 'labendicion@example.com', 'Dona Marta', true),
    ('Universidad Central - Laboratorio 3', '50522789910', 'Carretera a Masaya km 8, Managua', 'soporte.lab3@example.com', 'Ing. Pamela', true),
    ('Rosa Elena Gutierrez', '50589991425', 'Residencial Las Mercedes, Leon', 'rosa.gutierrez@example.com', '50558581425', true),
    ('Jose Antonio Salinas', '50576543210', 'Ciudad Sandino, zona 6', 'jose.salinas@example.com', '50586543210', true),
    ('Clinica San Rafael', '50522984567', 'Altamira, Managua', 'clinica.sanrafael@example.com', 'Recepcion principal', true),
    ('Luis Alberto Chavarria', '50581234567', 'Diriamba, Carazo', 'luis.chavarria@example.com', '50557234567', true)
  ON CONFLICT (telefono) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    direccion = EXCLUDED.direccion,
    correo = EXCLUDED.correo,
    contacto_secundario = EXCLUDED.contacto_secundario,
    activo = true;

  SELECT id_cliente INTO v_cliente_maria FROM "Clientes" WHERE telefono = '50588812010';
  SELECT id_cliente INTO v_cliente_carlos FROM "Clientes" WHERE telefono = '50577804512';
  SELECT id_cliente INTO v_cliente_pulperia FROM "Clientes" WHERE telefono = '50582223344';
  SELECT id_cliente INTO v_cliente_universidad FROM "Clientes" WHERE telefono = '50522789910';
  SELECT id_cliente INTO v_cliente_rosa FROM "Clientes" WHERE telefono = '50589991425';
  SELECT id_cliente INTO v_cliente_jose FROM "Clientes" WHERE telefono = '50576543210';
  SELECT id_cliente INTO v_cliente_clinica FROM "Clientes" WHERE telefono = '50522984567';
  SELECT id_cliente INTO v_cliente_luis FROM "Clientes" WHERE telefono = '50581234567';

  INSERT INTO "Equipos" (cliente_id, marca, tipo, modelo, numero_serie)
  SELECT v_cliente_maria, 'HP', 'Laptop', 'ProBook 450 G8', 'HP-PB450G8-MGA-001'
  WHERE NOT EXISTS (SELECT 1 FROM "Equipos" WHERE numero_serie = 'HP-PB450G8-MGA-001');
  INSERT INTO "Equipos" (cliente_id, marca, tipo, modelo, numero_serie)
  SELECT v_cliente_carlos, 'Dell', 'Laptop', 'Inspiron 15 3511', 'DLL-IN3511-CML-002'
  WHERE NOT EXISTS (SELECT 1 FROM "Equipos" WHERE numero_serie = 'DLL-IN3511-CML-002');
  INSERT INTO "Equipos" (cliente_id, marca, tipo, modelo, numero_serie)
  SELECT v_cliente_pulperia, 'Epson', 'Impresora multifuncional', 'EcoTank L3150', 'EPS-L3150-PLB-003'
  WHERE NOT EXISTS (SELECT 1 FROM "Equipos" WHERE numero_serie = 'EPS-L3150-PLB-003');
  INSERT INTO "Equipos" (cliente_id, marca, tipo, modelo, numero_serie)
  SELECT v_cliente_universidad, 'Lenovo', 'Laptop', 'ThinkPad E14 Gen 2', 'LNV-E14-UCL-004'
  WHERE NOT EXISTS (SELECT 1 FROM "Equipos" WHERE numero_serie = 'LNV-E14-UCL-004');
  INSERT INTO "Equipos" (cliente_id, marca, tipo, modelo, numero_serie)
  SELECT v_cliente_rosa, 'Samsung', 'Celular', 'Galaxy A32', 'SM-A325M-REG-005'
  WHERE NOT EXISTS (SELECT 1 FROM "Equipos" WHERE numero_serie = 'SM-A325M-REG-005');
  INSERT INTO "Equipos" (cliente_id, marca, tipo, modelo, numero_serie)
  SELECT v_cliente_jose, 'Sony', 'Consola', 'PlayStation 4 Slim', 'SNY-PS4SLIM-JAS-006'
  WHERE NOT EXISTS (SELECT 1 FROM "Equipos" WHERE numero_serie = 'SNY-PS4SLIM-JAS-006');
  INSERT INTO "Equipos" (cliente_id, marca, tipo, modelo, numero_serie)
  SELECT v_cliente_clinica, 'Apple', 'Celular', 'iPhone 11', 'APL-IP11-CSR-007'
  WHERE NOT EXISTS (SELECT 1 FROM "Equipos" WHERE numero_serie = 'APL-IP11-CSR-007');
  INSERT INTO "Equipos" (cliente_id, marca, tipo, modelo, numero_serie)
  SELECT v_cliente_luis, 'Dell', 'Computadora de escritorio', 'OptiPlex 3080 Micro', 'DLL-OP3080-LAC-008'
  WHERE NOT EXISTS (SELECT 1 FROM "Equipos" WHERE numero_serie = 'DLL-OP3080-LAC-008');

  SELECT id_equipo INTO v_hp_probook FROM "Equipos" WHERE numero_serie = 'HP-PB450G8-MGA-001';
  SELECT id_equipo INTO v_dell_inspiron FROM "Equipos" WHERE numero_serie = 'DLL-IN3511-CML-002';
  SELECT id_equipo INTO v_epson_l3150 FROM "Equipos" WHERE numero_serie = 'EPS-L3150-PLB-003';
  SELECT id_equipo INTO v_lenovo_thinkpad FROM "Equipos" WHERE numero_serie = 'LNV-E14-UCL-004';
  SELECT id_equipo INTO v_galaxy_a32 FROM "Equipos" WHERE numero_serie = 'SM-A325M-REG-005';
  SELECT id_equipo INTO v_ps4 FROM "Equipos" WHERE numero_serie = 'SNY-PS4SLIM-JAS-006';
  SELECT id_equipo INTO v_iphone_11 FROM "Equipos" WHERE numero_serie = 'APL-IP11-CSR-007';
  SELECT id_equipo INTO v_dell_optiplex FROM "Equipos" WHERE numero_serie = 'DLL-OP3080-LAC-008';

  INSERT INTO "Proveedores" (nombre, telefono, direccion, correo, web, notas, descontinuada)
  SELECT 'TecnoPartes Managua', '50522558801', 'Bolonia, Managua', 'ventas@tecnopartes.example.com', 'https://tecnopartes.example.com', 'Repuestos de laptops y desktops. Entrega el mismo dia en Managua.', false
  WHERE NOT EXISTS (SELECT 1 FROM "Proveedores" WHERE lower(nombre) = lower('TecnoPartes Managua'));
  INSERT INTO "Proveedores" (nombre, telefono, direccion, correo, web, notas, descontinuada)
  SELECT 'Zona Digital Nicaragua', '50522773390', 'Centro Comercial Managua', 'cotizaciones@zonadigital.example.com', 'https://zonadigital.example.com', 'Almacenamiento, memorias y cargadores.', false
  WHERE NOT EXISTS (SELECT 1 FROM "Proveedores" WHERE lower(nombre) = lower('Zona Digital Nicaragua'));
  INSERT INTO "Proveedores" (nombre, telefono, direccion, correo, web, notas, descontinuada)
  SELECT 'CompuServ Repuestos', '50522661130', 'Carretera Norte, Managua', 'compras@compuserv.example.com', NULL, 'Baterias, teclados y pantallas bajo pedido.', false
  WHERE NOT EXISTS (SELECT 1 FROM "Proveedores" WHERE lower(nombre) = lower('CompuServ Repuestos'));
  INSERT INTO "Proveedores" (nombre, telefono, direccion, correo, web, notas, descontinuada)
  SELECT 'PrintCenter Nicaragua', '50522224580', 'Mercado Oriental, modulo impresoras', 'printcenter@example.com', NULL, 'Tintas Epson, rodillos, almohadillas y mantenimiento de impresoras.', false
  WHERE NOT EXISTS (SELECT 1 FROM "Proveedores" WHERE lower(nombre) = lower('PrintCenter Nicaragua'));

  SELECT id_proveedor INTO v_prov_tecnopartes FROM "Proveedores" WHERE lower(nombre) = lower('TecnoPartes Managua') LIMIT 1;
  SELECT id_proveedor INTO v_prov_zona_digital FROM "Proveedores" WHERE lower(nombre) = lower('Zona Digital Nicaragua') LIMIT 1;
  SELECT id_proveedor INTO v_prov_compuserv FROM "Proveedores" WHERE lower(nombre) = lower('CompuServ Repuestos') LIMIT 1;
  SELECT id_proveedor INTO v_prov_impresoras FROM "Proveedores" WHERE lower(nombre) = lower('PrintCenter Nicaragua') LIMIT 1;

  v_cat_almacenamiento := upsert_categoria('Almacenamiento', 'Laptop/Desktop');
  v_cat_pantallas := upsert_categoria('Pantallas laptop', 'Laptop');
  v_cat_cargadores := upsert_categoria('Cargadores', 'Laptop');
  v_cat_teclados := upsert_categoria('Teclados laptop', 'Laptop');
  v_cat_impresoras := upsert_categoria('Impresoras', 'Impresora');
  v_cat_moviles := upsert_categoria('Repuestos celulares', 'Celular');
  v_cat_consolas := upsert_categoria('Consolas', 'Consola');

  INSERT INTO "Repuestos" (tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual, porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada)
  SELECT v_cat_almacenamiento, v_prov_zona_digital, 'SSD Kingston A400 480GB SATA', 'Unidad SSD 2.5 pulgadas para laptop o desktop', 1650.00, NULL, 450.00, 0, true, false
  WHERE NOT EXISTS (SELECT 1 FROM "Repuestos" WHERE lower(nombre) = lower('SSD Kingston A400 480GB SATA'));
  INSERT INTO "Repuestos" (tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual, porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada)
  SELECT v_cat_pantallas, v_prov_compuserv, 'Pantalla laptop 15.6 slim 30 pines FHD', 'Panel compatible con HP, Dell, Acer y Lenovo 15.6 FHD', 3250.00, NULL, 850.00, 0, true, false
  WHERE NOT EXISTS (SELECT 1 FROM "Repuestos" WHERE lower(nombre) = lower('Pantalla laptop 15.6 slim 30 pines FHD'));
  INSERT INTO "Repuestos" (tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual, porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada)
  SELECT v_cat_cargadores, v_prov_tecnopartes, 'Cargador HP 19.5V 3.33A punta azul', 'Adaptador original/compatible 65W para HP ProBook y Pavilion', 850.00, NULL, 300.00, 0, true, false
  WHERE NOT EXISTS (SELECT 1 FROM "Repuestos" WHERE lower(nombre) = lower('Cargador HP 19.5V 3.33A punta azul'));
  INSERT INTO "Repuestos" (tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual, porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada)
  SELECT v_cat_teclados, v_prov_compuserv, 'Teclado HP ProBook 450 G8 latino', 'Teclado interno distribucion latinoamericana', 980.00, NULL, 370.00, 0, true, false
  WHERE NOT EXISTS (SELECT 1 FROM "Repuestos" WHERE lower(nombre) = lower('Teclado HP ProBook 450 G8 latino'));
  INSERT INTO "Repuestos" (tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual, porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada)
  SELECT v_cat_cargadores, v_prov_compuserv, 'Bateria Dell Inspiron 15 3511', 'Bateria compatible Dell tipo WDX0R / 3 celdas', 2200.00, NULL, 650.00, 0, true, false
  WHERE NOT EXISTS (SELECT 1 FROM "Repuestos" WHERE lower(nombre) = lower('Bateria Dell Inspiron 15 3511'));
  INSERT INTO "Repuestos" (tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual, porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada)
  SELECT v_cat_impresoras, v_prov_impresoras, 'Kit tinta Epson 544 original CMYK', 'Botellas originales para EcoTank L3150/L3110/L3250', 1250.00, NULL, 350.00, 0, true, false
  WHERE NOT EXISTS (SELECT 1 FROM "Repuestos" WHERE lower(nombre) = lower('Kit tinta Epson 544 original CMYK'));
  INSERT INTO "Repuestos" (tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual, porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada)
  SELECT v_cat_consolas, v_prov_tecnopartes, 'Puerto HDMI PlayStation 4 Slim', 'Conector HDMI de reemplazo para PS4 Slim', 420.00, NULL, 280.00, 0, true, false
  WHERE NOT EXISTS (SELECT 1 FROM "Repuestos" WHERE lower(nombre) = lower('Puerto HDMI PlayStation 4 Slim'));
  INSERT INTO "Repuestos" (tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual, porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada)
  SELECT v_cat_moviles, v_prov_tecnopartes, 'Bateria iPhone 11 premium', 'Bateria de reemplazo alta capacidad para iPhone 11', 1450.00, NULL, 550.00, 0, true, false
  WHERE NOT EXISTS (SELECT 1 FROM "Repuestos" WHERE lower(nombre) = lower('Bateria iPhone 11 premium'));

  SELECT id_repuesto INTO v_ssd_480 FROM "Repuestos" WHERE lower(nombre) = lower('SSD Kingston A400 480GB SATA') LIMIT 1;
  SELECT id_repuesto INTO v_pantalla_156 FROM "Repuestos" WHERE lower(nombre) = lower('Pantalla laptop 15.6 slim 30 pines FHD') LIMIT 1;
  SELECT id_repuesto INTO v_cargador_hp FROM "Repuestos" WHERE lower(nombre) = lower('Cargador HP 19.5V 3.33A punta azul') LIMIT 1;
  SELECT id_repuesto INTO v_teclado_hp FROM "Repuestos" WHERE lower(nombre) = lower('Teclado HP ProBook 450 G8 latino') LIMIT 1;
  SELECT id_repuesto INTO v_bateria_dell FROM "Repuestos" WHERE lower(nombre) = lower('Bateria Dell Inspiron 15 3511') LIMIT 1;
  SELECT id_repuesto INTO v_tinta_epson FROM "Repuestos" WHERE lower(nombre) = lower('Kit tinta Epson 544 original CMYK') LIMIT 1;
  SELECT id_repuesto INTO v_puerto_hdmi_ps4 FROM "Repuestos" WHERE lower(nombre) = lower('Puerto HDMI PlayStation 4 Slim') LIMIT 1;
  SELECT id_repuesto INTO v_bateria_iphone FROM "Repuestos" WHERE lower(nombre) = lower('Bateria iPhone 11 premium') LIMIT 1;

  INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
  SELECT v_ssd_480, v_prov_zona_digital, 'ZD-2026-0501', '2026-05-03 09:30:00', 6, 1650.00, 'Transferencia'
  WHERE NOT EXISTS (SELECT 1 FROM "Compras" WHERE documento = 'ZD-2026-0501');
  INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
  SELECT v_pantalla_156, v_prov_compuserv, 'CS-2026-1178', '2026-05-04 11:10:00', 3, 3250.00, 'Efectivo'
  WHERE NOT EXISTS (SELECT 1 FROM "Compras" WHERE documento = 'CS-2026-1178');
  INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
  SELECT v_cargador_hp, v_prov_tecnopartes, 'TP-2026-0844', '2026-05-06 15:45:00', 5, 850.00, 'Tarjeta'
  WHERE NOT EXISTS (SELECT 1 FROM "Compras" WHERE documento = 'TP-2026-0844');
  INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
  SELECT v_teclado_hp, v_prov_compuserv, 'CS-2026-1185', '2026-05-07 10:20:00', 4, 980.00, 'Transferencia'
  WHERE NOT EXISTS (SELECT 1 FROM "Compras" WHERE documento = 'CS-2026-1185');
  INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
  SELECT v_bateria_dell, v_prov_compuserv, 'CS-2026-1192', '2026-05-09 14:05:00', 2, 2200.00, 'Efectivo'
  WHERE NOT EXISTS (SELECT 1 FROM "Compras" WHERE documento = 'CS-2026-1192');
  INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
  SELECT v_tinta_epson, v_prov_impresoras, 'PC-2026-0409', '2026-05-10 08:35:00', 4, 1250.00, 'Efectivo'
  WHERE NOT EXISTS (SELECT 1 FROM "Compras" WHERE documento = 'PC-2026-0409');
  INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
  SELECT v_puerto_hdmi_ps4, v_prov_tecnopartes, 'TP-2026-0862', '2026-05-12 16:25:00', 5, 420.00, 'Transferencia'
  WHERE NOT EXISTS (SELECT 1 FROM "Compras" WHERE documento = 'TP-2026-0862');
  INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
  SELECT v_bateria_iphone, v_prov_tecnopartes, 'TP-2026-0870', '2026-05-13 13:15:00', 3, 1450.00, 'Tarjeta'
  WHERE NOT EXISTS (SELECT 1 FROM "Compras" WHERE documento = 'TP-2026-0870');

  INSERT INTO "Diagnosticos" (
    equipo_id, tecnico_id, falla_reportada, diagnostico_real, presupuesto_estimado, prioridad,
    fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
    deja_cargador, enciende, usa_corriente_ac
  )
  SELECT v_lenovo_thinkpad, NULL, 'No enciende despues de descarga electrica. Cliente deja cargador original.', NULL, NULL, 'Urgente',
    '2026-05-17 08:20:00', NULL, 'PENDIENTE', 'Pendiente', true, false, true
  WHERE NOT EXISTS (SELECT 1 FROM "Diagnosticos" WHERE equipo_id = v_lenovo_thinkpad AND falla_reportada LIKE 'No enciende despues de descarga electrica%');

  INSERT INTO "Diagnosticos" (
    equipo_id, tecnico_id, falla_reportada, diagnostico_real, presupuesto_estimado, prioridad,
    fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
    deja_cargador, enciende, usa_corriente_ac
  )
  SELECT v_galaxy_a32, 5, 'Pantalla queda negra aunque recibe llamadas. Golpe en esquina inferior.', NULL, NULL, 'Alta',
    '2026-05-17 10:45:00', '2026-05-17 11:05:00', 'EN_REVISION', 'Pendiente', false, true, false
  WHERE NOT EXISTS (SELECT 1 FROM "Diagnosticos" WHERE equipo_id = v_galaxy_a32 AND falla_reportada LIKE 'Pantalla queda negra%');

  INSERT INTO "Diagnosticos" (
    equipo_id, tecnico_id, falla_reportada, diagnostico_real, presupuesto_estimado, prioridad,
    fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
    deja_cargador, enciende, usa_corriente_ac
  )
  SELECT v_dell_optiplex, 1, 'Equipo muy lento, tarda mas de 10 minutos en iniciar Windows.', 'Disco mecanico con sectores reasignados. Se recomienda SSD 480GB e instalacion limpia.', 3350.00, 'Normal',
    '2026-05-14 09:00:00', '2026-05-14 09:20:00', 'COMPLETADO', 'Aprobado', false, true, true
  WHERE NOT EXISTS (SELECT 1 FROM "Diagnosticos" WHERE equipo_id = v_dell_optiplex AND falla_reportada LIKE 'Equipo muy lento%');

  INSERT INTO "Diagnosticos" (
    equipo_id, tecnico_id, falla_reportada, diagnostico_real, presupuesto_estimado, prioridad,
    fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
    deja_cargador, enciende, usa_corriente_ac
  )
  SELECT v_epson_l3150, 5, 'Imprime con rayas y colores incompletos. Se usa a diario en la pulperia.', 'Cabezal parcialmente obstruido y almohadilla cerca del limite. Requiere limpieza profunda y tinta original.', 1850.00, 'Normal',
    '2026-05-15 13:30:00', '2026-05-15 14:00:00', 'DIAGNOSTICADO', 'Aprobado', false, true, true
  WHERE NOT EXISTS (SELECT 1 FROM "Diagnosticos" WHERE equipo_id = v_epson_l3150 AND falla_reportada LIKE 'Imprime con rayas%');

  INSERT INTO "Diagnosticos" (
    equipo_id, tecnico_id, falla_reportada, diagnostico_real, presupuesto_estimado, prioridad,
    fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
    deja_cargador, enciende, usa_corriente_ac
  )
  SELECT v_hp_probook, 3, 'Teclas A, S y D no responden y bateria dura menos de una hora.', 'Teclado interno con membrana danada. Bateria aun utilizable, se recomienda reemplazo de teclado primero.', 1950.00, 'Alta',
    '2026-05-11 08:50:00', '2026-05-11 09:10:00', 'COMPLETADO', 'Aprobado', true, true, true
  WHERE NOT EXISTS (SELECT 1 FROM "Diagnosticos" WHERE equipo_id = v_hp_probook AND falla_reportada LIKE 'Teclas A, S y D%');

  INSERT INTO "Diagnosticos" (
    equipo_id, tecnico_id, falla_reportada, diagnostico_real, presupuesto_estimado, prioridad,
    fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
    deja_cargador, enciende, usa_corriente_ac
  )
  SELECT v_dell_inspiron, 3, 'Se apaga al desconectar el cargador y la bateria marca 0%.', 'Bateria agotada. Cargador y placa de carga funcionan correctamente.', 3600.00, 'Normal',
    '2026-05-12 10:10:00', '2026-05-12 10:30:00', 'COMPLETADO', 'Aprobado', true, true, true
  WHERE NOT EXISTS (SELECT 1 FROM "Diagnosticos" WHERE equipo_id = v_dell_inspiron AND falla_reportada LIKE 'Se apaga al desconectar%');

  INSERT INTO "Diagnosticos" (
    equipo_id, tecnico_id, falla_reportada, diagnostico_real, presupuesto_estimado, prioridad,
    fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
    deja_cargador, enciende, usa_corriente_ac
  )
  SELECT v_ps4, 4, 'No da video en televisor. Puerto HDMI flojo.', 'Puerto HDMI fracturado; se requiere reemplazo y resoldado en placa.', 2100.00, 'Alta',
    '2026-05-13 15:40:00', '2026-05-13 16:00:00', 'COMPLETADO', 'Aprobado', false, true, true
  WHERE NOT EXISTS (SELECT 1 FROM "Diagnosticos" WHERE equipo_id = v_ps4 AND falla_reportada LIKE 'No da video en televisor%');

  INSERT INTO "Diagnosticos" (
    equipo_id, tecnico_id, falla_reportada, diagnostico_real, presupuesto_estimado, prioridad,
    fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
    deja_cargador, enciende, usa_corriente_ac
  )
  SELECT v_iphone_11, 5, 'Bateria se descarga antes del mediodia y salud marca servicio.', 'Bateria degradada. Se recomienda reemplazo y prueba de consumo.', 2800.00, 'Normal',
    '2026-05-10 11:25:00', '2026-05-10 11:50:00', 'COMPLETADO', 'Aprobado', false, true, false
  WHERE NOT EXISTS (SELECT 1 FROM "Diagnosticos" WHERE equipo_id = v_iphone_11 AND falla_reportada LIKE 'Bateria se descarga%');

  INSERT INTO "Diagnosticos" (
    equipo_id, tecnico_id, falla_reportada, diagnostico_real, presupuesto_estimado, prioridad,
    fecha_hora, fecha_asignacion, estado_del_diagnostico, "Estado_aprobacion",
    deja_cargador, enciende, usa_corriente_ac
  )
  SELECT v_lenovo_thinkpad, 1, 'Pantalla no muestra imagen despues de caida. Cliente solicita revision completa.', 'Tarjeta madre presenta corto en linea principal. Reparacion no recomendable por costo.', 650.00, 'Normal',
    '2026-05-09 09:15:00', '2026-05-09 09:35:00', 'COMPLETADO', 'Rechazado', true, false, true
  WHERE NOT EXISTS (SELECT 1 FROM "Diagnosticos" WHERE equipo_id = v_lenovo_thinkpad AND falla_reportada LIKE 'Pantalla no muestra imagen%');

  SELECT id_diagnostico INTO v_diag_pendiente FROM "Diagnosticos" WHERE equipo_id = v_lenovo_thinkpad AND falla_reportada LIKE 'No enciende despues de descarga electrica%' LIMIT 1;
  SELECT id_diagnostico INTO v_diag_revision FROM "Diagnosticos" WHERE equipo_id = v_galaxy_a32 AND falla_reportada LIKE 'Pantalla queda negra%' LIMIT 1;
  SELECT id_diagnostico INTO v_diag_listo_ssd FROM "Diagnosticos" WHERE equipo_id = v_dell_optiplex AND falla_reportada LIKE 'Equipo muy lento%' LIMIT 1;
  SELECT id_diagnostico INTO v_diag_listo_impresora FROM "Diagnosticos" WHERE equipo_id = v_epson_l3150 AND falla_reportada LIKE 'Imprime con rayas%' LIMIT 1;
  SELECT id_diagnostico INTO v_diag_orden_pendiente FROM "Diagnosticos" WHERE equipo_id = v_hp_probook AND falla_reportada LIKE 'Teclas A, S y D%' LIMIT 1;
  SELECT id_diagnostico INTO v_diag_reparacion FROM "Diagnosticos" WHERE equipo_id = v_dell_inspiron AND falla_reportada LIKE 'Se apaga al desconectar%' LIMIT 1;
  SELECT id_diagnostico INTO v_diag_pieza FROM "Diagnosticos" WHERE equipo_id = v_ps4 AND falla_reportada LIKE 'No da video en televisor%' LIMIT 1;
  SELECT id_diagnostico INTO v_diag_finalizado FROM "Diagnosticos" WHERE equipo_id = v_iphone_11 AND falla_reportada LIKE 'Bateria se descarga%' LIMIT 1;
  SELECT id_diagnostico INTO v_diag_irreparable FROM "Diagnosticos" WHERE equipo_id = v_lenovo_thinkpad AND falla_reportada LIKE 'Pantalla no muestra imagen%' LIMIT 1;

  INSERT INTO "Ordenes" (diagnostico_id, tecnico_id, prioridad, estado, fecha_ingreso)
  SELECT v_diag_orden_pendiente, NULL, 'Alta', 'PENDIENTE', '2026-05-11 10:10:00'
  WHERE NOT EXISTS (SELECT 1 FROM "Ordenes" WHERE diagnostico_id = v_diag_orden_pendiente);
  INSERT INTO "Ordenes" (diagnostico_id, tecnico_id, prioridad, estado, fecha_ingreso)
  SELECT v_diag_reparacion, 3, 'Normal', 'EN_REPARACION', '2026-05-12 11:00:00'
  WHERE NOT EXISTS (SELECT 1 FROM "Ordenes" WHERE diagnostico_id = v_diag_reparacion);
  INSERT INTO "Ordenes" (diagnostico_id, tecnico_id, prioridad, estado, fecha_ingreso)
  SELECT v_diag_pieza, 4, 'Alta', 'ESPERANDO_PIEZA', '2026-05-13 16:25:00'
  WHERE NOT EXISTS (SELECT 1 FROM "Ordenes" WHERE diagnostico_id = v_diag_pieza);
  INSERT INTO "Ordenes" (diagnostico_id, tecnico_id, prioridad, estado, fecha_ingreso, resultado_final, enciende_salida, usa_corriente_ac_salida, observacion_final, fecha_cierre)
  SELECT v_diag_finalizado, 5, 'Normal', 'FINALIZADO', '2026-05-10 12:20:00', 'REPARADO', true, false, 'Bateria reemplazada, consumo dentro de rango y carga al 100%.', '2026-05-10 17:40:00'
  WHERE NOT EXISTS (SELECT 1 FROM "Ordenes" WHERE diagnostico_id = v_diag_finalizado);
  INSERT INTO "Ordenes" (diagnostico_id, tecnico_id, prioridad, estado, fecha_ingreso, resultado_final, enciende_salida, usa_corriente_ac_salida, observacion_final, fecha_cierre)
  SELECT v_diag_irreparable, 1, 'Normal', 'IRREPARABLE', '2026-05-09 10:00:00', 'IRREPARABLE', false, true, 'Se informa al cliente que la reparacion supera el valor comercial del equipo.', '2026-05-09 15:30:00'
  WHERE NOT EXISTS (SELECT 1 FROM "Ordenes" WHERE diagnostico_id = v_diag_irreparable);

  SELECT id_orden INTO v_orden_pendiente FROM "Ordenes" WHERE diagnostico_id = v_diag_orden_pendiente LIMIT 1;
  SELECT id_orden INTO v_orden_reparacion FROM "Ordenes" WHERE diagnostico_id = v_diag_reparacion LIMIT 1;
  SELECT id_orden INTO v_orden_pieza FROM "Ordenes" WHERE diagnostico_id = v_diag_pieza LIMIT 1;
  SELECT id_orden INTO v_orden_finalizada FROM "Ordenes" WHERE diagnostico_id = v_diag_finalizado LIMIT 1;
  SELECT id_orden INTO v_orden_irreparable FROM "Ordenes" WHERE diagnostico_id = v_diag_irreparable LIMIT 1;

  INSERT INTO "Ordenes_Repuestos" (orden_id, repuesto_id, pieza_solicitada, cantidad_usada, estado_aprobacion)
  SELECT v_orden_pendiente, v_teclado_hp, 'Teclado HP ProBook 450 G8 latino', 1, 'PENDIENTE'
  WHERE NOT EXISTS (SELECT 1 FROM "Ordenes_Repuestos" WHERE orden_id = v_orden_pendiente AND repuesto_id = v_teclado_hp);
  INSERT INTO "Ordenes_Repuestos" (orden_id, repuesto_id, pieza_solicitada, cantidad_usada, estado_aprobacion)
  SELECT v_orden_reparacion, v_bateria_dell, 'Bateria Dell Inspiron 15 3511', 1, 'APROBADO'
  WHERE NOT EXISTS (SELECT 1 FROM "Ordenes_Repuestos" WHERE orden_id = v_orden_reparacion AND repuesto_id = v_bateria_dell);
  INSERT INTO "Ordenes_Repuestos" (orden_id, repuesto_id, pieza_solicitada, cantidad_usada, estado_aprobacion)
  SELECT v_orden_pieza, v_puerto_hdmi_ps4, 'Puerto HDMI PlayStation 4 Slim', 1, 'PENDIENTE'
  WHERE NOT EXISTS (SELECT 1 FROM "Ordenes_Repuestos" WHERE orden_id = v_orden_pieza AND repuesto_id = v_puerto_hdmi_ps4);
  INSERT INTO "Ordenes_Repuestos" (orden_id, repuesto_id, pieza_solicitada, cantidad_usada, estado_aprobacion)
  SELECT v_orden_finalizada, v_bateria_iphone, 'Bateria iPhone 11 premium', 1, 'APROBADO'
  WHERE NOT EXISTS (SELECT 1 FROM "Ordenes_Repuestos" WHERE orden_id = v_orden_finalizada AND repuesto_id = v_bateria_iphone);

  INSERT INTO "Facturas" (orden_id, fecha_emision, monto_repuestos, mano_obra, subtotal, impuestos, total, metodo_pago)
  SELECT v_orden_irreparable, '2026-05-09 16:00:00', 0.00, 650.00, 650.00, 0.00, 650.00, 'Efectivo'
  WHERE NOT EXISTS (SELECT 1 FROM "Facturas" WHERE orden_id = v_orden_irreparable);

  SELECT id_factura INTO v_factura FROM "Facturas" WHERE orden_id = v_orden_irreparable LIMIT 1;

  INSERT INTO "Garantias" (factura_id, condiciones, duracion_meses, fecha_inicio, fecha_vencimiento)
  SELECT v_factura, 'Garantia limitada sobre diagnostico realizado. No cubre ingreso de liquidos ni golpes posteriores.', 1, '2026-05-09', '2026-06-09'
  WHERE v_factura IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "Garantias" WHERE factura_id = v_factura);

  PERFORM recalcular_stock_repuestos();
END $$;

SELECT 'Datos operativos realistas cargados correctamente' AS resultado;
