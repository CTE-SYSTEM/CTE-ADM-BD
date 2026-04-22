// Controlador para Clientes
import prisma from '../app/prismaClient.js'; // Cambio a import y agregamos .js

export const getClientes = async (req, res) => {
    try {
        // Ajustado a 'Clientes' (como está en tu schema.prisma)
        const clientes = await prisma.clientes.findMany();
        res.json({ ok: true, data: clientes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
};

export const createCliente = async (req, res) => {
    try {
        const data = req.body;
        // Ajustado a 'Clientes'
        const cliente = await prisma.clientes.create({ data });
        res.status(201).json({ ok: true, data: cliente });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
};