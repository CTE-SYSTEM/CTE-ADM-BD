// controllers/proveedoresController.js
// Exportamos cada función para que la ruta pueda "verlas"
export const getProveedores = (req, res) => {
    res.json({ ok: true, message: 'Ruta proveedores funcionando' });
};

export const createProveedor = (req, res) => {
    res.json({ ok: true, message: 'Proveedor creado' });
};