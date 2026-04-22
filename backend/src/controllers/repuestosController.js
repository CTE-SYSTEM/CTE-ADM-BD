// controllers/repuestosController.js

export const getRepuestos = (req, res) => {
    res.json({ ok: true, message: 'Ruta repuestos funcionando' });
};

export const createRepuesto = (req, res) => {
    res.json({ ok: true, message: 'Repuesto creado' });
};