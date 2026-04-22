// controllers/tecnicosController.js
// Exportamos cada función individualmente
export const getTecnicos = (req, res) => {
    res.json({ ok: true, message: 'Ruta tecnicos funcionando' });
};

export const createTecnico = (req, res) => {
    res.json({ ok: true, message: 'Tecnico creado' });
};