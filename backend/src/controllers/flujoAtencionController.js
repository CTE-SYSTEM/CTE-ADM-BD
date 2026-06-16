import flujoAtencionService from '../services/flujoAtencionService.js';

export const getFlujoAtencion = async (req, res) => {
  try {
    const result = await flujoAtencionService.obtenerFlujoAtencion({
      filtro: req.query.filtro || 'todos',
      search: req.query.search || '',
    });

    res.json({ data: result.data, meta: { resumen: result.resumen } });
  } catch (error) {
    console.error('Error al obtener flujo de atencion:', error);
    res.status(500).json({ error: 'Error al obtener flujo de atencion', details: error.message });
  }
};

export default {
  getFlujoAtencion,
};
