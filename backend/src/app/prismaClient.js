// src/app/prismaClient.js
// prismaClient.js - Singleton para la instancia de Prisma
import { PrismaClient } from '@prisma/client';

// No le pases NADA al constructor.
// Prisma leerá el .env directamente desde el shell.
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

export default prisma;