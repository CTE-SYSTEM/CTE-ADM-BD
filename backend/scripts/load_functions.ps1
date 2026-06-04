# Este script carga todas las funciones necesarias para el funcionamiento del sistema.
# Se ejecuta despues de sincronizar la estructura de la base de datos.
$ErrorActionPreference = "Stop"

$files = @(
  "scripts/modules/Seguridad.sql",
  "scripts/modules/Auditoria.sql",
  "scripts/modules/Secretaria/Clientes.sql",
  "scripts/modules/Secretaria/Equipo.sql",
  "scripts/modules/Secretaria/Diagnostico.sql",
  "scripts/modules/Secretaria/Compras.sql",
  "scripts/modules/Secretaria/Facturacion.sql",
  "scripts/modules/Secretaria/Dashboard.sql",
  "scripts/modules/Secretaria/Nuevaorden.sql",
  "scripts/modules/Secretaria/Garantias.sql",
  "scripts/modules/Secretaria/Proveedores.sql",
  "scripts/modules/Secretaria/Repuesto.sql",
  "scripts/modules/Secretaria/InventarioStock.sql",
  "scripts/modules/JefeTecnico/Diagnostico.sql",
  "scripts/modules/Tecnico/01_consultas.sql",
  "scripts/modules/Tecnico/02_acciones.sql",
  "scripts/modules/admin_pro/00_schema.sql",
  "scripts/modules/admin_pro/01_reportes.sql",
  "scripts/modules/admin_pro/02_editar.sql"
)

$sql = ($files | ForEach-Object { Get-Content $_ -Raw }) -join "`n"
$sql | docker exec -i postgres_cte psql -v ON_ERROR_STOP=1 -U User_admin -d Centro_Tecnico_Electronico
