-- backend/scripts/crear_usuarios.sql
INSERT INTO "Usuarios" (nombre_usuario, contrasena_hash, rol, correo_electronico, activo) VALUES 
('admin_pro', '1234', 'Administrador', 'admin@cte.com', true),
('secretaria_ana', '1234', 'Secretaria', 'secretaria@cte.com', true),
('jefe_tecnico', '1234', 'TecnicoJefe', 'jefe@cte.com', true),
('tecnico_juan', '1234', 'Tecnico', 'tecnico@cte.com', true)
ON CONFLICT (nombre_usuario) DO NOTHING;