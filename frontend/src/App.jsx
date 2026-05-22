import React, { useState, useContext } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate, useLocation } from 'react-router-dom';

// Componentes Globales
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Contexto de Autenticación
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PersonalizacionProvider } from './features/personalizacion';

// Páginas de Auth
import Login from './pages/Auth/Login';

// --- SECCIÓN ADMINISTRADOR ---
import AdminDashboard from './pages/admin/AdminDashboard';
import UsuariosAvanzado from './pages/admin/UsuariosAvanzado';
import EquiposAvanzado from './pages/admin/EquiposAvanzado';
import OrdenesAvanzado from './pages/admin/OrdenesAvanzado';
import InventarioAvanzado from './pages/admin/InventarioAvanzado';
import FacturasAvanzado from './pages/admin/FacturasAvanzado';
import GarantiasAvanzado from './pages/admin/GarantiasAvanzado';
import HistorialEquipo from './pages/admin/HistorialEquipo';
import HistorialRepuesto from './pages/admin/HistorialRepuesto';
import RepuestosAvanzado from './pages/admin/RepuestosAvanzado';
import ComprasAvanzado from './pages/admin/ComprasAvanzado';
import RendimientoTecnicos from './pages/admin/RendimientoTecnicos';
import OrdenesEstadoAvanzado from './pages/admin/OrdenesEstadoAvanzado';
import DiagnosticosEstadoAvanzado from './pages/admin/DiagnosticosEstadoAvanzado';
import ClientesAvanzado from './pages/admin/ClientesAvanzado';
import Ganancias from './pages/admin/Ganancias';

// --- SECCIÓN SECRETARIA ---
import SecretariaDashboard from './pages/Secretaria/SecretariaDashboard';
import ClientesSecretaria from './pages/Secretaria/Clientes';
import EquiposSecretaria from './pages/Secretaria/Equipos';
import ProveedoresSecretaria from './pages/Secretaria/Proveedores';
import RepuestosSecretaria from './pages/Secretaria/Repuestos';
import TiposRepuestoSecretaria from './pages/Secretaria/TiposRepuesto';
import ComprasSecretaria from './pages/Secretaria/Compras';
import FacturacionSecretaria from './pages/Secretaria/Facturacion';
import Diagnostico from './pages/Secretaria/Diagnostico';
import NuevaOrden from './pages/Secretaria/Nuevaorden'; 

// --- SECCIÓN TÉCNICOS ---
import TecnicoDashboard from './pages/Tecnico/TecnicoDashboard'; 
import JefeDashboard from './pages/TecnicoJefe/TecnicoJefeDashboard';

import './App.css';

function MainLayout({ sidebarOpen, onToggleSidebar }) {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/' || location.pathname.startsWith('/admin');

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar open={sidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={onToggleSidebar} />
        <main className={`flex-1 overflow-auto ${isAdminRoute ? 'admin-main' : 'p-6'}`}>
          <div className={`mx-auto w-full ${isAdminRoute ? 'admin-content' : 'max-w-7xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((s) => !s);

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
          { path: 'login', element: <Login /> },

          // 1. RUTAS CON SIDEBAR Y NAVBAR GLOBAL
          {
            element: <MainLayout sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />,
            children: [
              // Admin
              { index: true, element: <RequireAuth><AdminDashboard /></RequireAuth> },
              { path: 'admin', element: <RequireAuth><AdminDashboard /></RequireAuth> },
              { path: 'admin/usuarios', element: <RequireAuth><UsuariosAvanzado /></RequireAuth> },
              { path: 'admin/equipos', element: <RequireAuth><EquiposAvanzado /></RequireAuth> },
              { path: 'admin/ordenes', element: <RequireAuth><OrdenesAvanzado /></RequireAuth> },
              { path: 'admin/repuestos', element: <RequireAuth><RepuestosAvanzado /></RequireAuth> },
              { path: 'admin/compras', element: <RequireAuth><ComprasAvanzado /></RequireAuth> },
              { path: 'admin/ganancias', element: <RequireAuth><Ganancias /></RequireAuth> },
              { path: 'admin/tecnicos', element: <RequireAuth><RendimientoTecnicos /></RequireAuth> },
              { path: 'admin/clientes', element: <RequireAuth><ClientesAvanzado /></RequireAuth> },
              { path: 'admin/inventario', element: <RequireAuth><InventarioAvanzado /></RequireAuth> },
              { path: 'admin/visualizacion-control-facturas', element: <RequireAuth><FacturasAvanzado /></RequireAuth> },
              { path: 'admin/facturacion', element: <RequireAuth><FacturasAvanzado /></RequireAuth> },
              { path: 'admin/ordenes-estado', element: <RequireAuth><OrdenesEstadoAvanzado /></RequireAuth> },
              { path: 'admin/diagnosticos', element: <RequireAuth><DiagnosticosEstadoAvanzado /></RequireAuth> },
              { path: 'admin/garantias', element: <RequireAuth><GarantiasAvanzado /></RequireAuth> },
              { path: 'admin/historial-equipo', element: <RequireAuth><HistorialEquipo /></RequireAuth> },
              { path: 'admin/historial-repuesto', element: <RequireAuth><HistorialRepuesto /></RequireAuth> },

              // Secretaria
              { path: 'secretaria', element: <RequireAuth><SecretariaDashboard /></RequireAuth> },
              { path: 'secretaria/clientes', element: <RequireAuth><ClientesSecretaria /></RequireAuth> },
              { path: 'secretaria/equipos', element: <RequireAuth><EquiposSecretaria /></RequireAuth> },
              { path: 'secretaria/proveedores', element: <RequireAuth><ProveedoresSecretaria /></RequireAuth> },
              { path: 'secretaria/repuestos', element: <RequireAuth><RepuestosSecretaria /></RequireAuth> },
              { path: 'secretaria/tipos-repuesto', element: <RequireAuth><TiposRepuestoSecretaria /></RequireAuth> },
              { path: 'secretaria/compras', element: <RequireAuth><ComprasSecretaria /></RequireAuth> },
              { path: 'secretaria/facturacion', element: <RequireAuth><FacturacionSecretaria /></RequireAuth> },
              { path: 'secretaria/nueva-orden', element: <RequireAuth><NuevaOrden /></RequireAuth> },
              { path: 'secretaria/diagnostico', element: <RequireAuth><Diagnostico /></RequireAuth> },
            ],
          },

          // 2. RUTAS INDEPENDIENTES (Sin Sidebar Global)
          // Los dashboards tecnicos ya traen su propio Header integrado
          {
            path: 'tecnico',
            element: <RequireAuth><TecnicoDashboard /></RequireAuth>
          },
          { 
            path: 'tecnico-jefe', 
            element: <RequireAuth><JefeDashboard /></RequireAuth> 
          },
        ],
        future: { v7_startTransition: true, v7_relativeSplatPath: true }
      },
    ]
  );

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
