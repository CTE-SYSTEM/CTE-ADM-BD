import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import Clientes from './features/clientes/Clientes';
import Tecnicos from './features/tecnicos/Tecnicos';
import Equipos from './features/equipos/Equipos';
import Ordenes from './features/ordenes/Ordenes';
import Inventario from './features/inventario/Inventario';
import Facturacion from './pages/Facturacion/Facturacion';
import Login from './pages/Auth/Login';
// Importaciones de Secretaria
import SecretariaDashboard from './pages/Secretaria/SecretariaDashboard';
import ClientesSecretaria from './pages/Secretaria/Clientes';
import EquiposSecretaria from './pages/Secretaria/Equipos';
import ProveedoresSecretaria from './pages/Secretaria/Proveedores';
import RepuestosSecretaria from './pages/Secretaria/Repuestos';
import ComprasSecretaria from './pages/Secretaria/Compras';
import NuevaOrden from './pages/Secretaria/NuevaOrden';
// Importaciones de Técnico Jefe
import TecnicoJefeDashboard from './pages/TecnicoJefe/TecnicoJefeDashboard';
import { AuthProvider, AuthContext } from './context/AuthContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const toggleSidebar = () => setSidebarOpen((s) => !s);

  const MainLayout = () => (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar open={sidebarOpen} />
      <div className="flex-1 flex flex-col">
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
              // Rutas de Administrador
              { index: true, element: <RequireAuth><Dashboard /></RequireAuth> },
              { path: 'clientes', element: <RequireAuth><Clientes /></RequireAuth> },
              { path: 'tecnicos', element: <RequireAuth><Tecnicos /></RequireAuth> },
              { path: 'equipos', element: <RequireAuth><Equipos /></RequireAuth> },
              { path: 'ordenes', element: <RequireAuth><Ordenes /></RequireAuth> },
              { path: 'inventario', element: <RequireAuth><Inventario /></RequireAuth> },
              { path: 'facturacion', element: <RequireAuth><Facturacion /></RequireAuth> },
              // Rutas de Secretaria
              { path: 'secretaria', element: <RequireAuth><SecretariaDashboard /></RequireAuth> },
              { path: 'secretaria/clientes', element: <RequireAuth><ClientesSecretaria /></RequireAuth> },
              { path: 'secretaria/equipos', element: <RequireAuth><EquiposSecretaria /></RequireAuth> },
              { path: 'secretaria/proveedores', element: <RequireAuth><ProveedoresSecretaria /></RequireAuth> },
              { path: 'secretaria/repuestos', element: <RequireAuth><RepuestosSecretaria /></RequireAuth> },
              { path: 'secretaria/compras', element: <RequireAuth><ComprasSecretaria /></RequireAuth> },
              { path: 'secretaria/nueva-orden', element: <RequireAuth><NuevaOrden /></RequireAuth> },
              // Rutas de Técnico Jefe
              { path: 'tecnico-jefe', element: <RequireAuth><TecnicoJefeDashboard /></RequireAuth> },
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
  const { user } = React.useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default App;
