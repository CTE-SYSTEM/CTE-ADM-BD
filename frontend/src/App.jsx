import React, { Suspense, lazy, useState, useContext } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate, useLocation } from 'react-router-dom';
import useResponsiveLayout from './features/responsive/useResponsiveLayout';

// Componentes Globales
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PageHelp from './components/PageHelp';

// Contexto de Autenticación
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PersonalizacionProvider } from './features/personalizacion';

import './App.css';

// Las páginas se cargan bajo demanda para no inflar el JavaScript inicial.
const Login = lazy(() => import('./pages/Auth/Login'));

const AdminDashboard = lazy(() => import('./features/admin/pages/AdminDashboard'));
const UsuariosAvanzado = lazy(() => import('./features/admin/pages/UsuariosAvanzado'));
const EquiposAvanzado = lazy(() => import('./features/admin/pages/EquiposAvanzado'));
const OrdenesAvanzado = lazy(() => import('./features/admin/pages/OrdenesAvanzado'));
const InventarioAvanzado = lazy(() => import('./features/admin/pages/InventarioAvanzado'));
const FacturasAvanzado = lazy(() => import('./features/admin/pages/FacturasAvanzado'));
const GarantiasAvanzado = lazy(() => import('./features/admin/pages/GarantiasAvanzado'));
const HistorialEquipo = lazy(() => import('./features/admin/pages/HistorialEquipo'));
const HistorialRepuesto = lazy(() => import('./features/admin/pages/HistorialRepuesto'));
const RepuestosAvanzado = lazy(() => import('./features/admin/pages/RepuestosAvanzado'));
const ComprasAvanzado = lazy(() => import('./features/admin/pages/ComprasAvanzado'));
const RendimientoTecnicos = lazy(() => import('./features/admin/pages/RendimientoTecnicos'));
const OrdenesEstadoAvanzado = lazy(() => import('./features/admin/pages/OrdenesEstadoAvanzado'));
const DiagnosticosEstadoAvanzado = lazy(() => import('./features/admin/pages/DiagnosticosEstadoAvanzado'));
const ClientesAvanzado = lazy(() => import('./features/admin/pages/ClientesAvanzado'));
const Ganancias = lazy(() => import('./features/admin/pages/Ganancias'));
const FlujoAtencion = lazy(() => import('./pages/FlujoAtencion'));

const SecretariaDashboard = lazy(() => import('./features/secretaria/pages/SecretariaDashboard'));
const ClientesSecretaria = lazy(() => import('./features/secretaria/pages/Clientes'));
const EquiposSecretaria = lazy(() => import('./features/secretaria/pages/Equipos'));
const ProveedoresSecretaria = lazy(() => import('./features/secretaria/pages/Proveedores'));
const RepuestosSecretaria = lazy(() => import('./features/secretaria/pages/Repuestos'));
const TiposRepuestoSecretaria = lazy(() => import('./features/secretaria/pages/TiposRepuesto'));
const ComprasSecretaria = lazy(() => import('./features/secretaria/pages/Compras'));
const FacturacionSecretaria = lazy(() => import('./features/secretaria/pages/Facturacion'));
const Diagnostico = lazy(() => import('./features/secretaria/pages/Diagnostico'));
const NuevaOrden = lazy(() => import('./features/secretaria/pages/NuevaOrden'));

const TecnicoDashboard = lazy(() => import('./features/tecnico/pages/TecnicoDashboard'));
const JefeDashboard = lazy(() => import('./features/tecnicoJefe/pages/TecnicoJefeDashboard'));

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
        <main className={`flex-1 overflow-auto ${isAdminRoute ? 'admin-main' : ''}`}>
          <div className={`mx-auto w-full ${isAdminRoute ? 'admin-content' : ''}`}>
            <PageHelp />
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
  const responsive = useResponsiveLayout();

  return (
    <Suspense fallback={<RouteFallback />}>
      <div className={responsive.pageClassName}>{children}</div>
    </Suspense>
  );
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
            { path: 'admin/flujo-atencion', element: <RequireAuth><Page><FlujoAtencion /></Page></RequireAuth> },

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
            { path: 'secretaria/flujo-atencion', element: <RequireAuth><Page><FlujoAtencion /></Page></RequireAuth> },
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
