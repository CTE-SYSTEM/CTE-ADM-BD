import prisma from './src/app/prismaClient.js';

(async () => {
  try {
    const equipos = await prisma.equipos.count();
    const diagnosticos = await prisma.diagnosticos.count();
    const ordenes = await prisma.ordenes.count();
    const facturas = await prisma.facturas.count();
    const garantias = await prisma.garantias.count();
    console.log({ equipos, diagnosticos, ordenes, facturas, garantias });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
})();
