import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  ContactRound,
  Cpu,
  FileCheck,
  FileText,
  History,
  Laptop,
  LayoutDashboard,
  Monitor,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  SquareKanban,
  Stethoscope,
  Tags,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  WalletCards,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

const adminRoles = ['Administrador', 'admin_pro'];

const allMenuItems = [
  { name: 'Dashboard', to: '/admin', roles: adminRoles, icon: LayoutDashboard },
  { name: 'Usuarios', to: '/admin/usuarios', roles: adminRoles, icon: UserCog },
  { name: 'Clientes', to: '/admin/clientes', roles: adminRoles, icon: ContactRound },
  { name: 'Equipos', to: '/admin/equipos', roles: adminRoles, icon: Laptop },
  { name: 'Diagnosticos', to: '/admin/diagnosticos', roles: adminRoles, icon: ClipboardCheck },
  { name: 'Tecnicos', to: '/admin/tecnicos', roles: adminRoles, icon: Stethoscope },
  { name: 'Ordenes', to: '/admin/ordenes', roles: adminRoles, icon: ClipboardList },
  { name: 'Ordenes estado', to: '/admin/ordenes-estado', roles: adminRoles, icon: BarChart3 },
  { name: 'Flujo atencion', to: '/admin/flujo-atencion', roles: adminRoles, icon: SquareKanban },
  { name: 'Facturas', to: '/admin/visualizacion-control-facturas', roles: adminRoles, icon: FileText },
  { name: 'Garantias', to: '/admin/garantias', roles: adminRoles, icon: ShieldCheck },
  { name: 'Inventario', to: '/admin/inventario', roles: adminRoles, icon: Package },
  { name: 'Repuestos', to: '/admin/repuestos', roles: adminRoles, icon: Cpu },
  { name: 'Compras', to: '/admin/compras', roles: adminRoles, icon: ShoppingCart },
  { name: 'Ganancias', to: '/admin/ganancias', roles: adminRoles, icon: WalletCards },
  { name: 'Historial Equipo', to: '/admin/historial-equipo', roles: adminRoles, icon: History },
  { name: 'Historial Repuesto', to: '/admin/historial-repuesto', roles: adminRoles, icon: TrendingUp },

  { name: 'Dashboard', to: '/secretaria', roles: ['Secretaria'], icon: LayoutDashboard },
  { name: 'Clientes', to: '/secretaria/clientes', roles: ['Secretaria'], icon: Users },
  { name: 'Equipos', to: '/secretaria/equipos', roles: ['Secretaria'], icon: Monitor },
  { name: 'Diagnostico', to: '/secretaria/diagnostico', roles: ['Secretaria'], icon: Stethoscope },
  { name: 'Nueva Orden', to: '/secretaria/nueva-orden', roles: ['Secretaria'], icon: FileCheck },
  { name: 'Flujo atencion', to: '/secretaria/flujo-atencion', roles: ['Secretaria'], icon: SquareKanban },
  { name: 'Repuestos', to: '/secretaria/repuestos', roles: ['Secretaria'], icon: Cpu },
  { name: 'Tipos Repuesto', to: '/secretaria/tipos-repuesto', roles: ['Secretaria'], icon: Tags },
  { name: 'Compras', to: '/secretaria/compras', roles: ['Secretaria'], icon: ShoppingCart },
  { name: 'Proveedores', to: '/secretaria/proveedores', roles: ['Secretaria'], icon: Truck },
  { name: 'Facturacion', to: '/secretaria/facturacion', roles: ['Secretaria'], icon: Receipt },

  { name: 'Dashboard', to: '/tecnico-jefe', roles: ['TecnicoJefe'], icon: LayoutDashboard },
  { name: 'Dashboard', to: '/tecnico', roles: ['Tecnico'], icon: LayoutDashboard },
];

const Sidebar = ({ open = true }) => {
  const { user } = useContext(AuthContext);
  const menuItems = allMenuItems.filter((item) => item.roles.includes(user?.rol));

  return (
    <aside className={`app-sidebar ${open ? 'flex' : 'hidden lg:flex'} flex-col w-20 lg:w-64 bg-[#0f1724] text-white h-screen sticky top-0 transition-all duration-300`}>
      <div className="p-4 border-b border-gray-800 flex flex-col items-center lg:items-start gap-3">
        <BrandLogo className="h-14 w-14 shadow-lg shadow-indigo-500/20 lg:h-16 lg:w-36" />
        <div className="hidden lg:block overflow-hidden w-full">
          <div className="text-sm font-semibold truncate text-gray-100">{user?.username}</div>
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{user?.rol}</div>
        </div>
      </div>

      <nav className="p-2 flex-1 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.to + item.name} className="w-full">
              <NavLink
                to={item.to}
                end={item.to === '/admin' || item.to === '/secretaria'}
                className={({ isActive }) =>
                  `flex w-full min-w-0 items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden min-w-0 flex-1 truncate text-sm font-medium tracking-wide lg:inline">
                  {item.name}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800 hidden lg:block bg-[#0b111a]">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
          Sistema de Gestion
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
