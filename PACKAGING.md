# 📦 Archivos de Configuración de Credenciales

Este documento explica los archivos nuevos que se han agregado para facilitar la gestión de credenciales y usuarios.

## ✅ Archivos Agregados/Modificados

### 1. **backend/scripts/crear_usuarios.sql** ✏️ MODIFICADO
- **Cambio:** Actualizado con credenciales conocidas y hashes correctos
- **Propósito:** Script SQL para insertar los 4 usuarios por defecto en la base de datos
- **Ejecución:** `npm run db:seed` desde la carpeta backend

### 2. **backend/scripts/generatePasswordHashes.js** ✨ NUEVO
- **Propósito:** Script para generar hashes bcrypt de contraseñas
- **Uso:** `npm run db:generate-hashes` 
- **Ejemplo de salida:**
  ```
  Usuario: admin
  Contraseña: admin123
  Hash: $2a$10$1aQRILb/qZBQil.GPyirCOgNZRIhAd8c5fzlggcwu7D7a4jP4YpZy
  ```

### 3. **backend/.env.example** ✨ NUEVO
- **Propósito:** Plantilla de variables de entorno
- **Uso:** Copia como `.env` y personaliza para tu entorno
- **Nota:** No incluir en `.gitignore`, es una plantilla

### 4. **CREDENTIALS.md** ✨ NUEVO
- **Propósito:** Documentación detallada de credenciales y usuarios
- **Contenido:** 
  - Tabla de usuarios por defecto
  - Credenciales de base de datos
  - Cómo cargar usuarios
  - Pasos para producción

### 5. **QUICK_START.md** ✨ NUEVO
- **Propósito:** Guía rápida de 4 pasos para setup inicial
- **Audiencia:** Nuevos desarrolladores que clonan el repo

### 6. **backend/Readme.md** ✏️ MODIFICADO
- **Cambio:** Agregada sección 3 sobre carga de usuarios
- **Propósito:** Documentar los comandos npm para gestión de usuarios

### 7. **backend/package.json** ✏️ MODIFICADO
- **Cambios:**
  - Agregado script `db:generate-hashes`
  - Agregado script `db:seed:local` (para Linux/Mac sin Docker)
  - Corregidos scripts `db:check:*` para Windows
- **Nuevos comandos:**
  ```bash
  npm run db:seed              # Cargar usuarios vía Docker
  npm run db:seed:local        # Cargar usuarios localmente (Linux/Mac)
  npm run db:check:users       # Ver usuarios creados
  npm run db:generate-hashes   # Generar hashes de contraseñas
  ```

## 🔄 Flujo de Uso

### Para desarrollo/testing (first time):
```bash
docker compose up -d
cd backend
npm run db:seed
npm run db:check:users
```

### Para cambiar contraseñas (producción):
```bash
# 1. Edita backend/scripts/crear_usuarios.sql
# 2. Genera los hashes:
npm run db:generate-hashes
# 3. Copia los hashes al SQL y ejecuta:
npm run db:seed
```

## 🔐 Usuarios Actuales

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin_pro | admin123 | Administrador |
| secretaria_ana | secretaria123 | Secretaria |
| jefe_tecnico | jefe123 | Técnico Jefe |
| tecnico_juan | tecnico123 | Técnico |

## 📤 Para Subir a GitHub

1. **NO subir:**
   - `.env` (credenciales locales)
   - `node_modules/`
   - `postgres_data/`

2. **Sí subir:**
   - `backend/.env.example` (plantilla)
   - `backend/scripts/crear_usuarios.sql` (con contraseñas actualizadas)
   - `backend/scripts/generatePasswordHashes.js` (utilidad)
   - `CREDENTIALS.md` (documentación)
   - `QUICK_START.md` (guía de setup)
   - `backend/package.json` (con nuevos scripts)

## ✨ Ventajas de Esta Configuración

✅ Las credenciales de desarrollo son conocidas y documentadas
✅ Cualquiera que clone el repo puede hacer `npm run db:seed` y usar la app
✅ Fácil cambiar contraseñas para producción
✅ Los hashes se generan de forma segura (no almacenar contraseñas en texto plano en Git)
✅ Scripts de verificación para confirmar que todo está ok
✅ Plantilla `.env.example` para variables de entorno

---

**Para preguntas o ayuda:** Ver [CREDENTIALS.md](../CREDENTIALS.md) o [QUICK_START.md](../QUICK_START.md)
