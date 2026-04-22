// src/controllers/ordenesController.js

export const getOrdenes = (req, res) => {
    res.json({ ok: true, message: 'Ruta ordenes funcionando' });
};

export const createOrden = (req, res) => {
    res.json({ ok: true, message: 'Orden creada' });
};