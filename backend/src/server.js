// server.js - Punto de entrada del backend
import 'dotenv/config';
import app from './app/app.js'; // IMPORTANTE: Agregamos el .js al final

// Importación de Rutas
// En modo "module", Node necesita la ruta completa con extensión .js
import authRoutes from './routes/modules/auth/auth.js';
import clientesRoutes from './routes/clientes.js';
import tecnicosRoutes from './routes/tecnicos.js';
import equiposRoutes from './routes/equipos.js';
import ordenesRoutes from './routes/ordenes.js';
import repuestosRoutes from './routes/repuestos.js';
import proveedoresRoutes from './routes/proveedores.js';
import facturasRoutes from './routes/facturas.js';
import garantiasRoutes from './routes/garantias.js';

// Uso de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/tecnicos', tecnicosRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/repuestos', repuestosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/garantias', garantiasRoutes);

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));