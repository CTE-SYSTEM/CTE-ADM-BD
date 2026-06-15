import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { downloadJsonPdf } from '../../utils/csvExport';

const DIAGNOSTICO_ESTADOS = ['PENDIENTE', 'INGRESADO', 'EN_REVISION', 'DIAGNOSTICADO', 'COMPLETADO', 'APROBADO', 'RECHAZADO'];
const ORDEN_ESTADOS = ['PENDIENTE', 'APROBADO', 'EN_REPARACION', 'ESPERANDO_PIEZA', 'FINALIZADO', 'IRREPARABLE', 'ENTREGADO'];
const PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Urgente'];

const normalize = (value) => String(value || '').toLowerCase();
const padDate = (value) => String(value).padStart(2, '0');
const toInputDate = (date) => `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())}`;

const equipoLabel = (equipo) => [equipo.marca, equipo.modelo, equipo.numero_serie].filter(Boolean).join(' ') || `Equipo #${equipo.id_equipo}`;

export default function HistorialEquipo() {
  const [equipos, setEquipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState(null);
  const [equipoSearch, setEquipoSearch] = useState('');
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin_pro/equipos'),
      api.get('/tecnicos'),
    ])
      .then(([equiposRes, tecnicosRes]) => {
        setEquipos(equiposRes.data?.data || []);
        setTecnicos(tecnicosRes.data?.data || []);
      })
      .catch(() => setError('No se pudo cargar la informacion base del historial.'))
      .finally(() => setLoading(false));
  }, []);

  const clientes = useMemo(() => {
    const map = new Map();
    equipos.forEach((equipo) => {
      if (!equipo.cliente) return;
      map.set(equipo.cliente.id_cliente, equipo.cliente);
    });
    return Array.from(map.values()).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
  }, [equipos]);

  const clientesFiltrados = useMemo(() => {
    const term = normalize(clienteSearch);
    if (!term) return clientes;
    return clientes.filter((cliente) => [
      cliente.id_cliente,
      cliente.nombre,
      cliente.telefono,
      cliente.correo,
      cliente.direccion,
    ].some((field) => normalize(field).includes(term)));
  }, [clientes, clienteSearch]);

  const equiposDelCliente = useMemo(() => {
    if (!selectedClienteId) return [];
    const term = normalize(equipoSearch);
    return equipos
      .filter((equipo) => Number(equipo.cliente_id) === Number(selectedClienteId))
      .filter((equipo) => !term || [
        equipo.id_equipo,
        equipo.tipo,
        equipo.marca,
        equipo.modelo,
        equipo.numero_serie,
        equipo.diagnosticos?.[0]?.estado_del_diagnostico,
      ].some((field) => normalize(field).includes(term)));
  }, [equipos, selectedClienteId, equipoSearch]);

  const selectedCliente = clientes.find((cliente) => Number(cliente.id_cliente) === Number(selectedClienteId));

  const loadHistorial = async (equipo) => {
    setSelectedEquipo(equipo);
    setHistorial([]);
    setHistoryLoading(true);
    setError('');
    try {
      const response = await api.get(`/admin_pro/equipos/${equipo.id_equipo}/historial`);
      setHistorial(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el historial del equipo.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const historialItems = useMemo(() => (
    historial.flatMap((diagnostico) => {
      const diagnosticoItem = {
        tipo: 'diagnostico',
        id: diagnostico.id_diagnostico,
        fecha: diagnostico.fecha_hora,
        titulo: `Diagnostico #${diagnostico.id_diagnostico}`,
        estado: diagnostico.estado_del_diagnostico,
        tecnico: diagnostico.tecnico?.nombre || 'Sin asignar',
        descripcion: diagnostico.diagnostico_real || diagnostico.falla_reportada || 'Sin detalle registrado',
        raw: diagnostico,
      };
      const ordenes = (diagnostico.ordenes || []).map((orden) => ({
        tipo: 'orden',
        id: orden.id_orden,
        fecha: orden.fecha_ingreso,
        titulo: `Orden #${orden.id_orden}`,
        estado: orden.estado,
        tecnico: orden.tecnico?.nombre || 'Sin asignar',
        descripcion: orden.observacion_final || orden.resultado_final || diagnostico.falla_reportada || 'Sin detalle registrado',
        raw: orden,
        diagnostico,
      }));
      return [diagnosticoItem, ...ordenes];
    }).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
  ), [historial]);

  const filteredHistorialItems = useMemo(() => {
    const start = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const end = toDate ? new Date(`${toDate}T23:59:59`) : null;
    return historialItems.filter((item) => {
      const date = item.fecha ? new Date(item.fecha) : null;
      if (!date) return !start && !end;
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  }, [historialItems, fromDate, toDate]);

  const applyQuickPeriod = (period) => {
    const now = new Date();
    const start = new Date(now);
    if (period === 'semana') {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
    } else if (period === 'mes') {
      start.setDate(1);
    } else {
      start.setMonth(0, 1);
    }
    setFromDate(toInputDate(start));
    setToDate(toInputDate(now));
  };

  const downloadHistorialPdf = () => {
    const rows = filteredHistorialItems.map((item) => ({
      fecha: item.fecha ? new Date(item.fecha).toLocaleString() : '-',
      tipo: item.tipo,
      referencia: item.titulo,
      estado: item.estado || '-',
      tecnico: item.tecnico,
      detalle: item.descripcion,
    }));
    downloadJsonPdf(rows, [
      { header: 'Fecha', accessor: 'fecha' },
      { header: 'Tipo', accessor: 'tipo' },
      { header: 'Referencia', accessor: 'referencia' },
      { header: 'Estado', accessor: 'estado' },
      { header: 'Tecnico', accessor: 'tecnico' },
      { header: 'Detalle', accessor: 'detalle' },
    ], `historial_equipo_${selectedEquipo?.id_equipo || 'sin_equipo'}.pdf`, 'Historial de equipo');
  };

  const openEdit = (item) => {
    if (item.tipo === 'diagnostico') {
      setEditing({
        tipo: 'diagnostico',
        id: item.id,
        tecnico_id: item.raw.tecnico_id || '',
        prioridad: item.raw.prioridad || 'Normal',
        estado_del_diagnostico: item.raw.estado_del_diagnostico || 'PENDIENTE',
        Estado_aprobacion: item.raw.Estado_aprobacion || 'Pendiente',
        falla_reportada: item.raw.falla_reportada || '',
        diagnostico_real: item.raw.diagnostico_real || '',
        presupuesto_estimado: item.raw.presupuesto_estimado ? Number(item.raw.presupuesto_estimado) : '',
      });
    } else {
      setEditing({
        tipo: 'orden',
        id: item.id,
        tecnico_id: item.raw.tecnico_id || '',
        prioridad: item.raw.prioridad || 'Normal',
        estado: item.raw.estado || 'PENDIENTE',
        resultado_final: item.raw.resultado_final || '',
        observacion_final: item.raw.observacion_final || '',
      });
    }
    setEditMessage('');
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setEditMessage('');
    try {
      if (editing.tipo === 'diagnostico') {
        await api.put(`/admin_pro/diagnosticos/${editing.id}`, {
          tecnico_id: editing.tecnico_id || null,
          prioridad: editing.prioridad,
          estado_del_diagnostico: editing.estado_del_diagnostico,
          Estado_aprobacion: editing.Estado_aprobacion,
          falla_reportada: editing.falla_reportada,
          diagnostico_real: editing.diagnostico_real,
          presupuesto_estimado: editing.presupuesto_estimado,
        });
      } else {
        await api.put(`/admin_pro/ordenes/${editing.id}`, {
          tecnico_id: editing.tecnico_id || null,
          estado: editing.estado,
          resultado_final: editing.resultado_final,
          observacion_final: editing.observacion_final,
        });
      }

      setEditMessage('Cambios guardados correctamente.');
      if (selectedEquipo) await loadHistorial(selectedEquipo);
      setTimeout(() => setEditing(null), 700);
    } catch (err) {
      setEditMessage(err.response?.data?.error || 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Historial centralizado de equipos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Selecciona cliente, equipo y revisa toda su trazabilidad tecnica en pantalla completa.</p>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-indigo-600">Paso 1</p>
          <h2 className="mt-1 text-lg font-bold text-slate-800">Seleccionar cliente</h2>
          <input
            type="search"
            value={clienteSearch}
            onChange={(event) => setClienteSearch(event.target.value)}
            placeholder="Buscador inteligente: ID, nombre, telefono o correo..."
            className="mt-4 w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
          />
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-gray-400">Cargando clientes...</p>
            ) : clientesFiltrados.map((cliente) => (
              <button
                key={cliente.id_cliente}
                type="button"
                onClick={() => {
                  setSelectedClienteId(cliente.id_cliente);
                  setSelectedEquipo(null);
                  setHistorial([]);
                }}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${Number(selectedClienteId) === Number(cliente.id_cliente) ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-gray-100 bg-white hover:bg-slate-50'}`}
              >
                <span className="block font-bold">{cliente.nombre}</span>
                <span className="text-xs text-gray-400">#{cliente.id_cliente} {cliente.telefono || ''}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-indigo-600">Paso 2</p>
          <h2 className="mt-1 text-lg font-bold text-slate-800">Equipos vinculados</h2>
          <p className="mt-1 text-xs font-semibold text-gray-400">{selectedCliente ? selectedCliente.nombre : 'Selecciona un cliente para continuar.'}</p>
          {selectedClienteId && (
            <input
              type="search"
              value={equipoSearch}
              onChange={(event) => setEquipoSearch(event.target.value)}
              placeholder="Filtrar equipo por ID, tipo, marca, modelo o serie..."
              className="mt-4 w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
            />
          )}
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {!selectedClienteId ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50 p-6 text-center text-xs text-gray-400">Esperando cliente.</div>
            ) : equiposDelCliente.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50 p-6 text-center text-xs text-gray-400">Este cliente no tiene equipos con ese filtro.</div>
            ) : equiposDelCliente.map((equipo) => (
              <button
                key={equipo.id_equipo}
                type="button"
                onClick={() => loadHistorial(equipo)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${selectedEquipo?.id_equipo === equipo.id_equipo ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-gray-100 bg-white hover:bg-slate-50'}`}
              >
                <span className="block font-bold">{equipoLabel(equipo)}</span>
                <span className="text-xs text-gray-400">#{equipo.id_equipo} - {equipo.tipo || 'Equipo'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-indigo-600">Paso 3</p>
          <h2 className="mt-1 text-lg font-bold text-slate-800">Historial centralizado</h2>
          <p className="mt-1 text-xs font-semibold text-gray-400">{selectedEquipo ? equipoLabel(selectedEquipo) : 'Selecciona un equipo para desplegar el historial.'}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase">Diagnosticos</p>
              <p className="text-2xl font-black text-slate-800">{historial.length}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase">Ordenes</p>
              <p className="text-2xl font-black text-slate-800">{historial.reduce((sum, item) => sum + (item.ordenes?.length || 0), 0)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-indigo-600">Paso 4</p>
            <h2 className="text-xl font-bold text-slate-800">Linea de tiempo editable</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              ['semana', 'Semana'],
              ['mes', 'Mes'],
              ['anio', 'Año'],
            ].map(([period, label]) => (
              <button key={period} type="button" onClick={() => applyQuickPeriod(period)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">{label}</button>
            ))}
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-700" />
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-700" />
            <button type="button" onClick={downloadHistorialPdf} disabled={!selectedEquipo || filteredHistorialItems.length === 0} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:bg-slate-300">PDF</button>
            {selectedEquipo && <span className="rounded-xl bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">Equipo #{selectedEquipo.id_equipo}</span>}
          </div>
        </div>

        {historyLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando historial completo...</div>
        ) : !selectedEquipo ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50 p-12 text-center text-sm text-gray-400">El historial aparecera aqui al seleccionar un equipo.</div>
        ) : filteredHistorialItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50 p-12 text-center text-sm text-gray-400">Este equipo no cuenta con diagnosticos u ordenes registradas.</div>
        ) : (
          <div className="space-y-3">
            {filteredHistorialItems.map((item) => (
              <article key={`${item.tipo}-${item.id}`} className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${item.tipo === 'orden' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{item.tipo}</span>
                      <h3 className="font-bold text-slate-800">{item.titulo}</h3>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-600">{item.estado || 'Sin estado'}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-gray-400">{item.fecha ? new Date(item.fecha).toLocaleString() : 'Sin fecha'} - {item.tecnico}</p>
                    <p className="mt-3 max-w-4xl whitespace-pre-wrap text-sm text-slate-700">{item.descripcion}</p>
                  </div>
                  <button type="button" onClick={() => openEdit(item)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
                    Editar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800">Editar {editing.tipo} #{editing.id}</h3>
            <form onSubmit={saveEdit} className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Tecnico</span>
                <select value={editing.tecnico_id || ''} onChange={(event) => setEditing((prev) => ({ ...prev, tecnico_id: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm">
                  <option value="">Sin asignar</option>
                  {tecnicos.map((tecnico) => <option key={tecnico.id_tecnico} value={tecnico.id_tecnico}>{tecnico.nombre}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Prioridad</span>
                <select value={editing.prioridad || 'Normal'} onChange={(event) => setEditing((prev) => ({ ...prev, prioridad: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm">
                  {PRIORIDADES.map((prioridad) => <option key={prioridad} value={prioridad}>{prioridad}</option>)}
                </select>
              </label>
              {editing.tipo === 'diagnostico' ? (
                <>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500">Estado</span>
                    <select value={editing.estado_del_diagnostico} onChange={(event) => setEditing((prev) => ({ ...prev, estado_del_diagnostico: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm">
                      {DIAGNOSTICO_ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500">Aprobacion</span>
                    <select value={editing.Estado_aprobacion} onChange={(event) => setEditing((prev) => ({ ...prev, Estado_aprobacion: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm">
                      {['Pendiente', 'Aprobado', 'Rechazado'].map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Falla reportada</span>
                    <textarea value={editing.falla_reportada || ''} onChange={(event) => setEditing((prev) => ({ ...prev, falla_reportada: event.target.value }))} className="mt-1.5 min-h-20 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Diagnostico real</span>
                    <textarea value={editing.diagnostico_real || ''} onChange={(event) => setEditing((prev) => ({ ...prev, diagnostico_real: event.target.value }))} className="mt-1.5 min-h-24 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500">Estado</span>
                    <select value={editing.estado} onChange={(event) => setEditing((prev) => ({ ...prev, estado: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm">
                      {ORDEN_ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500">Resultado final</span>
                    <input value={editing.resultado_final || ''} onChange={(event) => setEditing((prev) => ({ ...prev, resultado_final: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Observacion final</span>
                    <textarea value={editing.observacion_final || ''} onChange={(event) => setEditing((prev) => ({ ...prev, observacion_final: event.target.value }))} className="mt-1.5 min-h-24 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  </label>
                </>
              )}

              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-400">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
              {editMessage && <div className="md:col-span-2 text-center text-sm font-semibold text-indigo-600">{editMessage}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
