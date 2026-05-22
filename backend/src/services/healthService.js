import prisma from '../app/prismaClient.js';

export const getHealth = async () => {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: 'ok',
    database: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
};
