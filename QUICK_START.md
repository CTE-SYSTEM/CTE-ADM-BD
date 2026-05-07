# 🚀 Guía Rápida de Setup

## 1️⃣ Iniciar Docker y la Base de Datos

```bash
docker compose up -d
```

Espera a que todos los servicios estén listos (especialmente PostgreSQL).

## 2️⃣ Cargar los Usuarios por Defecto

```bash
cd backend
npm run db:seed
```

**O manualmente:**
```bash
docker exec -i postgres_cte psql -U User_admin -d Centro_Tecnico_Electronico < backend/scripts/crear_usuarios.sql
```

## 3️⃣ Verificar que todo funciona

```bash
npm run db:check:users
```

Deberías ver 4 usuarios creados y activos:
- `admin_pro` (Administrador) - Contraseña: `admin123`
- `secretaria_ana` (Secretaria) - Contraseña: `secretaria123`
- `jefe_tecnico` (Técnico Jefe) - Contraseña: `jefe123`
- `tecnico_juan` (Técnico) - Contraseña: `tecnico123`

## 4️⃣ Acceder a la Aplicación

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:5000 |
| **Prisma Studio** | http://localhost:5555 |
| **pgAdmin** | http://localhost:8080 |

## 📝 Credenciales de Base de Datos

Para cualquier herramienta que necesite acceder a PostgreSQL:

- **Host:** localhost:5432
- **Usuario:** User_admin
- **Contraseña:** TuPasswordSeguro123!
- **Base de datos:** Centro_Tecnico_Electronico

## 🔐 Para Cambiar las Credenciales de Usuarios (Producción)

1. Edita [backend/scripts/crear_usuarios.sql](backend/scripts/crear_usuarios.sql)
2. Genera los hashes: `cd backend && npm run db:generate-hashes`
3. Reemplaza los hashes en el SQL
4. Ejecuta: `npm run db:seed`

---

**¿Problemas?** Ver [CREDENTIALS.md](CREDENTIALS.md) para más información.
