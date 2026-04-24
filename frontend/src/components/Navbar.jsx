import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  return (
    <header className="app-navbar flex items-center justify-between p-3 border-b bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-gray-500 hover:text-gray-700 lg:hidden">☰</button>
        <div className="flex items-center gap-3">
          <h1 className="logo text-lg font-semibold">CTE</h1>
        </div>
        <div className="hidden md:block">
          <input placeholder="Buscar..." className="w-64 px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>
        <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">{user.username?.charAt(0).toUpperCase()}</div>
              <div className="hidden sm:block text-sm text-gray-700">{user.username}</div>
            </div>
            <button onClick={logout} className="text-sm text-white bg-red-500 px-3 py-1 rounded">Salir</button>
          </>
        ) : (
          <Link to="/login" className="text-sm text-indigo-600">Iniciar sesión</Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;