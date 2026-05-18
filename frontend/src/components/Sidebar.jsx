import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Monitor, 
  ClipboardList, 
  Package, 
  Receipt,
  ShieldCheck,
  Stethoscope, 
  FileCheck, 
  Truck, 
  ShoppingCart,
  HardDrive,
  Tags
} from 'lucide-react';

const Sidebar = ({ open = true }) => {
  const { user } = useContext(AuthContext);

  const allMenuItems = [
    // --- ROL: ADMINISTRADOR ---
    { name: 'Dashboard', to: '/admin', roles: ['Administrador', 'admin_pro'], icon: LayoutDashboard },
    { name: 'Usuarios', to: '/admin/usuarios', roles: ['Administrador', 'admin_pro'], icon: Users },
    { name: 'Equipos', to: '/admin/equipos', roles: ['Administrador', 'admin_pro'], icon: Wrench },
    { name: 'Órdenes', to: '/admin/ordenes', roles: ['Administrador', 'admin_pro'], icon: Receipt },
    { name: 'Repuestos', to: '/admin/repuestos', roles: ['Administrador', 'admin_pro'], icon: HardDrive },
    { name: 'Compras', to: '/admin/compras', roles: ['Administrador', 'admin_pro'], icon: ShoppingCart },
    { name: 'Técnicos', to: '/admin/tecnicos', roles: ['Administrador', 'admin_pro'], icon: Stethoscope },
    { name: 'Clientes', to: '/admin/clientes', roles: ['Administrador', 'admin_pro'], icon: Users },
    { name: 'Inventario', to: '/admin/inventario', roles: ['Administrador', 'admin_pro'], icon: Package },
    { name: 'Facturación', to: '/admin/facturacion', roles: ['Administrador', 'admin_pro'], icon: Receipt },
    { name: 'Órdenes estado', to: '/admin/ordenes-estado', roles: ['Administrador', 'admin_pro'], icon: Receipt },
    { name: 'Diagnósticos', to: '/admin/diagnosticos', roles: ['Administrador', 'admin_pro'], icon: ClipboardList },
    { name: 'Garantías', to: '/admin/garantias', roles: ['Administrador', 'admin_pro'], icon: ShieldCheck },
    { name: 'Historial Equipo', to: '/admin/historial-equipo', roles: ['Administrador', 'admin_pro'], icon: Monitor },
    { name: 'Historial Repuesto', to: '/admin/historial-repuesto', roles: ['Administrador', 'admin_pro'], icon: ClipboardList },

    // --- ROL: SECRETARIA (Orden Personalizado) ---
    { name: 'Dashboard', to: '/secretaria', roles: ['Secretaria'], icon: LayoutDashboard },
    { name: 'Clientes', to: '/secretaria/clientes', roles: ['Secretaria'], icon: Users },
    { name: 'Equipos', to: '/secretaria/equipos', roles: ['Secretaria'], icon: Monitor },
    { name: 'Diagnóstico', to: '/secretaria/diagnostico', roles: ['Secretaria'], icon: Stethoscope }, 
    { name: 'Nueva Orden', to: '/secretaria/nueva-orden', roles: ['Secretaria'], icon: FileCheck },
    { name: 'Repuestos', to: '/secretaria/repuestos', roles: ['Secretaria'], icon: HardDrive },
    { name: 'Tipos Repuesto', to: '/secretaria/tipos-repuesto', roles: ['Secretaria'], icon: Tags },
    { name: 'Compras', to: '/secretaria/compras', roles: ['Secretaria'], icon: ShoppingCart },
    { name: 'Proveedores', to: '/secretaria/proveedores', roles: ['Secretaria'], icon: Truck },
    { name: 'Facturación', to: '/secretaria/facturacion', roles: ['Secretaria'], icon: Receipt },

    // --- OTROS ROLES ---
    { name: 'Dashboard', to: '/tecnico-jefe', roles: ['TecnicoJefe'], icon: LayoutDashboard },
    { name: 'Dashboard', to: '/tecnico', roles: ['Tecnico'], icon: LayoutDashboard },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(user?.rol));

  return (
    <aside className={`app-sidebar ${open ? 'flex' : 'hidden lg:flex'} flex-col w-20 lg:w-64 bg-[#0f1724] text-white h-screen sticky top-0 transition-all duration-300`}>
      <div className="p-4 border-b border-gray-800 flex flex-col items-center lg:items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/20">
          CTE
        </div>
        <div className="hidden lg:block overflow-hidden w-full">
          <div className="text-sm font-semibold truncate text-gray-100">{user?.username}</div>
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{user?.rol}</div>
        </div>
      </div>

      <nav className="p-2 flex-1 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.to + item.name}>
              <NavLink
                to={item.to}
                // El atributo 'end' evita que el Dashboard se quede azul cuando visitas sub-rutas
                end={item.to === '/secretaria' || item.to === '/'} 
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden lg:inline text-sm font-medium tracking-wide">
                  {item.name}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800 hidden lg:block bg-[#0b111a]">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
          Sistema de Gestión
        </div>
        <div className="text-[10px] text-gray-600 flex justify-between items-center">
          <span>v0.1 Beta</span>
          <span className="px-1.5 py-0.5 rounded bg-gray-800">2026</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
