import React from 'react';
import { X } from 'lucide-react';

const notificationColors = {
  success: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-100 bg-amber-50 text-amber-800',
  info: 'border-indigo-100 bg-indigo-50 text-indigo-800',
};

export const NotificationTray = ({ notifications, connected, onClear, onClose }) => (
  <aside className="absolute right-0 top-full z-40 mt-3 w-[min(380px,calc(100vw-48px))] rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
    <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white" />
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Notificaciones</h2>
        <p className="text-[10px] font-bold uppercase text-slate-400">
          {connected ? 'En vivo' : 'Sin conexion en vivo'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onClear} className="rounded-lg px-3 py-1 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          Limpiar
        </button>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Cerrar notificaciones">
          <X size={14} />
        </button>
      </div>
    </div>
    <div className="max-h-[420px] space-y-2 overflow-y-auto p-3">
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-400">
          Sin eventos recientes.
        </div>
      ) : (
        notifications.map((item) => (
          <div key={item.id} className={`rounded-xl border p-3 ${notificationColors[item.severity] || notificationColors.info}`}>
            <div className="text-xs font-black uppercase">{item.title || 'Actividad'}</div>
            <div className="mt-1 text-xs font-semibold leading-relaxed">{item.message}</div>
            <div className="mt-2 text-[10px] font-bold uppercase opacity-60">
              {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
            </div>
          </div>
        ))
      )}
    </div>
  </aside>
);

export default NotificationTray;
