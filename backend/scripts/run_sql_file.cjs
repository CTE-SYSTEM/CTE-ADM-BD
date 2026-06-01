const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const file = process.argv[2];
  const connectionString = process.env.SQL_DATABASE_URL || process.env.DATABASE_URL;

  if (!file) {
    throw new Error('Uso: node scripts/run_sql_file.cjs <archivo.sql>');
  }

  if (!connectionString) {
    throw new Error('Define SQL_DATABASE_URL o DATABASE_URL antes de ejecutar.');
  }

  const sqlPath = path.resolve(process.cwd(), file);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const needsSsl = /sslmode=require|neon\.tech/i.test(connectionString);
  const client = new Client({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  try {
    await client.query(sql);
    const counts = await client.query(`
      SELECT
        (SELECT count(*)::int FROM "Clientes") AS clientes,
        (SELECT count(*)::int FROM "Equipos") AS equipos,
        (SELECT count(*)::int FROM "Proveedores") AS proveedores,
        (SELECT count(*)::int FROM "Repuestos") AS repuestos,
        (SELECT count(*)::int FROM "Compras") AS compras
    `);
    console.log(JSON.stringify(counts.rows[0]));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
