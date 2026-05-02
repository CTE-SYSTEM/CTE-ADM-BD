// server.js - Punto de entrada del backend
import 'dotenv/config';
import app from './app/app.js'; 
import './config/database.js'; 

// Importación de Rutas - Corregidas para que coincidan con tu estructura src/routes/
import authRoutes from './routes/modules/auth/auth.js';
import clientesRoutes from './routes/clientes.js';
import tecnicosRoutes from './routes/tecnicos.js';
import equiposRoutes from './routes/equipos.js';
import ordenesRoutes from './routes/ordenes.js';
import repuestosRoutes from './routes/repuestos.js';
import proveedoresRoutes from './routes/proveedores.js';
import comprasRoutes from './routes/compras.js';
import facturasRoutes from './routes/facturas.js';
import garantiasRoutes from './routes/garantias.js';

// RUTA CRÍTICA PARA SECRETARÍA
import diagnosticoRoutes from './routes/modules/secretaria/Diagnostico.js';

// Uso de Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/tecnicos', tecnicosRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/repuestos', repuestosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/garantias', garantiasRoutes);

// Uso de Rutas de Secretaría
app.use('/api/secretaria/diagnostico', diagnosticoRoutes);

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✅ Rutas de Diagnóstico listas en /api/secretaria/diagnostico`);
});