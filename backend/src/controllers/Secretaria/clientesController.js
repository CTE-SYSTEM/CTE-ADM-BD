// backend/src/controllers/Secretaria/clientesController.js
import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';

/** Obtener todos los clientes activos */
export const getClientes = async (req, res) => {
  try {
    const clientes = await prisma.$queryRaw(Prisma.sql`SELECT * FROM get_clientes_activos()`);
    res.json({ data: clientes });
  } catch (error) {
    console.error('❌ Error en getClientes:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener clientes', details: error.message });
  }
};

/** Crear un nuevo cliente */
export const createCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo, contacto_secundario } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!telefono) return res.status(400).json({ error: 'El teléfono es obligatorio' });

    const [resultado] = await prisma.$queryRaw(Prisma.sql`
      SELECT * FROM crear_cliente_proc(${nombre}, ${telefono || null}, ${direccion || null}, ${correo || null}, ${contacto_secundario || null})
    `);
    res.status(201).json({ data: resultado });
  } catch (error) {
    console.error('❌ Error en createCliente:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error al registrar el cliente', details: error.message });
  }
};

/** Actualizar un cliente existente */
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, direccion, correo, contacto_secundario } = req.body;

    const [resultado] = await prisma.$queryRaw(Prisma.sql`
      SELECT * FROM actualizar_cliente_proc(${Number(id)}, ${nombre}, ${telefono || null}, ${direccion || null}, ${correo || null}, ${contacto_secundario || null})
    `);

    if (!resultado) return res.status(404).json({ error: 'Cliente no encontrado' });

    res.json({ data: resultado });
  } catch (error) {
    console.error('❌ Error en updateCliente:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar el cliente', details: error.message });
  }
};

/** Borrado lógico (Desactivar) */
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$executeRaw(Prisma.sql`SELECT desactivar_cliente_proc(${Number(id)})`);
    
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error en deleteCliente:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.status(500).json({ error: 'Error al desactivar el cliente', details: error.message });
  }
};
