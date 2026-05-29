import { Prisma } from '@prisma/client';
import prisma from '../../app/prismaClient.js';

const toPascalCase = (value) => {
  if (!value || typeof value !== 'string') return value;

  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const listarEquipos = async () => {
  const rows = await prisma.$queryRaw(Prisma.sql`SELECT data FROM get_equipos_con_clientes()`);
  return rows.map((row) => row.data);
};

export const crearEquipo = async ({ cliente_id, tipo, marca, modelo, numero_serie }) => {
  const [row] = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM crear_equipo_proc(
      ${Number(cliente_id)}::int,
      ${toPascalCase(tipo)},
      ${marca || null},
      ${modelo || null},
      ${numero_serie || null}
    )
  `);

  return row?.data;
};

export const actualizarEquipo = async (id, { cliente_id, tipo, marca, modelo, numero_serie }) => {
  const [row] = await prisma.$queryRaw(Prisma.sql`
    SELECT data FROM actualizar_equipo_proc(
      ${Number(id)}::int,
      ${cliente_id ? Number(cliente_id) : null}::int,
      ${toPascalCase(tipo)},
      ${marca || null},
      ${modelo || null},
      ${numero_serie || null}
    )
  `);

  return row?.data;
};

export const eliminarEquipo = (id) =>
  prisma.$executeRaw(Prisma.sql`SELECT eliminar_equipo_proc(${Number(id)}::int)`);

export default {
  listarEquipos,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo,
};
