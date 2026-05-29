import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  ClipboardList,
  FileText,
  Filter,
  Laptop,
  PackageCheck,
  Receipt,
  Search,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react';
import { getFlujoAtencion } from '../services/flujoAtencionService';

const filtros = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'en-revision', label: 'En revision' },
  { id: 'listos-orden', label: 'Listos para orden' },
  { id: 'en-reparacion', label: 'En reparacion' },
  { id: 'listos-facturar', label: 'Listos para facturar' },
  { id: 'entregados', label: 'Entregados' },
  { id: 'con-garantia', label: 'Con garantia' },
];

const pasos = [
  { key: 'cliente', label: 'Cliente', icon: User },
  { key: 'equipo', label: 'Equipo', icon: Laptop },
  { key: 'diagnostico', label: 'Diagnostico', icon: ClipboardList },
  { key: 'orden', label: 'Orden', icon: Wrench },
  { key: 'repuestos', label: 'Repuestos', icon: PackageCheck },
  { key: 'factura', label: 'Factura', icon: Receipt },
  { key: 'garantia', label: 'Garantia', icon: ShieldCheck },
];

const estadoColor = {
  pendientes: 'bg-amber-50 text-amber-700 border-amber-200',
  'en-revision': 'bg-sky-50 text-sky-700 border-sky-200',
  'listos-orden': 'bg-violet-50 text-violet-700 border-violet-200',
  'en-reparacion': 'bg-blue-50 text-blue-700 border-blue-200',
  'listos-facturar': 'bg-rose-50 text-rose-700 border-rose-200',
  entregados: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'con-garantia': 'bg-teal-50 text-teal-700 border-teal-200',
};

const hasStep = (item, key) => {
  if (key === 'cliente') return Boolean(item.cliente);
  if (key === 'equipo') return Boolean(item.equipo);
  if (key === 'diagnostico') return Boolean(item.diagnostico);
  if (key === 'orden') return Boolean(item.orden);
  if (key === 'repuestos') return Number(item.repuestos?.total || 0) > 0;
  if (key === 'factura') return Boolean(item.factura);
  if (key === 'garantia') return Boolean(item.garantia);
  return false;
};

const formatEquipo = (equipo) =>
  [equipo?.marca, equipo?.modelo].filter(Boolean).join(' ') || equipo?.tipo || 'Equipo sin detalle';

const StatusPill = ({ item }) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${estadoColor[item.filtro] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
    {filtros.find((filtro) => filtro.id === item.filtro)?.label || item.filtro}
  </span>
);

const FlujoAtencion = () => {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ resumen: {} });
  const [filtro, setFiltro] = useState('todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getFlujoAtencion({ filtro, search });
        setItems(response.data?.data || []);
        setMeta(response.data?.meta || { resumen: {} });
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo cargar el flujo de atencion.');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [filtro, search]);

  const resumen = useMemo(() => meta.resumen || {}, [meta]);

  return (
    <div className="space-y-6 p-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
            <BadgeCheck className="h-4 w-4" />
            Seguimiento operativo
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Flujo de atencion</h1>
          <p className="mt-1 text-sm text-slate-500">Cliente, equipo, diagnostico, orden, repuestos, factura y garantia en una sola vista.</p>
        </div>

        <label className="relative block w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            placeholder="Buscar cliente, equipo, serie u orden"
          />
        </label>
      </header>

      <section className="flex flex-wrap gap-2">
        {filtros.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFiltro(item.id)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
              filtro === item.id
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            {item.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${filtro === item.id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {item.id === 'todos' ? resumen.todos || items.length : resumen[item.id] || 0}
            </span>
          </button>
        ))}
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-500">
          Cargando seguimiento...
        </div>
      )}

      {!loading && !error && (
        <section className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm font-semibold text-slate-400">
              No hay equipos en este filtro.
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{item.cliente?.nombre || 'Cliente sin nombre'}</h2>
                      <StatusPill item={item} />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{formatEquipo(item.equipo)}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.diagnostico?.falla_reportada || 'Sin falla reportada'}</p>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:min-w-[420px]">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="block text-xs font-bold uppercase text-slate-400">Diagnostico</span>
                      {item.diagnostico?.estado || 'Pendiente'}
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="block text-xs font-bold uppercase text-slate-400">Orden</span>
                      {item.orden ? `${item.orden.estado} #${item.orden.id_orden}` : 'No creada'}
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="block text-xs font-bold uppercase text-slate-400">Repuestos</span>
                      {item.repuestos.total ? `${item.repuestos.pendientes} pendientes de ${item.repuestos.total}` : 'Sin repuestos'}
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="block text-xs font-bold uppercase text-slate-400">Factura / garantia</span>
                      {item.factura ? `Factura #${item.factura.id_factura}` : 'No emitida'}{item.garantia ? ' + garantia' : ''}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-2 md:grid-cols-7">
                  {pasos.map((paso, index) => {
                    const Icon = paso.icon;
                    const active = hasStep(item, paso.key);
                    return (
                      <div key={paso.key} className="flex min-h-16 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex-col md:justify-center md:text-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? 'bg-cyan-600 text-white' : 'bg-white text-slate-300 border border-slate-200'}`}>
                          {active ? <BadgeCheck className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-700">{paso.label}</div>
                          <div className="text-[11px] font-semibold text-slate-400">{active ? 'Listo' : index < 2 ? 'Registrado' : 'Pendiente'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {item.garantia?.fecha_vencimiento && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700">
                    <FileText className="h-4 w-4" />
                    Garantia vence el {new Date(item.garantia.fecha_vencimiento).toLocaleDateString()}
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
};

export default FlujoAtencion;
