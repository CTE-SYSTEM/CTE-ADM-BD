BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Usuarios] (
    [id_usuario] INT NOT NULL IDENTITY(1,1),
    [nombre_usuario] NVARCHAR(1000) NOT NULL,
    [contrasena_hash] NVARCHAR(1000) NOT NULL,
    [correo_electronico] NVARCHAR(1000),
    [rol] NVARCHAR(1000) NOT NULL,
    [activo] BIT NOT NULL CONSTRAINT [Usuarios_activo_df] DEFAULT 1,
    [fecha_creacion] DATETIME2 NOT NULL CONSTRAINT [Usuarios_fecha_creacion_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Usuarios_pkey] PRIMARY KEY CLUSTERED ([id_usuario]),
    CONSTRAINT [Usuarios_nombre_usuario_key] UNIQUE NONCLUSTERED ([nombre_usuario])
);

-- CreateTable
CREATE TABLE [dbo].[Clientes] (
    [id_cliente] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(100) NOT NULL,
    [telefono] NVARCHAR(20),
    [direccion] NVARCHAR(150),
    [correo] NVARCHAR(100),
    [contacto_secundario] NVARCHAR(100),
    CONSTRAINT [Clientes_pkey] PRIMARY KEY CLUSTERED ([id_cliente])
);

-- CreateTable
CREATE TABLE [dbo].[Equipos] (
    [id_equipo] INT NOT NULL IDENTITY(1,1),
    [cliente_id] INT NOT NULL,
    [marca] NVARCHAR(50),
    [tipo] NVARCHAR(100),
    [numero_serie] NVARCHAR(100),
    [modelo] NVARCHAR(100),
    CONSTRAINT [Equipos_pkey] PRIMARY KEY CLUSTERED ([id_equipo])
);

-- CreateTable
CREATE TABLE [dbo].[Tecnicos] (
    [id_tecnico] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(100) NOT NULL,
    [especialidad] NVARCHAR(100),
    [horario] NVARCHAR(50),
    [contacto] NVARCHAR(100),
    CONSTRAINT [Tecnicos_pkey] PRIMARY KEY CLUSTERED ([id_tecnico])
);

-- CreateTable
CREATE TABLE [dbo].[Diagnosticos] (
    [id_diagnostico] INT NOT NULL IDENTITY(1,1),
    [equipo_id] INT NOT NULL,
    [tecnico_id] INT NOT NULL,
    [falla_reportada] NVARCHAR(200),
    [diagnostico_real] NVARCHAR(200),
    [fecha_hora] DATETIME2 CONSTRAINT [Diagnosticos_fecha_hora_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Diagnosticos_pkey] PRIMARY KEY CLUSTERED ([id_diagnostico])
);

-- CreateTable
CREATE TABLE [dbo].[Ordenes] (
    [id_orden] INT NOT NULL IDENTITY(1,1),
    [diagnostico_id] INT NOT NULL,
    [tecnico_id] INT NOT NULL,
    [prioridad] NVARCHAR(20),
    [estado] NVARCHAR(50),
    [fecha_ingreso] DATETIME2 CONSTRAINT [Ordenes_fecha_ingreso_df] DEFAULT CURRENT_TIMESTAMP,
    [tipo_equipo] NVARCHAR(100),
    CONSTRAINT [Ordenes_pkey] PRIMARY KEY CLUSTERED ([id_orden])
);

-- CreateTable
CREATE TABLE [dbo].[Categorias_Repuestos] (
    [id_tipo_repuesto] INT NOT NULL IDENTITY(1,1),
    [nombre_tipo] NVARCHAR(100),
    [electronico] NVARCHAR(50),
    CONSTRAINT [Categorias_Repuestos_pkey] PRIMARY KEY CLUSTERED ([id_tipo_repuesto])
);

-- CreateTable
CREATE TABLE [dbo].[Repuestos] (
    [id_repuesto] INT NOT NULL IDENTITY(1,1),
    [tipo_repuesto_id] INT NOT NULL,
    [ubicacion] NVARCHAR(100),
    [n_serie] NVARCHAR(100),
    [nombre] NVARCHAR(100),
    [descripcion] NVARCHAR(200),
    [costo_unitario] DECIMAL(18,2),
    CONSTRAINT [Repuestos_pkey] PRIMARY KEY CLUSTERED ([id_repuesto])
);

-- CreateTable
CREATE TABLE [dbo].[Proveedores] (
    [id_proveedor] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(100) NOT NULL,
    [telefono] NVARCHAR(20),
    [direccion] NVARCHAR(150),
    [correo] NVARCHAR(100),
    CONSTRAINT [Proveedores_pkey] PRIMARY KEY CLUSTERED ([id_proveedor])
);

-- CreateTable
CREATE TABLE [dbo].[Compras] (
    [id_compra] INT NOT NULL IDENTITY(1,1),
    [repuesto_id] INT NOT NULL,
    [proveedor_id] INT NOT NULL,
    [origen_proveedor] NVARCHAR(100),
    [documento] NVARCHAR(100),
    [fecha_obtencion] DATETIME2 CONSTRAINT [Compras_fecha_obtencion_df] DEFAULT CURRENT_TIMESTAMP,
    [cantidad] INT,
    [costo_unitario] DECIMAL(18,2),
    CONSTRAINT [Compras_pkey] PRIMARY KEY CLUSTERED ([id_compra])
);

-- CreateTable
CREATE TABLE [dbo].[Facturas] (
    [id_factura] INT NOT NULL IDENTITY(1,1),
    [orden_id] INT NOT NULL,
    [fecha_emision] DATETIME2 CONSTRAINT [Facturas_fecha_emision_df] DEFAULT CURRENT_TIMESTAMP,
    [subtotal] DECIMAL(18,2),
    [impuestos] DECIMAL(18,2),
    [total] DECIMAL(18,2),
    [estado_pago] NVARCHAR(50),
    [metodo_pago] NVARCHAR(50),
    CONSTRAINT [Facturas_pkey] PRIMARY KEY CLUSTERED ([id_factura])
);

-- CreateTable
CREATE TABLE [dbo].[Facturas_Detalles] (
    [id_detalle_repuesto] INT NOT NULL IDENTITY(1,1),
    [factura_id] INT NOT NULL,
    [repuesto_id] INT NOT NULL,
    [cantidad_usada] INT,
    CONSTRAINT [Facturas_Detalles_pkey] PRIMARY KEY CLUSTERED ([id_detalle_repuesto])
);

-- CreateTable
CREATE TABLE [dbo].[Garantias] (
    [id_garantia] INT NOT NULL IDENTITY(1,1),
    [factura_id] INT NOT NULL,
    [condiciones] NVARCHAR(1000),
    [duracion_meses] INT,
    [fecha_inicio] DATE,
    [fecha_vencimiento] DATE,
    CONSTRAINT [Garantias_pkey] PRIMARY KEY CLUSTERED ([id_garantia])
);

-- AddForeignKey
ALTER TABLE [dbo].[Equipos] ADD CONSTRAINT [Equipos_cliente_id_fkey] FOREIGN KEY ([cliente_id]) REFERENCES [dbo].[Clientes]([id_cliente]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Diagnosticos] ADD CONSTRAINT [Diagnosticos_equipo_id_fkey] FOREIGN KEY ([equipo_id]) REFERENCES [dbo].[Equipos]([id_equipo]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Diagnosticos] ADD CONSTRAINT [Diagnosticos_tecnico_id_fkey] FOREIGN KEY ([tecnico_id]) REFERENCES [dbo].[Tecnicos]([id_tecnico]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Ordenes] ADD CONSTRAINT [Ordenes_diagnostico_id_fkey] FOREIGN KEY ([diagnostico_id]) REFERENCES [dbo].[Diagnosticos]([id_diagnostico]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ordenes] ADD CONSTRAINT [Ordenes_tecnico_id_fkey] FOREIGN KEY ([tecnico_id]) REFERENCES [dbo].[Tecnicos]([id_tecnico]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Repuestos] ADD CONSTRAINT [Repuestos_tipo_repuesto_id_fkey] FOREIGN KEY ([tipo_repuesto_id]) REFERENCES [dbo].[Categorias_Repuestos]([id_tipo_repuesto]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Compras] ADD CONSTRAINT [Compras_proveedor_id_fkey] FOREIGN KEY ([proveedor_id]) REFERENCES [dbo].[Proveedores]([id_proveedor]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Compras] ADD CONSTRAINT [Compras_repuesto_id_fkey] FOREIGN KEY ([repuesto_id]) REFERENCES [dbo].[Repuestos]([id_repuesto]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Facturas] ADD CONSTRAINT [Facturas_orden_id_fkey] FOREIGN KEY ([orden_id]) REFERENCES [dbo].[Ordenes]([id_orden]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Facturas_Detalles] ADD CONSTRAINT [Facturas_Detalles_factura_id_fkey] FOREIGN KEY ([factura_id]) REFERENCES [dbo].[Facturas]([id_factura]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Facturas_Detalles] ADD CONSTRAINT [Facturas_Detalles_repuesto_id_fkey] FOREIGN KEY ([repuesto_id]) REFERENCES [dbo].[Repuestos]([id_repuesto]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Garantias] ADD CONSTRAINT [Garantias_factura_id_fkey] FOREIGN KEY ([factura_id]) REFERENCES [dbo].[Facturas]([id_factura]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
