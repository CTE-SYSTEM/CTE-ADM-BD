-- backend/scripts/crear_usuarios.sql
INSERT INTO "Usuarios" (nombre_usuario, contrasena_hash, rol, correo_electronico, activo) VALUES 
('admin_pro', '$2b$10$d1EKgNwu8wAt6t55NI/iUOjZdyAEGLve5y1zB9XpUrZe9qb5wUlLW', 'Administrador', 'admin@cte.com', true),
('secretaria_ana', '$2b$10$d1EKgNwu8wAt6t55NI/iUOjZdyAEGLve5y1zB9XpUrZe9qb5wUlLW', 'Secretaria', 'secretaria@cte.com', true),
('jefe_tecnico', '$2b$10$d1EKgNwu8wAt6t55NI/iUOjZdyAEGLve5y1zB9XpUrZe9qb5wUlLW', 'TecnicoJefe', 'jefe@cte.com', true),
('tecnico_juan', '$2b$10$d1EKgNwu8wAt6t55NI/iUOjZdyAEGLve5y1zB9XpUrZe9qb5wUlLW', 'Tecnico', 'tecnico@cte.com', true)
ON CONFLICT (nombre_usuario) DO NOTHING;