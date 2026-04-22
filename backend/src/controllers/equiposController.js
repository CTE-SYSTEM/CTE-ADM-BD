// src/controllers/equiposController.js
import prisma from '../app/prismaClient.js';

export const getEquipos = async (req, res) => {
    try {
        // Usamos 'equipos' en plural para coincidir con tu schema.prisma
        const equipos = await prisma.equipos.findMany();
        res.json({ ok: true, data: equipos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener equipos' });
    }
};

export const createEquipo = async (req, res) => {
    try {
        const data = req.body;
        const equipo = await prisma.equipos.create({ data });
        res.status(201).json({ ok: true, data: equipo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear equipo' });
    }
};