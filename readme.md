# Guia rapida de setup

## Preparacion

En la carpeta `backend`, crea un archivo `.env` copiando el contenido de `.env.example`.

## Opcion recomendada: levantar todo con Docker

Instala las dependencias locales:

```bash
npm run install:all
```

Levanta la aplicacion:

```bash
docker compose up --build
```

Con ese comando, el contenedor del backend hace automaticamente:

```bash
npx prisma generate
npx prisma db push
npm run db:functions:container
npm run db:seed:container
npm run dev
```

Es decir, no tienes que correr aparte las funciones SQL. Docker crea/actualiza las tablas, carga las funciones de `backend/scripts/modules` y carga los usuarios/tecnicos iniciales.

## Opcion manual para base de datos

Si solo quieres levantar PostgreSQL y preparar la base manualmente:

```bash
npm run db:setup
```

Ese script levanta la base, aplica Prisma, carga las funciones SQL y ejecuta el seed.

## Verificar datos

```bash
npm run db:check:users --prefix backend
npm run db:check:tecnicos --prefix backend
```

Deberias ver usuarios activos como:

- `admin_pro` (Administrador) - Contrasena: `1234`
- `secretaria_ana` (Secretaria) - Contrasena: `1234`
- `jefe_tecnico` (Tecnico Jefe) - Contrasena: `1234`
- `tecnico_juan` (Tecnico) - Contrasena: `1234`
- `marcos_fix` (Tecnico) - Contrasena: `1234`
- `elena_tech` (Tecnico) - Contrasena: `1234`
- `roberto_vga` (Tecnico) - Contrasena: `1234`

## Acceder a la aplicacion

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Prisma Studio | http://localhost:5555 |
| pgAdmin | http://localhost:8080 |

## Credenciales de base de datos

- Host: `localhost:5432`
- Usuario: `User_admin`
- Contrasena: `TuPasswordSeguro123!`
- Base de datos: `Centro_Tecnico_Electronico`

 y esatmos usando reailway uuuuuuu