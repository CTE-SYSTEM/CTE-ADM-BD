import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import './config/database.js'; 

const app = express();

// --- 1. CONFIGURACIÓN DE MIDDLEWARES ---
// Morgan para ver las peticiones en la consola del terminal
app.use(morgan('dev'));

// CORS: Permite que tu frontend (Vite) se comunique con el backend
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// VITAL: Estos dos permiten que Express lea el cuerpo (body) de los JSON que envías
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 2. IMPORTACIÓN DE RUTAS ---
// Rutas de autenticación (login, registro, etc.)
import authRoutes from './routes/auth/auth.js';

// Rutas de módulos específicos (Secretaria)
import clientesRoutes from './routes/modules/secretaria/clientes.js';
import tecnicosRoutes from './routes/modules/Tecnico/tecnicos.js';
import equiposRoutes from './routes/modules/secretaria/equipos.js';
import createOrden from './routes/modules/secretaria/NuevaOrden.js';
import repuestosRoutes from './routes/modules/secretaria/Repuesto.js';
import proveedoresRoutes from './routes/modules/secretaria/Proveedores.js';
import comprasRoutes from './routes/modules/secretaria/compras.js';
import facturasRoutes from './routes/modules/secretaria/facturas.js';
import garantiasRoutes from './routes/modules/secretaria/garantias.js';
import diagnosticoRoutes from './routes/modules/secretaria/Diagnostico.js';

// Rutas de módulos específicos (Jefe Técnico)
import diagnosticoRoutesJefe from './routes/modules/JefeTecnico/Diagnostico.js';

// Rutas de módulos específicos (Admin Pro)
import adminProRoutes from './routes/modules/admin_pro/adminPro.js';

// --- 3. USO DE RUTAS (API) ---
// ruta de autenticación
app.use('/api/auth', authRoutes);

// -- Para secretaria (clientes, técnicos, equipos, órdenes, repuestos, proveedores, compras, facturas, garantías)
app.use('/api/clientes', clientesRoutes);
app.use('/api/tecnicos', tecnicosRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/ordenes', createOrden);
app.use('/api/repuestos', repuestosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/garantias', garantiasRoutes);
app.use('/api/secretaria/diagnostico', diagnosticoRoutes);

// -- Para jefe técnico (diagnósticos)
app.use('/api/diagnosticos', diagnosticoRoutesJefe);

// -- Para admin pro (monitoreo y administración)
app.use('/api/admin_pro', adminProRoutes);

// Ruta raíz de backend: ayuda a quienes abren localhost:5000 directamente
app.get('/', (req, res) => {
    res.send('Este es el backend. El frontend corre en http://localhost:5173. Usa /api para las rutas de la API.');
});

// --- 4. MANEJO DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
    console.error("❌ Error interno:", err.stack);
    res.status(500).json({ message: 'Algo salió mal en el servidor', error: err.message });
});

// --- 5. ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 5000;

// IMPORTANTE: Escuchar en '0.0.0.0' para que Docker exponga el servicio correctamente
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n ==========================================`);
    console.log(`   SERVIDOR CORRIENDO EN: http://localhost:${PORT}`);
    console.log(`   MODO: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   SISTEMA: Centro Técnico Electrónico`);
    console.log(`   ==========================================\n`);
});
