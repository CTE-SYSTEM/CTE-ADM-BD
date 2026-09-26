import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, Menu, UserRound } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { NotificationTray } from './NotificationTray';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';

const normalizeRole = (role) => String(role || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[\s_-]/g, '')
  .toLowerCase();

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const isSecretaria = normalizeRole(user?.rol) === 'secretaria';
  const {
    notifications,
    connected: socketConnected,
    clearNotifications,
  } = useRealtimeNotifications({
    enabled: isSecretaria,
    onNotification: () => setShowNotifications(true),
    onRefresh: (notification) => {
      window.dispatchEvent(new CustomEvent('secretaria:notificacion', { detail: notification }));
    },
    refreshIntervalMs: 0,
  });

  useEffect(() => {
    if (!isSecretaria) setShowNotifications(false);
  }, [isSecretaria]);

  return (
    <header className="app-navbar flex items-center justify-between border-b bg-white px-5 py-3 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 lg:hidden"
          aria-label="Abrir menu"
          title="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            {isSecretaria && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((value) => !value)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                  title={socketConnected ? 'Notificaciones conectadas' : 'Notificaciones desconectadas'}
                  aria-label="Abrir notificaciones"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 py-0.5 text-[9px] font-black leading-none text-white">
                      {notifications.length}
                    </span>
                  )}
                  <span className={`absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                </button>

                {showNotifications && (
                  <NotificationTray
                    notifications={notifications}
                    connected={socketConnected}
                    onClear={() => {
                      clearNotifications();
                      setShowNotifications(false);
                    }}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">
                {user.username?.charAt(0).toUpperCase() || <UserRound className="h-5 w-5" />}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-bold text-gray-800">{user.username}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{user.rol}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 text-sm font-bold text-red-600 transition hover:border-red-200 hover:bg-red-600 hover:text-white"
              title="Cerrar sesion"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </>
        ) : (
          <Link to="/login" className="text-sm font-semibold text-indigo-600">Iniciar sesion</Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
