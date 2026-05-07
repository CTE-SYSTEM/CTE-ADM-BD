# 🔐 Credenciales de Acceso - Centro Técnico Electrónico

## Información Importante

Las credenciales por defecto están configuradas para **desarrollo y pruebas**. Para **producción**, reemplaza estas contraseñas con contraseñas seguras.

## 📊 Usuarios por Defecto

| Usuario | Rol | Contraseña | Email |
|---------|-----|-----------|-------|
| `admin_pro` | Administrador | `admin123` | admin@cte.com |
| `secretaria_ana` | Secretaria | `secretaria123` | secretaria@cte.com |
| `jefe_tecnico` | Técnico Jefe | `jefe123` | jefe@cte.com |
| `tecnico_juan` | Técnico | `tecnico123` | tecnico@cte.com |

## 🗄️ Base de Datos

**PostgreSQL**
- Usuario: `User_admin`
- Contraseña: `TuPasswordSeguro123!`
- Base de datos: `Centro_Tecnico_Electronico`
- Host: `localhost:5432`

## 🚀 Cómo Usar

### 1. Iniciar los contenedores Docker
```bash
docker compose up -d
```

### 2. Cargar las credenciales en la base de datos
```bash
npm run db:seed
```

O manualmente:
```bash
docker exec -i postgres_cte psql -U User_admin -d Centro_Tecnico_Electronico < scripts/crear_usuarios.sql
```

### 3. Acceder a la aplicación
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Prisma Studio**: http://localhost:5555

### 4. Iniciar sesión
Usa cualquiera de los usuarios de la tabla anterior con sus respectivas contraseñas.

## ⚙️ Variables de Entorno

El archivo `.env` debe incluir:

```env
DATABASE_URL=postgresql://User_admin:TuPasswordSeguro123!@db:5432/Centro_Tecnico_Electronico?schema=public
JWT_SECRET=tu_secreto_super_seguro
NODE_ENV=development
PORT=5000
```

## 🔧 Cambiar Contraseña en Producción

1. Modifica el archivo `scripts/crear_usuarios.sql` con nuevas contraseñas
2. Genera los hashes bcrypt con: `node scripts/generatePasswordHashes.js`
3. Reemplaza los hashes en el SQL
4. Ejecuta: `npm run db:seed`

## 📝 Notas

- Las contraseñas están hasheadas con bcryptjs (algoritmo bcrypt)
- Los hashes en la base de datos nunca deben ser iguales a las contraseñas en texto plano
- Para desarrollo, estas credenciales están documentadas. **NO uses en producción sin cambiarlas**
- Cada usuario tiene un rol específico que determina sus permisos en la aplicación

## 🔐 Generación de Hashes

Para generar nuevos hashes de contraseñas, usa:
```bash
node scripts/generatePasswordHashes.js
```

Este script generará hashes seguros para las contraseñas que definas en el código.
