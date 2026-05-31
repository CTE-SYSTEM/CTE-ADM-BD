// para dashboard secretaria
// backend/src/routes/modules/secretaria/Secretaria.js
import express from 'express';
const router = express.Router();

// Importamos las rutas específicas de Secretaría
import clientesRoutes from './Clientes.js';
import equiposRoutes from './Equipos.js';
import comprasRoutes from './Compras.js';
import facturasRoutes from './facturas.js';
import garantiasRoutes from './garantias.js';
import diagnosticoRoutes from './Diagnostico.js';
import NuevaOrden from './NuevaOrden.js';

// Usamos las rutas específicas de Secretaría
router.use('/clientes', clientesRoutes);
router.use('/equipos', equiposRoutes);
router.use('/NuevaOrden', NuevaOrden);
router.use('/compras', comprasRoutes);
router.use('/facturas', facturasRoutes);
router.use('/garantias', garantiasRoutes);
router.use('/diagnostico', diagnosticoRoutes);

export default router;
