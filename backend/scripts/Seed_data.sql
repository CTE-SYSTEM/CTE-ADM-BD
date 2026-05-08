-- backend/scripts/Seed_data.sql

-- 1. Insertar o actualizar Usuarios
-- Usamos nombre_usuario como la clave de conflicto
INSERT INTO "Usuarios" (id_usuario, nombre_usuario, contrasena_hash, correo_electronico, rol, activo, fecha_creacion)
VALUES 
(1, 'admin_pro', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'admin@cte.com', 'Administrador', true, '2026-05-01 03:26:37.131'),
(6, 'secretaria_ana', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'secretaria@cte.com', 'Secretaria', true, '2026-05-01 03:27:51.627'),
(3, 'jefe_tecnico', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'jefe@cte.com', 'TecnicoJefe', true, '2026-05-01 03:26:37.131'),
(4, 'tecnico_juan', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'juan.perez@cte.com', 'Tecnico', true, '2026-05-01 03:26:37.131'),
(13, 'marcos_fix', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'marcos.fix@cte.com', 'Tecnico', true, '2026-05-04 21:55:19.615'),
(14, 'elena_tech', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'elena.tech@cte.com', 'Tecnico', true, '2026-05-04 21:55:33.366'),
(15, 'roberto_vga', '$2b$10$/7IaHp89gi.hRq5HyXQFfu90wgJtVAqjCG.c45nBctOBT6YFZmf9K', 'roberto.vga@cte.com', 'Tecnico', true, '2026-05-04 21:55:46.188')
ON CONFLICT (nombre_usuario) DO UPDATE SET
  contrasena_hash = EXCLUDED.contrasena_hash,
  correo_electronico = EXCLUDED.correo_electronico,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo;

-- 2. Insertar o actualizar Tecnicos
-- Usamos id_tecnico como la clave de conflicto
INSERT INTO "Tecnicos" (id_tecnico, nombre, especialidad, horario, contacto, usuario_id)
VALUES 
(1, 'Marcos Galindo', 'Microelectrónica y Reballing', 'L-V 09:00-18:00', '+505 8888-1111', 13),
(3, 'Elena Rodríguez', 'Reparación de Laptops High-End', 'L-V 08:00-17:00', 'elena.rodriguez@email.com', 14),
(4, 'Roberto Sosa', 'Consolas y Periféricos', 'Sábados 08:00-14:00', 'Ext. 104', 15),
(5, 'Juan Pérez', 'Reparación General y Móviles', 'L-V 08:00-17:00', 'tecnico@cte.com', 4),
(6, 'Ing. Ricardo Méndez', 'Jefe de Taller y Diagnóstico', 'L-S 08:00-17:00', 'jefe@cte.com', 3)
ON CONFLICT (id_tecnico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especialidad = EXCLUDED.especialidad,
  horario = EXCLUDED.horario,
  contacto = EXCLUDED.contacto,
  usuario_id = EXCLUDED.usuario_id;

-- 3. Sincronizar secuencias (Importante después de insertar IDs manuales)
SELECT setval(pg_get_serial_sequence('"Usuarios"', 'id_usuario'), coalesce(max(id_usuario), 1)) FROM "Usuarios";
SELECT setval(pg_get_serial_sequence('"Tecnicos"', 'id_tecnico'), coalesce(max(id_tecnico), 1)) FROM "Tecnicos";