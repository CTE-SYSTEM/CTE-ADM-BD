import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { header: 'ID', accessor: 'id_equipo' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Tipo', accessor: 'tipo' },
  { header: 'Marca', accessor: 'marca' },
  { header: 'Modelo', accessor: 'modelo' },
  { header: 'Serie', accessor: 'numero_serie' },
  { header: 'Estado', accessor: 'estado' },
  {
    header: 'Acciones',
    accessor: 'acciones',
    render: (row) => (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={row.onEdit}
          className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-900 shadow-sm"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={row.onViewHistory}
          className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 shadow-sm"
        >
          Ver historial
        </button>
      </div>
    ),
  },
];

const fetchEquipos = async (setEquipos, setLoading, setError) => {
  setLoading(true);
  try {
    const res = await api.get('/admin_pro/equipos');
    const data = res.data;
    if (data.data) {
      setEquipos(
        data.data.map((e) => ({
          id_equipo: e.id_equipo,
          cliente: e.cliente?.nombre || '-',
          tipo: e.tipo || '-',
          marca: e.marca || '-',
          modelo: e.modelo || '-',
          numero_serie: e.numero_serie || '-',
          estado: e.diagnosticos?.[0]?.estado_del_diagnostico || '-',
          historial: e.diagnosticos?.length || 0,
          full: e,
        }))
      );
    } else {
      setError('No se pudo cargar la información de equipos');
    }
  } catch (e) {
    setError('Error de red o servidor');
  }
  setLoading(false);
};

export default function EquiposAvanzado() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchError, setSearchError] = useState('');
  const showHelp = false;
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [latestDiagnostico, setLatestDiagnostico] = useState(null);
  const [diagnosticoLoading, setDiagnosticoLoading] = useState(false);
  const [diagnosticoError, setDiagnosticoError] = useState('');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [estadoUpdateLoading, setEstadoUpdateLoading] = useState(false);
  const [estadoUpdateMessage, setEstadoUpdateMessage] = useState('');
  const [crearOrdenLoading, setCrearOrdenLoading] = useState(false);
  const [crearOrdenMessage, setCrearOrdenMessage] = useState('');
  const [editingEquipo, setEditingEquipo] = useState(null);
  const [equipoEditLoading, setEquipoEditLoading] = useState(false);
  const [equipoEditMessage, setEquipoEditMessage] = useState('');

  useEffect(() => {
    fetchEquipos(setEquipos, setLoading, setError);
  }, []);

  const tipoOptions = Array.from(new Set(equipos.map((equipo) => equipo.tipo).filter(Boolean)));
  const statusOptions = Array.from(new Set(equipos.map((equipo) => equipo.estado).filter(Boolean)));

  const normalizeTerm = (term) => term.trim().toLowerCase();
  const diagnosticoEstados = ['PENDIENTE', 'INGRESADO', 'EN_REVISION', 'DIAGNOSTICADO', 'COMPLETADO', 'APROBADO', 'RECHAZADO'];

  const fetchEquipoDiagnostico = async (equipoId) => {
    setDiagnosticoLoading(true);
    setDiagnosticoError('');
    setLatestDiagnostico(null);
    setEstadoSeleccionado('');
    try {
      const res = await api.get(`/admin_pro/equipos/${equipoId}/diagnostico`);
      const data = res.data?.data;
      setLatestDiagnostico(data);
      setEstadoSeleccionado(data?.estado_del_diagnostico || '');
    } catch (err) {
      setDiagnosticoError('No se pudo cargar el diagnóstico del equipo.');
    } finally {
      setDiagnosticoLoading(false);
    }
  };

  const handleViewHistory = async (equipo) => {
    setSelectedEquipo(equipo);
    setHistoryLoading(true);
    setHistoryError('');
    setHistorial([]);
    setCrearOrdenMessage('');
    setEstadoUpdateMessage('');
    try {
      const [historyRes] = await Promise.all([
        api.get(`/admin_pro/equipos/${equipo.id_equipo}/historial`),
      ]);
      const data = historyRes.data?.data || [];
      setHistorial(
        data.map((item) => ({
          fecha_hora: item.fecha_hora ? new Date(item.fecha_hora).toLocaleString() : '-',
          tecnico: item.tecnico?.nombre || '-',
          diagnostico_real: item.diagnostico_real || '-',
          estado_del_diagnostico: item.estado_del_diagnostico || '-',
          ordenes: item.ordenes?.length || 0,
        }))
      );
      await fetchEquipoDiagnostico(equipo.id_equipo);
    } catch (err) {
      setHistoryError('No se pudo cargar el historial del equipo.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleActualizarEstadoDiagnostico = async () => {
    if (!latestDiagnostico || !estadoSeleccionado) return;
    setEstadoUpdateLoading(true);
    setEstadoUpdateMessage('');
    try {
      const res = await api.patch(`/admin_pro/diagnosticos/${latestDiagnostico.id_diagnostico}/estado`, {
        estado_del_diagnostico: estadoSeleccionado,
      });
      setLatestDiagnostico(res.data.data);
      setEstadoUpdateMessage('Estado actualizado correctamente.');
      fetchEquipos(setEquipos, setLoading, setError);
    } catch (err) {
      setEstadoUpdateMessage('No se pudo actualizar el estado.');
    } finally {
      setEstadoUpdateLoading(false);
    }
  };

  const handleCrearOrden = async () => {
    if (!latestDiagnostico || latestDiagnostico.estado_del_diagnostico !== 'COMPLETADO') return;
    setCrearOrdenLoading(true);
    setCrearOrdenMessage('');
    try {
      const payload = {
        diagnostico_id: latestDiagnostico.id_diagnostico,
        tecnico_id: latestDiagnostico.tecnico?.id_tecnico || null,
        prioridad: 'Normal',
        estado: 'PENDIENTE',
      };
      const res = await api.post('/admin_pro/ordenes/crear', payload);
      setCrearOrdenMessage(`Orden creada con ID ${res.data.data.id_orden}`);
      fetchEquipos(setEquipos, setLoading, setError);
    } catch (err) {
      setCrearOrdenMessage(err.response?.data?.error || 'No se pudo crear la orden.');
    } finally {
      setCrearOrdenLoading(false);
    }
  };

  const openEquipoEdit = (equipo) => {
    setEditingEquipo({
      id_equipo: equipo.id_equipo,
      tipo: equipo.tipo === '-' ? '' : equipo.tipo,
      marca: equipo.marca === '-' ? '' : equipo.marca,
      modelo: equipo.modelo === '-' ? '' : equipo.modelo,
      numero_serie: equipo.numero_serie === '-' ? '' : equipo.numero_serie,
    });
    setEquipoEditMessage('');
  };

  const handleActualizarEquipo = async (event) => {
    event.preventDefault();
    if (!editingEquipo) return;

    setEquipoEditLoading(true);
    setEquipoEditMessage('');
    try {
      await api.put(`/admin_pro/equipos/${editingEquipo.id_equipo}`, {
        tipo: editingEquipo.tipo,
        marca: editingEquipo.marca,
        modelo: editingEquipo.modelo,
        numero_serie: editingEquipo.numero_serie,
      });
      setEquipoEditMessage('Equipo actualizado correctamente.');
      fetchEquipos(setEquipos, setLoading, setError);
      setTimeout(() => setEditingEquipo(null), 800);
    } catch (err) {
      setEquipoEditMessage(err.response?.data?.error || 'No se pudo actualizar el equipo.');
    } finally {
      setEquipoEditLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (/^\d+$/.test(value.trim()) && Number(value.trim()) <= 0) {
      setSearchError('Ingrese un ID de equipo válido mayor a 0');
    } else {
      setSearchError('');
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setFilterType('');
    setFilterStatus('');
    setSearchError('');
    setSelectedEquipo(null);
  };

  const filteredEquipos = equipos.filter((equipo) => {
    const term = normalizeTerm(searchText);
    const matchesSearch = !term || [
      equipo.id_equipo?.toString(),
      equipo.cliente,
      equipo.tipo,
      equipo.marca,
      equipo.modelo,
      equipo.numero_serie,
      equipo.estado,
    ].some((field) => field?.toString().toLowerCase().includes(term));

    const matchesType = !filterType || equipo.tipo === filterType;
    const matchesStatus = !filterStatus || equipo.estado === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const equiposWithActions = filteredEquipos.map((equipo) => ({
    ...equipo,
    onEdit: () => openEquipoEdit(equipo),
    onViewHistory: () => handleViewHistory(equipo),
  }));

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión avanzada de equipos</h1>
          <p className="text-gray-400 text-sm mt-0.5">Busca equipos, revisa su estado actual y consulta su historial.</p>
        </div>
      </div>

      {/* Banner de Ayuda */}
      {showHelp && (
        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm space-y-4 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold">Cómo usar el panel de equipos</h3>
            <p className="mt-1 text-sm text-slate-300">
              Filtra y localiza cualquier equipo registrado. Al hacer clic en <strong>Ver historial</strong>, podrás auditar el flujo de diagnósticos y generar órdenes de reparación instantáneas.
            </p>
          </div>
        </section>
      )}

      {/* Grid Superior de Métricas */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Encontrados</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{equiposWithActions.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtros Activos</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{(searchText || filterType || filterStatus) ? 'Sí' : 'No'}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Seleccionado</p>
          <p className="mt-2 text-base font-bold text-slate-700 truncate">{selectedEquipo ? selectedEquipo.modelo : 'Ninguno'}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estado Selección</p>
          <p className="mt-2 text-base font-bold text-indigo-600 truncate">{selectedEquipo ? selectedEquipo.estado : 'Ninguno'}</p>
        </div>
      </div>

      {/* Sección Filtros y Tabla Principal */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Equipos en taller</h2>
            <p className="text-sm text-gray-400">Usa los criterios globales para segmentar la lista.</p>
          </div>
          
          {/* Barra de Controles Organizada */}
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <input
                value={searchText}
                onChange={handleSearchChange}
                placeholder="Buscar por ID, cliente, marca, modelo o serie..."
                className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100/50 transition"
              />
            </div>
            <div className="md:col-span-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100/50 transition"
              >
                <option value="">Todos los tipos</option>
                {tipoOptions.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100/50 transition"
              >
                <option value="">Todos los estados</option>
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full inline-flex items-center justify-center rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                title="Limpiar filtros"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {searchError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{searchError}</div>}
        {loading && <div className="text-gray-400 text-center py-6">Cargando catálogo de equipos...</div>}
        {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            {equiposWithActions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                No se encontraron equipos que coincidan con los filtros aplicados.
              </div>
            ) : (
              <Table columns={columns} data={equiposWithActions} sortable />
            )}
          </div>
        )}
      </div>

      {/* Panel Detalle de Historial y Diagnóstico */}
      {selectedEquipo && (
        <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
          
          {/* Tabla de Historial (Izquierda) */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Línea de tiempo de servicio</h3>
              <p className="text-sm text-gray-400">Historial completo para: {selectedEquipo.marca} {selectedEquipo.modelo}</p>
            </div>
            {historyLoading ? (
              <div className="text-gray-400 py-4 text-center">Cargando logs...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  columns={[
                    { header: 'Fecha', accessor: 'fecha_hora' },
                    { header: 'Técnico', accessor: 'tecnico' },
                    { header: 'Diagnóstico', accessor: 'diagnostico_real' },
                    { header: 'Estado', accessor: 'estado_del_diagnostico' },
                  ]}
                  data={historial}
                  sortable
                />
              </div>
            )}
          </div>

          {/* Acciones Rápidas de Diagnóstico (Derecha) */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Acciones del Diagnóstico</h3>
              <p className="text-sm text-gray-400">Gestión directa sobre el último estado.</p>
            </div>

            {diagnosticoLoading && <div className="text-gray-400 text-sm">Consultando estado actual de orden...</div>}
            
            {!diagnosticoLoading && latestDiagnostico && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-100 space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase">Diagnóstico Técnico</p>
                  <p className="text-sm text-slate-700 font-medium">{latestDiagnostico.diagnostico_real || 'Pendiente de revisión física.'}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cambiar estado del flujo</label>
                  <select
                    value={estadoSeleccionado}
                    onChange={(e) => setEstadoSeleccionado(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Selecciona un estado</option>
                    {diagnosticoEstados.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleActualizarEstadoDiagnostico}
                  disabled={estadoUpdateLoading}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:bg-slate-300 shadow-sm"
                >
                  {estadoUpdateLoading ? 'Guardando...' : 'Actualizar Estado'}
                </button>

                {latestDiagnostico.estado_del_diagnostico === 'COMPLETADO' && (
                  <button
                    type="button"
                    onClick={handleCrearOrden}
                    disabled={crearOrdenLoading}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:bg-slate-300 shadow-sm"
                  >
                    {crearOrdenLoading ? 'Procesando...' : 'Generar Orden de Trabajo'}
                  </button>
                )}

                {(estadoUpdateMessage || crearOrdenMessage) && (
                  <div className="p-3 bg-slate-50 text-xs text-slate-600 rounded-xl text-center border border-gray-100 font-medium">
                    {estadoUpdateMessage || crearOrdenMessage}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {editingEquipo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-800">Editar equipo</h3>
              <p className="text-sm text-gray-400">Equipo #{editingEquipo.id_equipo}</p>
            </div>

            <form onSubmit={handleActualizarEquipo} className="space-y-4">
              {[
                ['tipo', 'Tipo'],
                ['marca', 'Marca'],
                ['modelo', 'Modelo'],
                ['numero_serie', 'Numero de serie'],
              ].map(([name, label]) => (
                <label key={name} className="block">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <input
                    type="text"
                    value={editingEquipo[name] || ''}
                    onChange={(e) => setEditingEquipo((prev) => ({ ...prev, [name]: e.target.value }))}
                    className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50"
                  />
                </label>
              ))}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEquipo(null)}
                  className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={equipoEditLoading}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-400"
                >
                  {equipoEditLoading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>

              {equipoEditMessage && <div className="text-center text-sm font-semibold text-indigo-600">{equipoEditMessage}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}