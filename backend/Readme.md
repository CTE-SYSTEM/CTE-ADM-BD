# Backend CTE

API del sistema CTE construida con Express, Prisma y PostgreSQL.

## Estructura

```txt
backend/
  src/
    app/             Configuracion de Express y cliente Prisma.
    config/          Variables de entorno y configuracion base.
    controllers/     Controladores por modulo.
    middlewares/     Seguridad, autenticacion y manejo de errores.
    routes/          Rutas HTTP por modulo.
    services/        Logica reutilizable y servicios del backend.
    utils/           Permisos, roles y validaciones de dominio.
    server.js        Punto de entrada real del backend.

  prisma/
    schema.prisma    Modelo de datos Prisma.
    Seed.js          Seed de datos.

  scripts/
    modules/         Funciones SQL separadas por modulo.
    load_functions.sql
    setup.sh

  tests/
    api/             Pruebas de API.
```

## Modulos Principales

```txt
controllers/
  Secretaria/
  Tecnico/
  JefeTecnico/
  admin_pro/
  auth/
```

```txt
routes/modules/
  secretaria/
  Tecnico/
  JefeTecnico/
  admin_pro/
```

## Donde Modificar

### Secretaria

- Controladores: `src/controllers/Secretaria/`
- Rutas: `src/routes/modules/secretaria/`
- Servicios: `src/services/Secretaria/`
- SQL: `scripts/modules/Secretaria/`

### Tecnico

- Controlador: `src/controllers/Tecnico/tecnicosController.js`
- Rutas: `src/routes/modules/Tecnico/tecnicos.js`
- Servicio: `src/services/Tecnico/tecnicoService.js`
- SQL: `scripts/modules/Tecnico/`

### Tecnico Jefe

- Controlador: `src/controllers/JefeTecnico/DiagnosticoController.js`
- Rutas: `src/routes/modules/JefeTecnico/Diagnostico.js`
- SQL: `scripts/modules/JefeTecnico/`

### Admin Pro

- Controladores: `src/controllers/admin_pro/`
- Rutas: `src/routes/modules/admin_pro/adminPro.js`
- SQL: `scripts/modules/admin_pro/`

## Como Agregar Un Endpoint

1. Crea o modifica el controlador en `src/controllers/<Modulo>/`.
2. Exporta la funcion del controlador.
3. Agrega la ruta en `src/routes/modules/<modulo>/`.
4. Registra la ruta en `src/app/app.js` solo si es un modulo nuevo.
5. Si usa SQL, agrega la funcion en `scripts/modules/<Modulo>/` y revisa `scripts/load_functions.sql`.

Ejemplo mental:

```txt
controllers/Secretaria/clientesController.js
routes/modules/secretaria/Clientes.js
app/app.js -> app.use('/api/clientes', clientesRoutes)
```

## Como Eliminar Una Funcion

Antes de borrar una funcion:

```bash
rg "nombreFuncion" backend/src backend/scripts backend/tests
```

Luego:

1. Quita la ruta HTTP que la usa.
2. Quita imports.
3. Quita la funcion del controlador.
4. Si aplica, elimina SQL relacionado.
5. Prueba importando la app.

```bash
node -e "import('./src/app/app.js').then(() => console.log('app import ok')).catch((err) => { console.error(err); process.exit(1); })"
```

## Base De Datos

Prisma:

```bash
npm run db:generate
npm run db:sync
```

Funciones SQL:

```bash
npm run db:functions
```

Dentro de Docker:

```bash
npm run db:functions:container
```

Verificaciones utiles:

```bash
npm run db:check:users
npm run db:check:clientes
npm run db:check:tecnicos
```

## Prisma Studio

Con Docker:

```bash
docker exec -it backend_cte sh
npx prisma studio --port 5555 --browser none --hostname 0.0.0.0
```

Abrir:

```txt
http://localhost:5555
```

## pgAdmin

URL:

```txt
http://localhost:8080
```

Credenciales del panel:

```txt
Usuario: sadiel@admin.com
Contrasena: admin
```

Conexion a PostgreSQL dentro de Docker:

| Campo | Valor |
| --- | --- |
| Host | `db` |
| Port | `5432` |
| Database | `Centro_Tecnico_Electronico` |
| Username | `User_admin` |
| Password | `TuPasswordSeguro123!` |

## Railway / Produccion

Variables importantes:

- `DATABASE_URL`
- `SQL_DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `NODE_ENV`

Despues de desplegar o modificar SQL:

```bash
npm run db:generate
npm run db:sync
npm run db:functions
```

## Notas De Orden

No mover sin revisar:

- `package.json`
- `package-lock.json`
- `.env`
- `.env.example`
- `Dockerfile`
- `prisma/schema.prisma`

Estos archivos estan donde las herramientas los esperan.
