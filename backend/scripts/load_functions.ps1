$ErrorActionPreference = "Stop"

$files = @(
  "scripts/modules/Secretaria/Clientes.sql",
  "scripts/modules/Secretaria/Equipo.sql",
  "scripts/modules/Secretaria/Diagnostico.sql",
  "scripts/modules/Secretaria/Compras.sql",
  "scripts/modules/Secretaria/Proveedores.sql",
  "scripts/modules/Secretaria/Repuesto.sql",
  "scripts/modules/JefeTecnico/Diagnostico.sql"
)

$sql = ($files | ForEach-Object { Get-Content $_ -Raw }) -join "`n"
$sql | docker exec -i postgres_cte psql -v ON_ERROR_STOP=1 -U User_admin -d Centro_Tecnico_Electronico
