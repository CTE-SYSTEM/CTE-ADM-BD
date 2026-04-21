const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('../generated/prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.ADMIN_USER || 'admin@local';
  const password = process.env.ADMIN_PASS || 'Admin123!';

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: { password: hashed, role: 'ADMIN' },
    create: { username, password: hashed, role: 'ADMIN' },
  });

  console.log('Admin user created/updated:', username);
  console.log('Password (plaintext shown for dev only):', process.env.ADMIN_PASS || 'Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
