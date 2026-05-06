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
import Dashboard from './pages/DashboardAdmin/Dashboard';
import Clientes from './features/Secretaria/Clientes';
import Equipos from './features/Secretaria/Equipos';
import Tecnicos from './features/tecnicos/Tecnicos';
import Ordenes from './features/ordenes/Ordenes';
import Inventario from './features/admin/Inventario';
import FacturacionAdmin from './features/Secretaria/Facturacion'; 

// --- SECCIÓN SECRETARIA ---
import SecretariaDashboard from './pages/Secretaria/SecretariaDashboard';
import ClientesSecretaria from './pages/Secretaria/Clientes';
import EquiposSecretaria from './pages/Secretaria/Equipos';
import ProveedoresSecretaria from './pages/Secretaria/Proveedores';
import RepuestosSecretaria from './pages/Secretaria/Repuestos';
import ComprasSecretaria from './pages/Secretaria/Compras';
import FacturacionSecretaria from './pages/Secretaria/Facturacion';
import Diagnostico from './pages/Secretaria/Diagnostico';
import NuevaOrden from './pages/Secretaria/Nuevaorden'; 

// --- SECCIÓN TÉCNICOS ---
import TecnicoDashboard from './pages/Tecnico/TecnicoDashboard'; 
import JefeDashboard from './pages/TecnicoJefe/TecnicoJefeDashboard';
import EditarOrden from './pages/TecnicoJefe/EditarOrden';

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
              { index: true, element: <RequireAuth><Dashboard /></RequireAuth> },
              { path: 'admin', element: <RequireAuth><Dashboard /></RequireAuth> },
              { path: 'admin/clientes', element: <RequireAuth><Clientes /></RequireAuth> },
              { path: 'admin/tecnicos', element: <RequireAuth><Tecnicos /></RequireAuth> },
              { path: 'admin/equipos', element: <RequireAuth><Equipos /></RequireAuth> },
              { path: 'admin/ordenes', element: <RequireAuth><Ordenes /></RequireAuth> },
              { path: 'admin/inventario', element: <RequireAuth><Inventario /></RequireAuth> },
              { path: 'admin/facturacion', element: <RequireAuth><FacturacionAdmin /></RequireAuth> },

              // Secretaria
              { path: 'secretaria', element: <RequireAuth><SecretariaDashboard /></RequireAuth> },
              { path: 'secretaria/clientes', element: <RequireAuth><ClientesSecretaria /></RequireAuth> },
              { path: 'secretaria/equipos', element: <RequireAuth><EquiposSecretaria /></RequireAuth> },
              { path: 'secretaria/proveedores', element: <RequireAuth><ProveedoresSecretaria /></RequireAuth> },
              { path: 'secretaria/repuestos', element: <RequireAuth><RepuestosSecretaria /></RequireAuth> },
              { path: 'secretaria/compras', element: <RequireAuth><ComprasSecretaria /></RequireAuth> },
              { path: 'secretaria/facturacion', element: <RequireAuth><FacturacionSecretaria /></RequireAuth> },
              { path: 'secretaria/nueva-orden', element: <RequireAuth><NuevaOrden /></RequireAuth> },
              { path: 'secretaria/diagnostico', element: <RequireAuth><Diagnostico /></RequireAuth> },

              // Tecnico Normal
              { path: 'tecnico', element: <RequireAuth><TecnicoDashboard /></RequireAuth> },
            ],
          },

          // 2. RUTAS INDEPENDIENTES (Sin Sidebar Global)
          // El JefeDashboard ya trae su propio Header integrado
          { 
            path: 'tecnico-jefe', 
            element: <RequireAuth><JefeDashboard /></RequireAuth> 
          },
          {
            path: 'editar-orden/:id',
            element: <RequireAuth><EditarOrden /></RequireAuth>
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
