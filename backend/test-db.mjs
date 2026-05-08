import prisma from './src/app/prismaClient.js';

const test = async () => {
  try {
    const result = await prisma.clientes.findMany();
    console.log(' Conexión OK: todo good klk', result.length, 'clientes encontrados');
  } catch(e) {
    console.error('✗ Error de conexión:', e.message);
  } finally {
    await prisma.$disconnect();
  }
};

test();
