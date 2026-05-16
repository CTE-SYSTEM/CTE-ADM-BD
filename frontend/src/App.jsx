import React, { useState, useContext } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';

// Componentes Globales
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Contexto de Autenticación
import { AuthProvider, AuthContext } from './context/AuthContext';

// Páginas de Auth
import Login from './pages/Auth/Login';

// --- SECCIÓN ADMINISTRADOR ---
import AdminDashboard from './features/admin/AdminDashboard';
import UsuariosAvanzado from './features/admin/UsuariosAvanzado';
import EquiposAvanzado from './features/admin/EquiposAvanzado';
import OrdenesAvanzado from './features/admin/OrdenesAvanzado';
import InventarioAvanzado from './features/admin/InventarioAvanzado';
import FacturasAvanzado from './features/admin/FacturasAvanzado';
import GarantiasAvanzado from './features/admin/GarantiasAvanzado';
import HistorialEquipo from './features/admin/HistorialEquipo';
import HistorialRepuesto from './features/admin/HistorialRepuesto';

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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((s) => !s);

  // Layout estándar con Sidebar y Navbar (Admin, Secretaria, Técnico)
  const MainLayout = () => (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar open={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );

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
            element: <MainLayout />,
            children: [
              // Admin
              { index: true, element: <RequireAuth><AdminDashboard /></RequireAuth> },
              { path: 'admin', element: <RequireAuth><AdminDashboard /></RequireAuth> },
              { path: 'admin/usuarios', element: <RequireAuth><UsuariosAvanzado /></RequireAuth> },
              { path: 'admin/equipos', element: <RequireAuth><EquiposAvanzado /></RequireAuth> },
              { path: 'admin/ordenes', element: <RequireAuth><OrdenesAvanzado /></RequireAuth> },
              { path: 'admin/inventario', element: <RequireAuth><InventarioAvanzado /></RequireAuth> },
              { path: 'admin/facturacion', element: <RequireAuth><FacturasAvanzado /></RequireAuth> },
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

  return <RouterProvider router={router} />;
}

function RequireAuth({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default App;
