-- Datos operativos adicionales para desarrollo.
-- No crea usuarios, tecnicos, diagnosticos, ordenes, facturas ni garantias.
-- Los repuestos fueron pensados para los tipos/modelos de equipos incluidos aqui.

DO $$
DECLARE
  rec RECORD;
  v_categoria_id INT;
  v_proveedor_id INT;
  v_repuesto_id INT;
BEGIN
  INSERT INTO "Clientes" (nombre, telefono, direccion, correo, contacto_secundario, activo)
  VALUES
    ('Andrea Paola Hernandez', '50588451209', 'Colonia Centroamerica, Managua', 'andrea.hernandez@example.com', '50576451209', true),
    ('Taller Contable Molina', '50522679031', 'Los Robles, Managua', 'administracion@molina.example.com', 'Lic. Ernesto Molina', true),
    ('Miguel Angel Duarte', '50575660118', 'Nindiri, Masaya', 'miguel.duarte@example.com', 'WhatsApp 50585660118', true),
    ('Farmacia Santa Lucia', '50523124590', 'Centro, Granada', 'compras@santalucia.example.com', 'Caja principal', true),
    ('Karen Vanessa Alvarado', '50587190433', 'Sutiaba, Leon', 'karen.alvarado@example.com', '50558190433', true),
    ('Escuela San Juan Bosco', '50522503477', 'Villa Libertad, Managua', 'direccion@sanjuanbosco.example.com', 'Profa. Mariela', true),
    ('Oficina Legal Montenegro', '50522701466', 'Altamira D Este, Managua', 'recepcion@montenegrolegal.example.com', 'Ext. 102', true),
    ('Walter Jose Morales', '50581299840', 'Jinotepe, Carazo', 'walter.morales@example.com', '50557299840', true),
    ('Distribuidora El Carmen', '50522912044', 'Mercado Mayoreo, Managua', 'operaciones@elcarmen.example.com', 'Bodega 3', true),
    ('Hotel Las Palmas', '50525523118', 'San Juan del Sur, Rivas', 'mantenimiento@laspalmas.example.com', 'Recepcion', true),
    ('Sandra Beatriz Oporta', '50587901235', 'Ciudad Jardin, Managua', 'sandra.oporta@example.com', '50557901235', true),
    ('Clinica Dental Sonrie', '50522784503', 'Villa Fontana, Managua', 'admin@sonrie.example.com', 'Dra. Cardenas', true),
    ('Instituto Ruben Dario', '50523104561', 'Centro historico, Leon', 'informatica@ird.example.com', 'Laboratorio A', true),
    ('Oscar Javier Pineda', '50576511890', 'Tipitapa, Managua', 'oscar.pineda@example.com', '50586511890', true),
    ('Agroservicios La Cosecha', '50523411098', 'Chinandega, salida a Corinto', 'soporte@lacosecha.example.com', 'Caja facturacion', true),
    ('Patricia del Socorro Ruiz', '50588114560', 'Carazo, Dolores', 'patricia.ruiz@example.com', 'WhatsApp 50558114560', true),
    ('Radio Stereo Azul', '50522250972', 'Bolonia, Managua', 'tecnica@stereoazul.example.com', 'Cabina 2', true),
    ('Mini Super San Miguel', '50524581276', 'Matagalpa, barrio Guanuca', 'minisuper.sanmiguel@example.com', 'Don Luis', true),
    ('Fundacion Aprende Mas', '50522739904', 'Bello Horizonte, Managua', 'equipos@aprendemas.example.com', 'Lic. Karla', true),
    ('Erick Manuel Tellez', '50581204577', 'Masatepe, Masaya', 'erick.tellez@example.com', '50557204577', true),
    ('Laboratorio Clinico Vida', '50522660419', 'Carretera Norte, Managua', 'recepcion@labvida.example.com', 'Turno manana', true),
    ('Marvin Antonio Corea', '50575678022', 'La Concepcion, Masaya', 'marvin.corea@example.com', '50585678022', true),
    ('Academia Pixel Creativo', '50522219035', 'Reparto San Juan, Managua', 'admin@pixelcreativo.example.com', 'Aula diseno', true),
    ('Comercial La Union', '50524418830', 'Esteli, avenida central', 'compras@launion.example.com', 'Caja 1', true),
    ('Diana Marcela Castillo', '50587894011', 'Granada, Xalteva', 'diana.castillo@example.com', '50557894011', true),
    ('Cooperativa Rutas del Norte', '50527130552', 'Terminal de buses, Esteli', 'sistemas@rutasnorte.example.com', 'Operaciones', true),
    ('Brenda Carolina Solis', '50588223091', 'Ticuantepe, Managua', 'brenda.solis@example.com', '50558223091', true),
    ('Centro Medico Esperanza', '50522567814', 'Masaya, barrio San Jeronimo', 'it@medesperanza.example.com', 'Admisiones', true),
    ('Rafael Enrique Blandon', '50581177429', 'Boaco, barrio San Miguel', 'rafael.blandon@example.com', '50557177429', true),
    ('Libreria El Estudiante', '50522276549', 'Mercado Roberto Huembes, Managua', 'ventas@elestudiante.example.com', 'Mostrador', true)
  ON CONFLICT (telefono) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    direccion = EXCLUDED.direccion,
    correo = EXCLUDED.correo,
    contacto_secundario = EXCLUDED.contacto_secundario,
    activo = true;

  INSERT INTO "Equipos" (cliente_id, marca, tipo, modelo, numero_serie)
  SELECT c.id_cliente, e.marca, e.tipo, e.modelo, e.numero_serie
  FROM (VALUES
    ('50588451209', 'Lenovo', 'Laptop', 'IdeaPad 3 15ITL6', 'LNV-IP3-AH-009'),
    ('50522679031', 'HP', 'Computadora de escritorio', 'ProDesk 400 G6 SFF', 'HP-PD400-TCM-010'),
    ('50575660118', 'Acer', 'Laptop', 'Aspire 5 A515-56', 'ACR-A515-MAD-011'),
    ('50523124590', 'Epson', 'Impresora multifuncional', 'EcoTank L3250', 'EPS-L3250-FSL-012'),
    ('50587190433', 'Samsung', 'Celular', 'Galaxy A52', 'SM-A525M-KVA-013'),
    ('50522503477', 'TP-Link', 'Router', 'Archer C6 AC1200', 'TPL-C6-ESJB-014'),
    ('50522701466', 'Dell', 'Laptop', 'Latitude 5420', 'DLL-L5420-OLM-015'),
    ('50581299840', 'Nintendo', 'Consola', 'Switch V2', 'NIN-SWV2-WJM-016'),
    ('50522912044', 'Lenovo', 'Computadora de escritorio', 'ThinkCentre M720s', 'LNV-M720S-DEC-017'),
    ('50525523118', 'Canon', 'Impresora multifuncional', 'PIXMA G3110', 'CAN-G3110-HLP-018'),
    ('50587901235', 'HP', 'Laptop', 'Pavilion 14-dv1003la', 'HP-PV14-SBO-019'),
    ('50522784503', 'Apple', 'Tablet', 'iPad 8th Gen 10.2', 'APL-IPD8-CDS-020'),
    ('50523104561', 'Dell', 'Laptop', 'Vostro 3400', 'DLL-V3400-IRD-021'),
    ('50576511890', 'Xiaomi', 'Celular', 'Redmi Note 10 Pro', 'XIA-RN10P-OJP-022'),
    ('50523411098', 'Epson', 'Impresora matricial', 'LX-350', 'EPS-LX350-ALC-023'),
    ('50588114560', 'Samsung', 'Tablet', 'Galaxy Tab A8', 'SM-X200-PSR-024'),
    ('50522250972', 'Asus', 'Laptop', 'VivoBook 15 X515EA', 'ASU-X515-RSA-025'),
    ('50524581276', 'HP', 'Impresora laser', 'LaserJet Pro M404dn', 'HP-M404-MSSM-026'),
    ('50522739904', 'Lenovo', 'Laptop', 'ThinkPad T480', 'LNV-T480-FAM-027'),
    ('50581204577', 'Sony', 'Consola', 'PlayStation 4 Pro', 'SNY-PS4PRO-EMT-028'),
    ('50522660419', 'Dell', 'Computadora de escritorio', 'OptiPlex 7050 SFF', 'DLL-OP7050-LCV-029'),
    ('50575678022', 'Motorola', 'Celular', 'Moto G Power 2022', 'MOT-GP22-MAC-030'),
    ('50522219035', 'Apple', 'Laptop', 'MacBook Air M1 2020', 'APL-MBA-M1-APC-031'),
    ('50524418830', 'Ubiquiti', 'Router', 'EdgeRouter X', 'UBQ-ERX-CLU-032'),
    ('50587894011', 'Samsung', 'Celular', 'Galaxy A32', 'SM-A325M-DMC-033'),
    ('50527130552', 'APC', 'UPS', 'Back-UPS 650VA', 'APC-BE650-CRN-034'),
    ('50588223091', 'Brother', 'Impresora laser', 'HL-L2320D', 'BRO-HLL2320-BCS-035'),
    ('50522567814', 'HP', 'Computadora de escritorio', 'EliteDesk 800 G4', 'HP-ED800-CME-036'),
    ('50581177429', 'Microsoft', 'Consola', 'Xbox One S', 'MS-XB1S-REB-037'),
    ('50522276549', 'Mercusys', 'Router', 'AC12G', 'MER-AC12G-LEE-038')
  ) AS e(telefono, marca, tipo, modelo, numero_serie)
  JOIN "Clientes" c ON c.telefono = e.telefono
  WHERE NOT EXISTS (SELECT 1 FROM "Equipos" eq WHERE eq.numero_serie = e.numero_serie);

  INSERT INTO "Proveedores" (nombre, telefono, direccion, correo, web, notas, descontinuada)
  SELECT p.nombre, p.telefono, p.direccion, p.correo, p.web, p.notas, false
  FROM (VALUES
    ('MicroChip Repuestos', '50522440176', 'Linda Vista, Managua', 'ventas@microchip.example.com', NULL, 'Memorias, almacenamiento NVMe y componentes para desktop.'),
    ('Soluciones Print y Redes', '50522287110', 'Carretera a Masaya km 5.5', 'pedidos@printredes.example.com', 'https://printredes.example.com', 'Insumos para impresoras, routers y accesorios de red.'),
    ('MovilPartes Centro', '50522504788', 'Plaza Inter, Managua', 'repuestos@movilpartes.example.com', NULL, 'Pantallas, baterias y flex para celulares de gama media.'),
    ('Laptop Parts Managua', '50522334415', 'Bolonia, Managua', 'ventas@laptopparts.example.com', NULL, 'Pantallas, teclados, bisagras y cargadores de laptop.'),
    ('TecnoMovil Express', '50522445516', 'Centro Comercial Managua', 'compras@tecnomovil.example.com', NULL, 'Repuestos Samsung, Xiaomi, Motorola y Apple.'),
    ('PrintCenter Pro', '50522556617', 'Mercado Oriental, modulo impresoras', 'printpro@example.com', NULL, 'Tintas, rodillos y unidades de mantenimiento.'),
    ('Consolas Nica Parts', '50522667718', 'Plaza Espana, Managua', 'ventas@consolasnica.example.com', NULL, 'Piezas para PlayStation, Xbox y Nintendo Switch.'),
    ('Redes y Energia', '50522778819', 'Carretera Norte, Managua', 'soporte@redesyenergia.example.com', NULL, 'Fuentes, UPS, adaptadores y equipo de red.'),
    ('Importadora Byte', '50522889920', 'Zona franca, Managua', 'cotiza@importbyte.example.com', 'https://importbyte.example.com', 'Pedidos semanales de SSD, RAM y fuentes certificadas.'),
    ('Apple Service Parts', '50522990021', 'Metrocentro, Managua', 'parts@appleservice.example.com', NULL, 'Piezas compatibles para MacBook, iPad y iPhone.'),
    ('Electronica Junior', '50522101122', 'Masaya, mercado municipal', 'ejunior@example.com', NULL, 'Componentes menores, conectores y soldadura.'),
    ('CompuStock Leon', '50523112223', 'Leon, salida a Chinandega', 'ventas@compustockleon.example.com', NULL, 'Repuestos de computadoras y laptops.'),
    ('Zona Gamer Repuestos', '50522223324', 'Galerias Santo Domingo', 'ventas@zonagamer.example.com', NULL, 'Ventiladores, puertos HDMI y controles.'),
    ('Printer Supply Nicaragua', '50522334425', 'Granada, centro', 'ventas@printersupply.example.com', NULL, 'Repuestos de impresoras Epson, HP, Canon y Brother.'),
    ('Energia Segura', '50522445526', 'Esteli, avenida central', 'ventas@energiasegura.example.com', NULL, 'Baterias UPS y protectores de voltaje.'),
    ('ServiRed Nicaragua', '50522556627', 'Matagalpa, Guanuca', 'pedidos@servired.example.com', NULL, 'Routers, fuentes, antenas y cables de red.'),
    ('Pantallas del Norte', '50522667728', 'Esteli, barrio El Rosario', 'ventas@pantallasnorte.example.com', NULL, 'Pantallas laptop y modulos moviles bajo pedido.'),
    ('Baterias y Celdas SA', '50522778829', 'Ciudad Sandino, Managua', 'info@bateriasceldas.example.com', NULL, 'Baterias para laptops, celulares, tablets y UPS.'),
    ('Mac y Tablet Parts', '50522889930', 'Altamira, Managua', 'ventas@mactablet.example.com', NULL, 'Flex, pantallas y cargadores para tablets y MacBook.'),
    ('Insumos Office Print', '50522990031', 'Los Robles, Managua', 'compras@officeprint.example.com', NULL, 'Rodillos, toners, bandejas y fusores.'),
    ('Repuestos Express Rivas', '50525660132', 'Rivas, centro', 'ventas@expressrivas.example.com', NULL, 'Pedidos de emergencia para zona sur.'),
    ('Digital Parts Chinandega', '50523451233', 'Chinandega, el calvario', 'ventas@digitalparts.example.com', NULL, 'Piezas de laptops, impresoras y celulares.'),
    ('Suministros TIC', '50522261434', 'Bello Horizonte, Managua', 'ventas@suministrostic.example.com', NULL, 'Accesorios de red y computo para instituciones.'),
    ('Hardware Central', '50522574335', 'Reparto San Juan, Managua', 'ventas@hardwarecentral.example.com', NULL, 'Fuentes, memorias, discos y gabinetes.'),
    ('MovilLab Repuestos', '50522683436', 'Leon, centro comercial', 'movillab@example.com', NULL, 'Repuestos para celulares Samsung, Xiaomi y Motorola.'),
    ('GameFix Distribucion', '50522792537', 'Masaya, carretera vieja', 'ventas@gamefix.example.com', NULL, 'Piezas para consolas y accesorios de mandos.'),
    ('LaserPrint Partes', '50522801638', 'Managua, Linda Vista', 'laserprint@example.com', NULL, 'Fusores, rodillos y toners de impresoras laser.'),
    ('NetPoint Nicaragua', '50522910739', 'Carretera a Masaya km 10', 'ventas@netpoint.example.com', NULL, 'Routers, switches, fuentes PoE y cableado.'),
    ('TabletCare Parts', '50523129840', 'Granada, calle Atravesada', 'ventas@tabletcare.example.com', NULL, 'Pantallas, baterias y puertos para tablets.'),
    ('Electronica El Condor', '50522238941', 'Mercado Oriental, Managua', 'condor@example.com', NULL, 'Conectores, puertos, flex y componentes de placa.')
  ) AS p(nombre, telefono, direccion, correo, web, notas)
  WHERE NOT EXISTS (SELECT 1 FROM "Proveedores" prov WHERE lower(prov.nombre) = lower(p.nombre));

  FOR rec IN
    SELECT *
    FROM (VALUES
      ('Memorias RAM', 'Laptop/Desktop', 'MicroChip Repuestos', 'Memoria DDR4 8GB 3200MHz SODIMM', 'Modulo para laptops Lenovo, Dell, HP y Acer compatibles con DDR4', 980.00, 320.00),
      ('Almacenamiento NVMe', 'Laptop/Desktop', 'MicroChip Repuestos', 'SSD NVMe Kingston NV2 500GB', 'Unidad M.2 2280 PCIe para laptops y desktops compatibles', 1850.00, 520.00),
      ('Fuentes de poder', 'Desktop', 'MicroChip Repuestos', 'Fuente EVGA 500W 80 Plus', 'Fuente ATX para equipos de escritorio de oficina y gaming basico', 1950.00, 600.00),
      ('Redes', 'Router', 'Soluciones Print y Redes', 'Adaptador corriente TP-Link 12V 1A', 'Fuente de alimentacion compatible con routers TP-Link Archer y similares', 320.00, 180.00),
      ('Perifericos laptop', 'Laptop', 'MicroChip Repuestos', 'Touchpad Lenovo IdeaPad 3 15ITL6', 'Panel tactil de reemplazo con flex para IdeaPad 3 serie 15ITL6', 1350.00, 450.00),
      ('Repuestos celulares', 'Celular', 'MovilPartes Centro', 'Pantalla Samsung Galaxy A52 OLED', 'Modulo frontal completo para Galaxy A52 SM-A525M', 2950.00, 850.00),
      ('Impresoras', 'Impresora', 'Soluciones Print y Redes', 'Rodillo de arrastre Epson L3250', 'Rodillo de alimentacion para EcoTank L3210/L3250/L3260', 540.00, 260.00),
      ('Pantallas laptop', 'Laptop', 'Laptop Parts Managua', 'Pantalla laptop 14.0 slim 30 pines FHD', 'Panel compatible con HP Pavilion 14 y Dell Latitude 5420', 3100.00, 780.00),
      ('Teclados laptop', 'Laptop', 'Laptop Parts Managua', 'Teclado Dell Vostro 3400 latino', 'Teclado interno latino para Dell Vostro 3400/Latitude serie 3000', 920.00, 330.00),
      ('Cargadores', 'Laptop', 'Laptop Parts Managua', 'Cargador Lenovo 20V 3.25A punta USB-C', 'Adaptador 65W USB-C para ThinkPad T480, IdeaPad y modelos compatibles', 980.00, 300.00),
      ('Baterias laptop', 'Laptop', 'Baterias y Celdas SA', 'Bateria HP Pavilion 14 HT03XL', 'Bateria interna para HP Pavilion 14-dv y series compatibles', 2100.00, 650.00),
      ('Refrigeracion laptop', 'Laptop', 'CompuStock Leon', 'Ventilador Acer Aspire 5 A515-56', 'Cooler interno para Acer Aspire 5 A515-56 con disipador compatible', 1150.00, 420.00),
      ('Almacenamiento', 'Laptop/Desktop', 'Importadora Byte', 'SSD Kingston A400 960GB SATA', 'Unidad SSD 2.5 pulgadas para laptop o desktop', 2950.00, 720.00),
      ('Memorias RAM', 'Desktop', 'Hardware Central', 'Memoria DDR4 8GB 2666MHz DIMM', 'Modulo de escritorio para HP ProDesk, EliteDesk y Dell OptiPlex', 850.00, 280.00),
      ('Fuentes de poder', 'Desktop', 'Hardware Central', 'Fuente HP EliteDesk 800 G4 SFF 250W', 'Fuente compacta compatible con HP EliteDesk 800 G4 formato SFF', 2450.00, 700.00),
      ('Almacenamiento', 'Desktop', 'Importadora Byte', 'Disco duro WD Blue 1TB 3.5 SATA', 'Disco mecanico para escritorio y respaldos de oficina', 1650.00, 430.00),
      ('Repuestos celulares', 'Celular', 'TecnoMovil Express', 'Bateria Samsung Galaxy A32 EB-BA325ABN', 'Bateria compatible para Galaxy A32 SM-A325M', 980.00, 360.00),
      ('Repuestos celulares', 'Celular', 'MovilLab Repuestos', 'Puerto carga Xiaomi Redmi Note 10 Pro', 'Flex de carga USB-C con microfono para Redmi Note 10 Pro', 620.00, 300.00),
      ('Repuestos celulares', 'Celular', 'MovilPartes Centro', 'Pantalla Motorola Moto G Power 2022', 'Modulo LCD/touch para Moto G Power 2022', 1750.00, 580.00),
      ('Repuestos celulares', 'Celular', 'TecnoMovil Express', 'Bateria iPhone 11 premium', 'Bateria de reemplazo alta capacidad para iPhone 11', 1450.00, 550.00),
      ('Tablets', 'Tablet', 'TabletCare Parts', 'Pantalla tactil iPad 8th Gen 10.2', 'Digitalizador para iPad 8va generacion A2270/A2428', 2400.00, 780.00),
      ('Tablets', 'Tablet', 'Mac y Tablet Parts', 'Bateria Samsung Galaxy Tab A8', 'Bateria interna para Galaxy Tab A8 SM-X200', 1850.00, 620.00),
      ('Impresoras', 'Impresora', 'Printer Supply Nicaragua', 'Kit tinta Epson 544 original CMYK', 'Botellas originales para EcoTank L3150/L3250/L3110', 1250.00, 350.00),
      ('Impresoras', 'Impresora', 'Printer Supply Nicaragua', 'Almohadilla mantenimiento Epson L3250', 'Kit de almohadillas para mantenimiento de EcoTank L3250', 460.00, 220.00),
      ('Impresoras', 'Impresora', 'LaserPrint Partes', 'Rodillo pickup HP LaserJet M404', 'Rodillo de arrastre para HP LaserJet Pro M404/M428', 780.00, 310.00),
      ('Impresoras', 'Impresora', 'Insumos Office Print', 'Toner Brother TN-660 compatible', 'Toner para Brother HL-L2320D y modelos relacionados', 1050.00, 420.00),
      ('Redes', 'Router', 'NetPoint Nicaragua', 'Adaptador Ubiquiti 24V 0.5A', 'Fuente PoE pasiva compatible con EdgeRouter X y equipos Ubiquiti seleccionados', 680.00, 280.00),
      ('Redes', 'Router', 'ServiRed Nicaragua', 'Adaptador Mercusys 12V 1A', 'Fuente compatible con routers Mercusys AC12G y similares', 300.00, 160.00),
      ('Consolas', 'Consola', 'Consolas Nica Parts', 'Puerto HDMI PlayStation 4 Pro', 'Conector HDMI para PS4 Pro con montaje en placa', 520.00, 300.00),
      ('Consolas', 'Consola', 'GameFix Distribucion', 'Stick analogico Joy-Con Nintendo Switch', 'Repuesto de palanca analogica para Joy-Con izquierdo o derecho', 390.00, 210.00)
    ) AS r(categoria, electronico, proveedor, nombre, descripcion, costo, ganancia)
  LOOP
    v_categoria_id := upsert_categoria(rec.categoria, rec.electronico);

    SELECT id_proveedor INTO v_proveedor_id
    FROM "Proveedores"
    WHERE lower(nombre) = lower(rec.proveedor)
    LIMIT 1;

    INSERT INTO "Repuestos" (
      tipo_repuesto_id, proveedor_id, nombre, descripcion, costo_individual,
      porcentaje_de_ganacia, ganancia_cordobas, stock_actual, activo, descontinuada
    )
    SELECT v_categoria_id, v_proveedor_id, rec.nombre, rec.descripcion, rec.costo, NULL, rec.ganancia, 0, true, false
    WHERE NOT EXISTS (SELECT 1 FROM "Repuestos" WHERE lower(nombre) = lower(rec.nombre));
  END LOOP;

  FOR rec IN
    SELECT *
    FROM (VALUES
      ('Memoria DDR4 8GB 3200MHz SODIMM', 'MicroChip Repuestos', 'MC-2026-0931', '2026-05-18 09:40:00'::timestamp, 8, 980.00, 'Transferencia'),
      ('SSD NVMe Kingston NV2 500GB', 'MicroChip Repuestos', 'MC-2026-0938', '2026-05-19 10:15:00'::timestamp, 5, 1850.00, 'Transferencia'),
      ('Fuente EVGA 500W 80 Plus', 'MicroChip Repuestos', 'MC-2026-0944', '2026-05-20 14:30:00'::timestamp, 3, 1950.00, 'Efectivo'),
      ('Adaptador corriente TP-Link 12V 1A', 'Soluciones Print y Redes', 'SPR-2026-0217', '2026-05-21 11:05:00'::timestamp, 6, 320.00, 'Efectivo'),
      ('Pantalla Samsung Galaxy A52 OLED', 'MovilPartes Centro', 'MPC-2026-0642', '2026-05-22 16:10:00'::timestamp, 2, 2950.00, 'Tarjeta'),
      ('Rodillo de arrastre Epson L3250', 'Soluciones Print y Redes', 'SPR-2026-0224', '2026-05-23 08:55:00'::timestamp, 4, 540.00, 'Transferencia'),
      ('Touchpad Lenovo IdeaPad 3 15ITL6', 'MicroChip Repuestos', 'MC-2026-0952', '2026-05-25 13:20:00'::timestamp, 2, 1350.00, 'Efectivo'),
      ('Pantalla laptop 14.0 slim 30 pines FHD', 'Laptop Parts Managua', 'LPM-2026-1401', '2026-05-26 09:10:00'::timestamp, 3, 3100.00, 'Transferencia'),
      ('Teclado Dell Vostro 3400 latino', 'Laptop Parts Managua', 'LPM-2026-1407', '2026-05-26 11:20:00'::timestamp, 4, 920.00, 'Efectivo'),
      ('Cargador Lenovo 20V 3.25A punta USB-C', 'Laptop Parts Managua', 'LPM-2026-1415', '2026-05-27 08:45:00'::timestamp, 5, 980.00, 'Tarjeta'),
      ('Bateria HP Pavilion 14 HT03XL', 'Baterias y Celdas SA', 'BCS-2026-0722', '2026-05-27 14:05:00'::timestamp, 3, 2100.00, 'Transferencia'),
      ('Ventilador Acer Aspire 5 A515-56', 'CompuStock Leon', 'CSL-2026-0334', '2026-05-28 10:30:00'::timestamp, 2, 1150.00, 'Efectivo'),
      ('SSD Kingston A400 960GB SATA', 'Importadora Byte', 'IB-2026-2101', '2026-05-28 15:15:00'::timestamp, 4, 2950.00, 'Transferencia'),
      ('Memoria DDR4 8GB 2666MHz DIMM', 'Hardware Central', 'HC-2026-1880', '2026-05-29 09:00:00'::timestamp, 6, 850.00, 'Efectivo'),
      ('Fuente HP EliteDesk 800 G4 SFF 250W', 'Hardware Central', 'HC-2026-1889', '2026-05-29 13:25:00'::timestamp, 2, 2450.00, 'Transferencia'),
      ('Disco duro WD Blue 1TB 3.5 SATA', 'Importadora Byte', 'IB-2026-2113', '2026-05-30 08:35:00'::timestamp, 3, 1650.00, 'Efectivo'),
      ('Bateria Samsung Galaxy A32 EB-BA325ABN', 'TecnoMovil Express', 'TME-2026-5021', '2026-05-30 11:45:00'::timestamp, 4, 980.00, 'Tarjeta'),
      ('Puerto carga Xiaomi Redmi Note 10 Pro', 'MovilLab Repuestos', 'MLR-2026-2710', '2026-05-30 16:00:00'::timestamp, 5, 620.00, 'Efectivo'),
      ('Pantalla Motorola Moto G Power 2022', 'MovilPartes Centro', 'MPC-2026-0658', '2026-05-31 09:20:00'::timestamp, 2, 1750.00, 'Transferencia'),
      ('Bateria iPhone 11 premium', 'TecnoMovil Express', 'TME-2026-5030', '2026-05-31 13:10:00'::timestamp, 3, 1450.00, 'Tarjeta'),
      ('Pantalla tactil iPad 8th Gen 10.2', 'TabletCare Parts', 'TCP-2026-0440', '2026-06-01 08:50:00'::timestamp, 2, 2400.00, 'Transferencia'),
      ('Bateria Samsung Galaxy Tab A8', 'Mac y Tablet Parts', 'MTP-2026-0175', '2026-06-01 10:40:00'::timestamp, 2, 1850.00, 'Efectivo'),
      ('Kit tinta Epson 544 original CMYK', 'Printer Supply Nicaragua', 'PSN-2026-0912', '2026-06-01 11:30:00'::timestamp, 5, 1250.00, 'Transferencia'),
      ('Almohadilla mantenimiento Epson L3250', 'Printer Supply Nicaragua', 'PSN-2026-0920', '2026-06-01 12:15:00'::timestamp, 6, 460.00, 'Efectivo'),
      ('Rodillo pickup HP LaserJet M404', 'LaserPrint Partes', 'LPP-2026-3105', '2026-06-01 14:25:00'::timestamp, 3, 780.00, 'Tarjeta'),
      ('Toner Brother TN-660 compatible', 'Insumos Office Print', 'IOP-2026-1450', '2026-06-01 15:00:00'::timestamp, 4, 1050.00, 'Transferencia'),
      ('Adaptador Ubiquiti 24V 0.5A', 'NetPoint Nicaragua', 'NPN-2026-0821', '2026-06-01 15:40:00'::timestamp, 4, 680.00, 'Efectivo'),
      ('Adaptador Mercusys 12V 1A', 'ServiRed Nicaragua', 'SRN-2026-0618', '2026-06-01 16:10:00'::timestamp, 5, 300.00, 'Efectivo'),
      ('Puerto HDMI PlayStation 4 Pro', 'Consolas Nica Parts', 'CNP-2026-1201', '2026-06-01 16:35:00'::timestamp, 3, 520.00, 'Transferencia'),
      ('Stick analogico Joy-Con Nintendo Switch', 'GameFix Distribucion', 'GFD-2026-0552', '2026-06-01 17:05:00'::timestamp, 4, 390.00, 'Tarjeta')
    ) AS c(repuesto, proveedor, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
  LOOP
    SELECT id_repuesto INTO v_repuesto_id
    FROM "Repuestos"
    WHERE lower(nombre) = lower(rec.repuesto)
    LIMIT 1;

    SELECT id_proveedor INTO v_proveedor_id
    FROM "Proveedores"
    WHERE lower(nombre) = lower(rec.proveedor)
    LIMIT 1;

    INSERT INTO "Compras" (repuesto_id, proveedor_id, documento, fecha_obtencion, cantidad, costo_unitario, metodo_pago)
    SELECT v_repuesto_id, v_proveedor_id, rec.documento, rec.fecha_obtencion, rec.cantidad, rec.costo_unitario, rec.metodo_pago
    WHERE v_repuesto_id IS NOT NULL
      AND v_proveedor_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "Compras" WHERE documento = rec.documento);
  END LOOP;

  PERFORM recalcular_stock_repuestos();
END $$;

SELECT 'Datos operativos adicionales ampliados cargados correctamente' AS resultado;
