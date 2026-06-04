import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Ajustamos las rutas eliminando '../' porque 'scripts' está en la raíz de 'backend'
  // También verificamos nombres (ej: 'Equipo.sql' en vez de 'equipos.sql' según tu imagen)
  const sqlFiles = [
    'scripts/modules/Secretaria/Clientes.sql',
    'scripts/modules/Secretaria/Compras.sql',
    'scripts/modules/Secretaria/Diagnostico.sql',
    'scripts/modules/Secretaria/Equipo.sql', 
    'scripts/modules/Secretaria/Facturacion.sql',
    'scripts/modules/Secretaria/Dashboard.sql',
    'scripts/modules/Secretaria/Garantias.sql',
    'scripts/modules/Secretaria/Nuevaorden.sql',
    'scripts/modules/Secretaria/Proveedores.sql',
    'scripts/modules/Secretaria/Repuesto.sql',
    'scripts/modules/Secretaria/InventarioStock.sql',
    'scripts/modules/JefeTecnico/Diagnostico.sql'
  ];

  console.log('--- Iniciando carga de base de datos ---');
  console.log('Directorio actual:', process.cwd());

  for (const filePath of sqlFiles) {
    const fullPath = path.resolve(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Separamos por punto y coma, pero con cuidado de no romper las funciones
        // Una forma sencilla es buscar el final de los bloques de función
        const statements = content
          .split(/;(?=(?:[^$]*\$\$[^$]*\$\$)*[^$]*$)/) 
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          await prisma.$executeRawUnsafe(statement);
        }
        
        console.log(`✅ Cargado: ${path.basename(filePath)}`);
      } catch (err) {
        console.error(`❌ Error en ${path.basename(filePath)}:`, err.message);
      }
    } else {
      console.warn(`⚠️ Archivo no encontrado: ${fullPath}`);
    }
  }

  console.log('--- Proceso de carga finalizado ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
