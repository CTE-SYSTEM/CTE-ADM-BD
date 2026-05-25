import React, { Suspense, lazy, useState, useContext } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate, useLocation } from 'react-router-dom';

// Componentes Globales
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Contexto de Autenticación
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PersonalizacionProvider } from './features/personalizacion';

import './App.css';

// Las páginas se cargan bajo demanda para no inflar el JavaScript inicial.
const Login = lazy(() => import('./pages/Auth/Login'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsuariosAvanzado = lazy(() => import('./pages/admin/UsuariosAvanzado'));
const EquiposAvanzado = lazy(() => import('./pages/admin/EquiposAvanzado'));
const OrdenesAvanzado = lazy(() => import('./pages/admin/OrdenesAvanzado'));
const InventarioAvanzado = lazy(() => import('./pages/admin/InventarioAvanzado'));
const FacturasAvanzado = lazy(() => import('./pages/admin/FacturasAvanzado'));
const GarantiasAvanzado = lazy(() => import('./pages/admin/GarantiasAvanzado'));
const HistorialEquipo = lazy(() => import('./pages/admin/HistorialEquipo'));
const HistorialRepuesto = lazy(() => import('./pages/admin/HistorialRepuesto'));
const RepuestosAvanzado = lazy(() => import('./pages/admin/RepuestosAvanzado'));
const ComprasAvanzado = lazy(() => import('./pages/admin/ComprasAvanzado'));
const RendimientoTecnicos = lazy(() => import('./pages/admin/RendimientoTecnicos'));
const OrdenesEstadoAvanzado = lazy(() => import('./pages/admin/OrdenesEstadoAvanzado'));
const DiagnosticosEstadoAvanzado = lazy(() => import('./pages/admin/DiagnosticosEstadoAvanzado'));
const ClientesAvanzado = lazy(() => import('./pages/admin/ClientesAvanzado'));
const Ganancias = lazy(() => import('./pages/admin/Ganancias'));

const SecretariaDashboard = lazy(() => import('./pages/Secretaria/SecretariaDashboard'));
const ClientesSecretaria = lazy(() => import('./pages/Secretaria/Clientes'));
const EquiposSecretaria = lazy(() => import('./pages/Secretaria/Equipos'));
const ProveedoresSecretaria = lazy(() => import('./pages/Secretaria/Proveedores'));
const RepuestosSecretaria = lazy(() => import('./pages/Secretaria/Repuestos'));
const TiposRepuestoSecretaria = lazy(() => import('./pages/Secretaria/TiposRepuesto'));
const ComprasSecretaria = lazy(() => import('./pages/Secretaria/Compras'));
const FacturacionSecretaria = lazy(() => import('./pages/Secretaria/Facturacion'));
const Diagnostico = lazy(() => import('./pages/Secretaria/Diagnostico'));
const NuevaOrden = lazy(() => import('./pages/Secretaria/NuevaOrden'));

const TecnicoDashboard = lazy(() => import('./pages/Tecnico/TecnicoDashboard'));
const JefeDashboard = lazy(() => import('./pages/TecnicoJefe/TecnicoJefeDashboard'));

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const isAdminRoute = location.pathname === '/' || location.pathname.startsWith('/admin');
  const toggleSidebar = () => setSidebarOpen((s) => !s);

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar open={sidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className={`flex-1 overflow-auto ${isAdminRoute ? 'admin-main' : 'p-6'}`}>
          <div className={`mx-auto w-full ${isAdminRoute ? 'admin-content' : 'max-w-7xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center text-sm font-semibold text-gray-500">
      Cargando...
    </div>
  );
}

function Page({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      ),
      children: [
        { path: 'login', element: <Page><Login /></Page> },

        // 1. RUTAS CON SIDEBAR Y NAVBAR GLOBAL
        {
          element: <MainLayout />,
          children: [
            // Admin
            { index: true, element: <RequireAuth><Page><AdminDashboard /></Page></RequireAuth> },
            { path: 'admin', element: <RequireAuth><Page><AdminDashboard /></Page></RequireAuth> },
            { path: 'admin/usuarios', element: <RequireAuth><Page><UsuariosAvanzado /></Page></RequireAuth> },
            { path: 'admin/equipos', element: <RequireAuth><Page><EquiposAvanzado /></Page></RequireAuth> },
            { path: 'admin/ordenes', element: <RequireAuth><Page><OrdenesAvanzado /></Page></RequireAuth> },
            { path: 'admin/repuestos', element: <RequireAuth><Page><RepuestosAvanzado /></Page></RequireAuth> },
            { path: 'admin/compras', element: <RequireAuth><Page><ComprasAvanzado /></Page></RequireAuth> },
            { path: 'admin/ganancias', element: <RequireAuth><Page><Ganancias /></Page></RequireAuth> },
            { path: 'admin/tecnicos', element: <RequireAuth><Page><RendimientoTecnicos /></Page></RequireAuth> },
            { path: 'admin/clientes', element: <RequireAuth><Page><ClientesAvanzado /></Page></RequireAuth> },
            { path: 'admin/inventario', element: <RequireAuth><Page><InventarioAvanzado /></Page></RequireAuth> },
            { path: 'admin/visualizacion-control-facturas', element: <RequireAuth><Page><FacturasAvanzado /></Page></RequireAuth> },
            { path: 'admin/facturacion', element: <RequireAuth><Page><FacturasAvanzado /></Page></RequireAuth> },
            { path: 'admin/ordenes-estado', element: <RequireAuth><Page><OrdenesEstadoAvanzado /></Page></RequireAuth> },
            { path: 'admin/diagnosticos', element: <RequireAuth><Page><DiagnosticosEstadoAvanzado /></Page></RequireAuth> },
            { path: 'admin/garantias', element: <RequireAuth><Page><GarantiasAvanzado /></Page></RequireAuth> },
            { path: 'admin/historial-equipo', element: <RequireAuth><Page><HistorialEquipo /></Page></RequireAuth> },
            { path: 'admin/historial-repuesto', element: <RequireAuth><Page><HistorialRepuesto /></Page></RequireAuth> },

            // Secretaria
            { path: 'secretaria', element: <RequireAuth><Page><SecretariaDashboard /></Page></RequireAuth> },
            { path: 'secretaria/clientes', element: <RequireAuth><Page><ClientesSecretaria /></Page></RequireAuth> },
            { path: 'secretaria/equipos', element: <RequireAuth><Page><EquiposSecretaria /></Page></RequireAuth> },
            { path: 'secretaria/proveedores', element: <RequireAuth><Page><ProveedoresSecretaria /></Page></RequireAuth> },
            { path: 'secretaria/repuestos', element: <RequireAuth><Page><RepuestosSecretaria /></Page></RequireAuth> },
            { path: 'secretaria/tipos-repuesto', element: <RequireAuth><Page><TiposRepuestoSecretaria /></Page></RequireAuth> },
            { path: 'secretaria/compras', element: <RequireAuth><Page><ComprasSecretaria /></Page></RequireAuth> },
            { path: 'secretaria/facturacion', element: <RequireAuth><Page><FacturacionSecretaria /></Page></RequireAuth> },
            { path: 'secretaria/nueva-orden', element: <RequireAuth><Page><NuevaOrden /></Page></RequireAuth> },
            { path: 'secretaria/diagnostico', element: <RequireAuth><Page><Diagnostico /></Page></RequireAuth> },
          ],
        },

        // 2. RUTAS INDEPENDIENTES (Sin Sidebar Global)
        // Los dashboards tecnicos ya traen su propio Header integrado
        {
          path: 'tecnico',
          element: <RequireAuth><Page><TecnicoDashboard /></Page></RequireAuth>
        },
        {
          path: 'tecnico-jefe',
          element: <RequireAuth><Page><JefeDashboard /></Page></RequireAuth>
        },
      ],
      future: { v7_startTransition: true, v7_relativeSplatPath: true }
    },
  ]
);

function App() {
  return (
    <PersonalizacionProvider>
      <RouterProvider router={router} />
    </PersonalizacionProvider>
  );
}

function RequireAuth({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default App;
