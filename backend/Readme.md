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

### 3. creacion de usuarios

> **los comando para asi dar o meter datos a usuarios desde el script de sql**
> Get-Content backend/scripts/crear_usuarios.sql -Raw | docker exec -i postgres_cte psql -U User_admin -d Centro_Tecnico_Electronico

> **Para verificar si los usuarios se crearon correctamente sin entrar a herramientas gráficas:**
>docker exec -i postgres_cte psql -U User_admin -d Centro_Tecnico_Electronico -c --% "SELECT * FROM \"Usuarios\";"

> **para hacerlo manualmente**
> docker exec -it postgres_cte psql -U User_admin -d Centro_Tecnico_Electronico
Nota: Una vez dentro, escribe SELECT * FROM "Usuarios"; (recuerda el punto y coma ;) y usa \q para salir.

**Nombres de perfiles y su contraseña**

# admin_pro
# secretarian_ana
# jefe_tecnico
# tecnico_juan

**contraseña de todos**

> 1234