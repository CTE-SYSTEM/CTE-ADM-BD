# CTE-ADM-BD

Sistema para administrar un Centro Tecnico Electronico. El proyecto esta separado en:

- `frontend/`: aplicacion React + Vite.
- `backend/`: API Express, Prisma y PostgreSQL.
- `docker-compose.yml`: entorno local completo con base de datos, backend, frontend y pgAdmin.

## Inicio Rapido Local

Instalar dependencias:

```bash
npm run install:all
```

Levantar todo con Docker:

```bash
docker compose up --build
```

Servicios locales:

| Servicio | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Prisma Studio | http://localhost:5555 |
| pgAdmin | http://localhost:8080 |

Usuarios iniciales habituales:

| Usuario | Rol | Contrasena |
| --- | --- | --- |
| `admin_pro` | Administrador | `1234` |
| `secretaria_ana` | Secretaria | `1234` |
| `jefe_tecnico` | Tecnico Jefe | `1234` |
| `tecnico_juan` | Tecnico | `1234` |

## Estructura General

```txt
CTE-ADM-BD/
  backend/              API, Prisma, SQL, servicios y pruebas.
  frontend/             Aplicacion React organizada por features.
  docker-compose.yml    Orquestacion local.
  package.json          Scripts generales del workspace.
```

## Donde Modificar

- Cambios visuales o pantallas: `frontend/src/features/`.
- Cambios de API o reglas del servidor: `backend/src/`.
- Cambios de base de datos o funciones SQL: `backend/prisma/` y `backend/scripts/`.
- Cambios de Docker local: `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`.

## Como Agregar Funciones Nuevas

Frontend:

1. Busca el modulo en `frontend/src/features`.
2. Agrega la pagina, componente, hook o servicio dentro del modulo.
3. Si es compartido por varios modulos, usa `frontend/src/components`, `frontend/src/hooks` o `frontend/src/services`.

Backend:

1. Agrega el controlador en `backend/src/controllers/<Modulo>`.
2. Agrega o actualiza la ruta en `backend/src/routes/modules/<modulo>`.
3. Si hay logica reutilizable, ponla en `backend/src/services`.
4. Si requiere SQL, agrega el script en `backend/scripts/modules/<Modulo>`.

## Como Eliminar Funciones

Antes de borrar:

1. Busca referencias con `rg "nombreFuncion"` o `rg "ruta/archivo"`.
2. Revisa frontend, backend, rutas y scripts SQL.
3. Elimina primero imports/rutas que la llamen.
4. Ejecuta build o prueba de importacion.

Comandos utiles:

```bash
npm run build --prefix frontend
cd backend
node -e "import('./src/app/app.js').then(() => console.log('app import ok')).catch((err) => { console.error(err); process.exit(1); })"
```

## Railway / Produccion

Para Railway normalmente se despliega `backend/` y `frontend/` como servicios separados.

Variables importantes del backend:

- `DATABASE_URL`
- `SQL_DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `NODE_ENV=production`

Variables importantes del frontend:

- `VITE_API_URL`

Despues de cambiar funciones SQL, recarga:

```bash
npm run db:functions --prefix backend
```

## Notas Sobre Archivos Sueltos

Muchos archivos deben quedarse en raiz por convencion:

- `package.json`, `package-lock.json`
- `.gitignore`, `.gitattributes`
- `docker-compose.yml`
- `backend/Dockerfile`, `frontend/Dockerfile`
- `frontend/vite.config.js`, `frontend/eslint.config.js`, `frontend/tailwind.config.cjs`

Moverlos es posible en algunos casos, pero obliga a cambiar scripts, Docker o herramientas.
