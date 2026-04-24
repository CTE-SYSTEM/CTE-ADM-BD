import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconDashboard, IconClientes, IconTecnicos, IconEquipos, IconOrdenes, IconInventario, IconFacturacion } from './icons';

const Sidebar = ({ open = true }) => {
  const menuItems = [
    { name: 'Dashboard', to: '/' },
    { name: 'Clientes', to: '/clientes' },
    { name: 'Técnicos', to: '/tecnicos' },
    { name: 'Equipos', to: '/equipos' },
    { name: 'Órdenes', to: '/ordenes' },
    { name: 'Inventario', to: '/inventario' },
    { name: 'Repuestos', to: '/repuestos' },
    { name: 'Proveedores', to: '/proveedores' },
    { name: 'Facturación', to: '/facturacion' },
  ];

  return (
    <aside className={`app-sidebar ${open ? 'flex' : 'hidden lg:flex'} flex-col w-20 lg:w-64 bg-[#0f1724] text-white h-screen sticky top-0`}>
      <div className="p-4 border-b border-gray-800 flex flex-col items-center lg:items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">CT</div>
        <div className="hidden lg:block">
          <div className="text-sm font-semibold">Nick Name</div>
          <div className="text-xs text-gray-300">Administrador</div>
        </div>
      </div>

      <nav className="p-2 flex-1 overflow-auto">
        <ul className="flex flex-col items-center lg:items-start space-y-2">
          {menuItems.map((item) => {
            const Icon = item.to === '/' ? IconDashboard :
              item.to === '/clientes' ? IconClientes :
              item.to === '/tecnicos' ? IconTecnicos :
              item.to === '/equipos' ? IconEquipos :
              item.to === '/ordenes' ? IconOrdenes :
              item.to === '/inventario' ? IconInventario :
              item.to === '/repuestos' ? IconInventario :
              item.to === '/proveedores' ? IconClientes :
              IconFacturacion;
              return (
                <li key={item.to} className="w-full">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <div className="flex items-center justify-center w-8 h-8">
                      <Icon className="sidebar-icon" />
                    </div>
                    <span className="sidebar-label hidden lg:inline">{item.name}</span>
                  </NavLink>
                </li>
              );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-800 hidden lg:block">
        <div className="text-xs text-gray-400">Versión 0.1 • Local</div>
      </div>
    </aside>
  );
};

export default Sidebar;