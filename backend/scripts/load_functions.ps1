# Este script carga todas las funciones necesarias para el funcionamiento del sistema.
# Se ejecuta despues de sincronizar la estructura de la base de datos.
$ErrorActionPreference = "Stop"

$files = @(
  "scripts/modules/Seguridad.sql",
  "scripts/modules/Auditoria.sql",
  "scripts/modules/Secretaria/Facturacion.sql",
  "scripts/modules/Secretaria/Dashboard.sql",
  "scripts/modules/Secretaria/Garantias.sql",
  "scripts/modules/Secretaria/InventarioStock.sql",
  "scripts/modules/Secretaria/PaginacionIndices.sql",
  "scripts/modules/JefeTecnico/Indices.sql",
  "scripts/modules/admin_pro/00_schema.sql",
  "scripts/modules/admin_pro/01_reportes.sql",
  "scripts/modules/LegacyCleanup.sql"
)

$sql = ($files | ForEach-Object { Get-Content $_ -Raw }) -join "`n"
$sql | docker exec -i postgres_cte psql -v ON_ERROR_STOP=1 -U User_admin -d Centro_Tecnico_Electronico
