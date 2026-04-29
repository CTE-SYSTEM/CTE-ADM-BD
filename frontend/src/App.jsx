// App.jsx
import React, { useState, useContext } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';

// Componentes Globales
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Contexto de Autenticación
import { AuthProvider, AuthContext } from './context/AuthContext';

// Páginas de Auth
import Login from './pages/Auth/Login';

// --- SECCIÓN ADMINISTRADOR (Rutas verificadas en capturas) ---
// La carpeta se llama DashboardAdmin y el archivo Dashboard
import Dashboard from './pages/DashboardAdmin/Dashboard'; 
import Clientes from './features/clientes/clientes'; // Nota: Verifica si es minúscula
import Equipos from './features/equipos/equipos';
import Tecnicos from './features/tecnicos/tecnicos';
import Ordenes from './features/ordenes/ordenes';
import Inventario from './features/inventario/inventario';
import FacturacionAdmin from './features/facturacion/facturacion'; 

// --- SECCIÓN SECRETARIA (Carpeta pages/Secretaria) ---
import SecretariaDashboard from './pages/Secretaria/SecretariaDashboard';
import ClientesSecretaria from './pages/Secretaria/Clientes';
import EquiposSecretaria from './pages/Secretaria/Equipos';
import ProveedoresSecretaria from './pages/Secretaria/Proveedores';
import RepuestosSecretaria from './pages/Secretaria/Repuestos';
import ComprasSecretaria from './pages/Secretaria/Compras';
import FacturacionSecretaria from './pages/Secretaria/Facturacion';
import NuevaOrden from './pages/Secretaria/NuevaOrden';

// --- SECCIÓN TÉCNICOS ---
import TecnicoDashboard from './pages/Tecnico/TecnicoDashboard'; 
import JefeDashboard from './pages/TecnicoJefe/TecnicoJefeDashboard';

import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((s) => !s);

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
          {
            element: <MainLayout />,
            children: [
              // Rutas Admin
              { index: true, element: <RequireAuth><Dashboard /></RequireAuth> },
              { path: 'admin/clientes', element: <RequireAuth><Clientes /></RequireAuth> },
              { path: 'admin/tecnicos', element: <RequireAuth><Tecnicos /></RequireAuth> },
              { path: 'admin/equipos', element: <RequireAuth><Equipos /></RequireAuth> },
              { path: 'admin/ordenes', element: <RequireAuth><Ordenes /></RequireAuth> },
              { path: 'admin/inventario', element: <RequireAuth><Inventario /></RequireAuth> },
              { path: 'admin/facturacion', element: <RequireAuth><FacturacionAdmin /></RequireAuth> },

              // Rutas Secretaria
              { path: 'secretaria', element: <RequireAuth><SecretariaDashboard /></RequireAuth> },
              { path: 'secretaria/clientes', element: <RequireAuth><ClientesSecretaria /></RequireAuth> },
              { path: 'secretaria/equipos', element: <RequireAuth><EquiposSecretaria /></RequireAuth> },
              { path: 'secretaria/proveedores', element: <RequireAuth><ProveedoresSecretaria /></RequireAuth> },
              { path: 'secretaria/repuestos', element: <RequireAuth><RepuestosSecretaria /></RequireAuth> },
              { path: 'secretaria/compras', element: <RequireAuth><ComprasSecretaria /></RequireAuth> },
              { path: 'secretaria/facturacion', element: <RequireAuth><FacturacionSecretaria /></RequireAuth> },
              { path: 'secretaria/nueva-orden', element: <RequireAuth><NuevaOrden /></RequireAuth> },

              // Rutas Técnicos
              { path: 'tecnico', element: <RequireAuth><TecnicoDashboard /></RequireAuth> },
              { path: 'tecnico-jefe', element: <RequireAuth><JefeDashboard /></RequireAuth> },
            ],
          },
          { path: 'login', element: <Login /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
    { future: { v7_startTransition: true, v7_relativeSplatPath: true } }
  );

  return <RouterProvider router={router} />;
}

function RequireAuth({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default App;