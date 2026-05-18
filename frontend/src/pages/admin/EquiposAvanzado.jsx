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
      <button
        type="button"
        onClick={row.onViewHistory}
        className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
      >
        Ver historial
      </button>
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
  const [showHelp, setShowHelp] = useState(false);
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
    if (!latestDiagnostico) {
      setEstadoUpdateMessage('Selecciona primero un equipo para ver su diagnóstico.');
      return;
    }

    if (!estadoSeleccionado) {
      setEstadoUpdateMessage('Selecciona un estado válido de la lista.');
      return;
    }

    if (estadoSeleccionado === latestDiagnostico.estado_del_diagnostico) {
      setEstadoUpdateMessage('El diagnóstico ya está en ese estado.');
      return;
    }

    setEstadoUpdateLoading(true);
    setEstadoUpdateMessage('');

    try {
      const res = await api.patch(`/admin_pro/diagnosticos/${latestDiagnostico.id_diagnostico}/estado`, {
        estado_del_diagnostico: estadoSeleccionado,
      });
      setLatestDiagnostico(res.data.data);
      setEstadoUpdateMessage('Estado de diagnóstico actualizado correctamente.');
      fetchEquipos(setEquipos, setLoading, setError);
    } catch (err) {
      setEstadoUpdateMessage('No se pudo actualizar el estado del diagnóstico.');
    } finally {
      setEstadoUpdateLoading(false);
    }
  };

  const handleCrearOrden = async () => {
    if (!latestDiagnostico) {
      setCrearOrdenMessage('Selecciona primero un diagnóstico para crear la orden.');
      return;
    }

    if (latestDiagnostico.estado_del_diagnostico !== 'COMPLETADO') {
      setCrearOrdenMessage('Solo se puede crear una orden desde un diagnóstico completado.');
      return;
    }

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
      setCrearOrdenMessage(
        err.response?.data?.error || 'No se pudo crear la orden desde el diagnóstico.'
      );
    } finally {
      setCrearOrdenLoading(false);
    }
  };

  const validateSearch = (value) => {
    const term = value.trim();
    if (!term) {
      setSearchError('');
      return;
    }

    if (/^\d+$/.test(term) && Number(term) <= 0) {
      setSearchError('Ingrese un ID de equipo válido mayor a 0');
      return;
    }

    setSearchError('');
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    validateSearch(e.target.value);
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
    onViewHistory: () => handleViewHistory(equipo),
  }));
  const filtrosActivos = Boolean(searchText.trim() || filterType || filterStatus);
  const historialSeleccionado = selectedEquipo ? selectedEquipo.modelo || `Equipo #${selectedEquipo.id_equipo}` : 'Ninguno';

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión avanzada de equipos</h2>
          <p className="text-gray-500 mt-1">Busca equipos, revisa su estado actual y consulta su historial de movimientos.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          {showHelp ? 'Ocultar ayuda' : 'Ayuda'}
        </button>
      </div>

      {showHelp && (
        <section className="rounded-3xl bg-slate-50 p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold">Cómo usar el panel de equipos</h3>
          <p className="mt-2 text-sm text-slate-600 leading-7">
            Usa la búsqueda para encontrar equipos por ID, cliente, tipo, marca, modelo, serie o estado. Filtra por tipo y estado
            para ver sólo los equipos relevantes.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 border border-slate-200">
              <p className="text-sm font-semibold text-slate-800">Ver historial</p>
              <p className="mt-2 text-sm text-slate-600">Haz clic en "Ver historial" para revisar los movimientos y el diagnóstico más reciente.</p>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-200">
              <p className="text-sm font-semibold text-slate-800">Acciones rápidas</p>
              <p className="mt-2 text-sm text-slate-600">Actualiza el estado del diagnóstico y crea órdenes directamente sin cambiar de pantalla.</p>
            </div>
          </div>
        </section>
      )}

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Equipos en servicio</h3>
                <p className="text-sm text-gray-500">Consulta equipos, filtra por tipo, estado o ID, y revisa su historial de servicio.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.2fr)_minmax(160px,0.7fr)_minmax(160px,0.7fr)_auto]">
                <input
                  value={searchText}
                  onChange={handleSearchChange}
                  placeholder="Buscar por ID, cliente, tipo, marca, modelo, serie o estado"
                  className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Filtrar por tipo</option>
                  {tipoOptions.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Filtrar por estado</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-sm text-gray-500">Total encontrados</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{equiposWithActions.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-sm text-gray-500">Filtros activos</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{filtrosActivos ? 'Si' : 'No'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-sm text-gray-500">Historial seleccionado</p>
                <p className="mt-2 text-xl font-semibold text-slate-900 break-words">{historialSeleccionado}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-sm text-gray-500">Estado del equipo</p>
                <p className="mt-2 text-xl font-semibold text-slate-900 break-words">{selectedEquipo ? selectedEquipo.estado : 'Ninguno'}</p>
              </div>
            </div>
            {searchError && <div className="mt-4 text-sm text-red-600">{searchError}</div>}
            {loading && <div className="mt-4 text-gray-600">Cargando equipos...</div>}
            {error && <div className="mt-4 text-red-600">{error}</div>}
            {!loading && !error && (
              <>
                {filteredEquipos.length === 0 ? (
                  <div className="mt-6 grid gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-5 text-amber-900 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <h4 className="text-base font-semibold">No hay equipos con esos criterios</h4>
                      <p className="mt-2 text-sm leading-6">
                        Ajusta el ID, cliente, tipo, marca, modelo, serie o estado. Tambien puedes limpiar filtros para volver a la vista completa.
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-white/80 p-3">
                          <p className="text-xs font-semibold uppercase text-amber-700">Busqueda</p>
                          <p className="mt-1 text-sm">{searchText || 'Sin texto'}</p>
                        </div>
                        <div className="rounded-xl bg-white/80 p-3">
                          <p className="text-xs font-semibold uppercase text-amber-700">Tipo</p>
                          <p className="mt-1 text-sm">{filterType || 'Todos'}</p>
                        </div>
                        <div className="rounded-xl bg-white/80 p-3">
                          <p className="text-xs font-semibold uppercase text-amber-700">Estado</p>
                          <p className="mt-1 text-sm">{filterStatus || 'Todos'}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center justify-center rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                    >
                      Limpiar busqueda
                    </button>
                  </div>
                ) : (
                  <Table columns={columns} data={equiposWithActions} />
                )}
              </>
            )}
          </div>

          {selectedEquipo && (
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Historial del equipo</h3>
                  <p className="text-sm text-gray-500">Equipo: {selectedEquipo.modelo} · Cliente: {selectedEquipo.cliente}</p>
                </div>
                <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{selectedEquipo.estado}</span>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_minmax(280px,360px)]">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <h4 className="text-base font-semibold text-slate-800">Último diagnóstico</h4>
                  {diagnosticoLoading && <div className="mt-4 text-gray-600">Cargando diagnóstico...</div>}
                  {diagnosticoError && <div className="mt-4 text-red-600">{diagnosticoError}</div>}
                  {!diagnosticoLoading && !diagnosticoError && latestDiagnostico && (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">ID diagnóstico</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{latestDiagnostico.id_diagnostico}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                          <p className="text-sm text-gray-500">Estado actual</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{latestDiagnostico.estado_del_diagnostico || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                          <p className="text-sm text-gray-500">Técnico asignado</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{latestDiagnostico.tecnico?.nombre || 'Sin técnico'}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Diagnóstico</p>
                        <p className="mt-1 text-sm text-slate-900">{latestDiagnostico.diagnostico_real || 'Pendiente de revisión'}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Órdenes vinculadas</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{latestDiagnostico.ordenes?.length || 0}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl bg-slate-50 p-4">
                  <h4 className="text-base font-semibold text-slate-800">Acciones de diagnóstico rápido</h4>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Actualizar estado</label>
                      <select
                        value={estadoSeleccionado}
                        onChange={(e) => setEstadoSeleccionado(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">Selecciona un estado</option>
                        {diagnosticoEstados.map((estado) => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleActualizarEstadoDiagnostico}
                      disabled={estadoUpdateLoading || !latestDiagnostico}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {estadoUpdateLoading ? 'Actualizando...' : 'Guardar estado'
                      }
                    </button>
                    {estadoUpdateMessage && (
                      <div className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">{estadoUpdateMessage}</div>
                    )}
                    <button
                      type="button"
                      onClick={handleCrearOrden}
                      disabled={crearOrdenLoading || !latestDiagnostico || latestDiagnostico.estado_del_diagnostico !== 'COMPLETADO'}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {crearOrdenLoading ? 'Creando orden...' : 'Crear orden desde diagnóstico'}
                    </button>
                    {crearOrdenMessage && (
                      <div className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">{crearOrdenMessage}</div>
                    )}
                    <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500">Vista rápida</p>
                      <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                        Usa esta acción cuando necesites mover rápidamente un diagnóstico al siguiente estado sin salir del panel.
                        También puedes usarlo para normalizar diagnósticos que están en un estado incorrecto.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {historyLoading && <div className="mt-4 text-gray-600">Cargando historial...</div>}
              {historyError && <div className="mt-4 text-red-600">{historyError}</div>}
              {!historyLoading && !historyError && (
                <Table
                  columns={[
                    { header: 'Fecha', accessor: 'fecha_hora' },
                    { header: 'Técnico', accessor: 'tecnico' },
                    { header: 'Diagnóstico', accessor: 'diagnostico_real' },
                    { header: 'Estado', accessor: 'estado_del_diagnostico' },
                    { header: 'Órdenes', accessor: 'ordenes' },
                  ]}
                  data={historial}
                />
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm min-h-[220px]">
            <h3 className="text-lg font-semibold">Visión administrativa</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Desde aquí puedes buscar equipos por cliente, tipo o estado, y consultar su flujo de trabajo completo.
              Esta información es útil para supervisar reparaciones, prevenir retrasos y priorizar órdenes críticas.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-800 p-4">
                <p className="text-sm text-slate-300">Total encontrados</p>
                <p className="mt-2 text-2xl font-semibold text-white">{equiposWithActions.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-800 p-4">
                <p className="text-sm text-slate-300">Filtros activos</p>
                <p className="mt-2 text-2xl font-semibold text-white">{filterType || filterStatus ? 'Sí' : 'No'}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 min-h-[160px]">
            <h3 className="text-lg font-semibold">Indicadores rápidos</h3>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Equipos mostrados</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{equiposWithActions.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Historial seleccionado</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedEquipo ? selectedEquipo.modelo : 'Ninguno'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Estado del equipo</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedEquipo ? selectedEquipo.estado : 'Ninguno'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
