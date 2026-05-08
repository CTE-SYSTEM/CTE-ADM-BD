# 🗄️ Gestión de la Base de Datos - Proyecto CTE

El sistema utiliza **PostgreSQL** como motor de base de datos principal, gestionado a través de **Prisma ORM**. Para facilitar la administración, se han integrado dos herramientas clave que permiten interactuar con los datos de forma visual.

---

### 1. Prisma Studio (Explorador de Datos Rápido)
Esta es la herramienta más ágil para visualizar, crear, editar o eliminar registros de las tablas mediante una interfaz tipo hoja de cálculo. 

Como el proyecto corre bajo Docker, es necesario ejecutar el servicio dentro del contenedor del backend para que tenga acceso al esquema y a la red interna:

**Pasos para iniciar el explorador:**

1.  **Entrar a la terminal del contenedor:**
    ```bash
    docker exec -it backend_cte sh
    ```

2.  **Lanzar el servidor de Prisma Studio:**
    ```bash
    npx prisma studio --port 5555 --browser none --hostname 0.0.0.0
    ```

3.  **Acceso Web:** Abre tu navegador en: [http://localhost:5555](http://localhost:5555)

---

### 2. pgAdmin 4 (Administración Profesional y Diagramas ER)
Se utiliza para tareas de administración avanzada, mantenimiento de tablas y generación de diagramas entidad-relación (ERD).

* **URL de acceso:** [http://localhost:8080](http://localhost:8080)
* **Credenciales de acceso al panel:**
    * **Usuario:** `sadiel@admin.com`
    * **Contraseña:** `admin`

**Configuración de la conexión al servidor de DB:**

Al entrar por primera vez, debes registrar el servidor de la base de datos con los siguientes parámetros:

| Campo | Valor |
| :--- | :--- |
| **Name (General)** | `CTE-DB` |
| **Host name/address** | `db` |
| **Port** | `5432` |
| **Maintenance database** | `Centro_Tecnico_Electronico` |
| **Username** | `User_admin` |
| **Password** | `TuPasswordSeguro123!` |

> [!TIP]
> **Para ver el modelo de datos visual:** Haz clic derecho sobre la base de datos `Centro_Tecnico_Electronico` en el panel izquierdo y selecciona la opción **ERD Tool**. Esto generará automáticamente el diagrama con todas las relaciones y llaves foráneas.

### 3. 👥 Carga de Usuarios y Credenciales

El sistema viene con 4 usuarios por defecto listos para usar. Las credenciales están almacenadas en la base de datos con hashes seguros.

**Después de iniciar Docker (`docker compose up -d`), carga los usuarios con:**

```bash
npm run db:seed
```

O manualmente:
```bash
docker exec -i postgres_cte psql -U User_admin -d Centro_Tecnico_Electronico < scripts/Seed_data.sql
```

**Usuarios disponibles:**

| Usuario | Rol | Contraseña |
|---------|-----|-----------|
| `admin_pro` | Administrador | `1234` |
| `secretaria_ana` | Secretaria | `1234` |
| `jefe_tecnico` | Técnico Jefe | `1234` |
| `tecnico_juan` | Técnico | `1234` |

**Verificar que los usuarios se crearon correctamente:**

```bash
npm run db:check:users
```

O manualmente:
```bash
docker exec -i postgres_cte psql -U User_admin -d Centro_Tecnico_Electronico -c 'SELECT id_usuario, nombre_usuario, rol, activo FROM "Usuarios";'
```

> [!IMPORTANT]
> **Para producción:** Reemplaza estas contraseñas por contraseñas seguras en `scripts/crear_usuarios.sql` y regenera los hashes con `npm run db:generate-hashes`.

---

**Comandos útiles de base de datos:**

- Ver todos los usuarios: `npm run db:check:users`
- Ver clientes: `npm run db:check:clientes`
- Ver técnicos: `npm run db:check:tecnicos`
- Generar hashes de contraseña: `npm run db:generate-hashes`
- Cargar usuarios desde script: `npm run db:seed`

> [!NOTE]
> Para más información sobre credenciales y configuración, ver [CREDENTIALS.md](../CREDENTIALS.md) en la raíz del proyecto.