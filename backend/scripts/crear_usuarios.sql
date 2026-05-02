-- backend/scripts/crear_usuarios.sql
DELETE FROM "Usuarios" WHERE nombre_usuario = 'secretaria_ana';

INSERT INTO "Usuarios" (nombre_usuario, contrasena_hash, rol, correo_electronico, activo) VALUES 
('admin_pro', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'Administrador', 'admin@cte.com', true),
('secretariana_ana', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'Secretaria', 'secretaria@cte.com', true),
('jefe_tecnico', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'TecnicoJefe', 'jefe@cte.com', true),
('tecnico_juan', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'Tecnico', 'tecnico@cte.com', true)
ON CONFLICT (nombre_usuario) DO UPDATE SET
  contrasena_hash = EXCLUDED.contrasena_hash,
  rol = EXCLUDED.rol,
  correo_electronico = EXCLUDED.correo_electronico,
  activo = EXCLUDED.activo;
