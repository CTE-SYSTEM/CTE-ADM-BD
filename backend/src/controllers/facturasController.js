// controllers/facturasController.js
// Usamos export const para que la ruta los encuentre
export const getFacturas = (req, res) => {
    res.json({ ok: true, message: 'Ruta facturas funcionando' });
};

export const createFactura = (req, res) => {
    res.json({ ok: true, message: 'Factura creada' });
};