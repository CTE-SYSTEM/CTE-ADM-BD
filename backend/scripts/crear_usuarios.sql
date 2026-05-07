-- backend/scripts/crear_usuarios.sql
-- Credenciales por defecto para desarrollo (ver CREDENTIALS.md para detalles)

DELETE FROM "Usuarios" WHERE nombre_usuario IN ('admin_pro', 'secretaria_ana', 'jefe_tecnico', 'tecnico_juan');

INSERT INTO "Usuarios" (nombre_usuario, contrasena_hash, rol, correo_electronico, activo) VALUES 
('admin_pro', '$2a$10$1aQRILb/qZBQil.GPyirCOgNZRIhAd8c5fzlggcwu7D7a4jP4YpZy', 'Administrador', 'admin@cte.com', true),
('secretaria_ana', '$2a$10$boXnyVRqHzZDGm8bR7kxPO94T07TEITYyjPFfZAKeAQrl0pm3xYee', 'Secretaria', 'secretaria@cte.com', true),
('jefe_tecnico', '$2a$10$HUiUtTznlasAguqK0qDZduGqqIzObso3sisY13ovs4S6WoR.cGpzq', 'TecnicoJefe', 'jefe@cte.com', true),
('tecnico_juan', '$2a$10$R57OZ6uSwt90VtjzvLaMz.sewoiOy2kcAIBSIB62t.iPQc9BkuGtW', 'Tecnico', 'tecnico@cte.com', true)
ON CONFLICT (nombre_usuario) DO UPDATE SET
  contrasena_hash = EXCLUDED.contrasena_hash,
  rol = EXCLUDED.rol,
  correo_electronico = EXCLUDED.correo_electronico,
  activo = EXCLUDED.activo;
