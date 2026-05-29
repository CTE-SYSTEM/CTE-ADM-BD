import flujoAtencionService from '../services/flujoAtencionService.js';

export const getFlujoAtencion = async (req, res) => {
  try {
    const data = await flujoAtencionService.obtenerFlujoAtencion({
      filtro: req.query.filtro || 'todos',
      search: req.query.search || '',
    });

    const resumen = data.reduce((acc, item) => {
      acc[item.filtro] = (acc[item.filtro] || 0) + 1;
      acc.todos += 1;
      return acc;
    }, { todos: 0 });

    res.json({ data, meta: { resumen } });
  } catch (error) {
    console.error('Error al obtener flujo de atencion:', error);
    res.status(500).json({ error: 'Error al obtener flujo de atencion', details: error.message });
  }
};

export default {
  getFlujoAtencion,
};
