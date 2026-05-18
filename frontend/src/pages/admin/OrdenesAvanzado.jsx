import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { header: 'ID', accessor: 'id_orden' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Estado', accessor: 'estado' },
  { header: 'Técnico', accessor: 'tecnico' },
  { header: 'Facturas', accessor: 'facturas' },
  {
    header: 'Acciones',
    accessor: 'acciones',
    render: (row) => (
      <button
        type="button"
        onClick={row.onShowDetails}
        className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
      >
        Ver / Editar
      </button>
    ),
  },
];

const statusOptions = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'REPARACION', label: 'En reparación' },
  { value: 'FINALIZADO', label: 'Finalizado' },
];

const fetchOrdenes = async (setOrdenes, setLoading, setError) => {
  setLoading(true);
  try {
    const res = await api.get('/admin_pro/ordenes');
    const data = res.data;
    if (data.data) {
      setOrdenes(
        data.data.map((o) => ({
          id_orden: o.id_orden,
          equipo: o.diagnostico?.equipo?.modelo || '-',
          cliente: o.diagnostico?.equipo?.cliente?.nombre || '-',
          estado: o.estado || '-',
          tecnico: o.tecnico?.nombre || 'Sin asignar',
          tecnico_id: o.tecnico?.id_tecnico || null,
          prioridades: o.prioridad || '-',
          facturas: o.facturas?.length || 0,
          diagnostico: o.diagnostico || null,
          raw: o,
        }))
      );
    } else {
      setError('No se pudo cargar la información de órdenes');
    }
  } catch (e) {
    setError('Error de red o servidor');
  }
  setLoading(false);
};

export default function OrdenesAvanzado() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [status, setStatus] = useState('');
  const [assignedTechnician, setAssignedTechnician] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [repuestosOrden, setRepuestosOrden] = useState([]);
  const [repuestoLoading, setRepuestoLoading] = useState(false);
  const [repuestoError, setRepuestoError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchOrdenes(setOrdenes, setLoading, setError);
    api.get('/tecnicos')
      .then((response) => setTechnicians(response.data?.data || []))
      .catch(() => {});
  }, []);

  const loadRepuestosOrden = async (ordenId) => {
    setRepuestoLoading(true);
    setRepuestoError('');
    setRepuestosOrden([]);

    try {
      const res = await api.get(`/admin_pro/ordenes/${ordenId}/repuestos`);
      setRepuestosOrden(res.data?.data || []);
    } catch (err) {
      setRepuestoError(err.response?.data?.error || 'No se pudo cargar los repuestos de la orden.');
    } finally {
      setRepuestoLoading(false);
    }
  };

  const handleShowDetails = (orden) => {
    setSelectedOrden(orden);
    setStatus(orden.estado);
    setAssignedTechnician(orden.tecnico_id);
    setMessage('');
    loadRepuestosOrden(orden.id_orden);
  };

  const handleDownloadRepuestosReport = async () => {
    if (!selectedOrden) return;
    setDownloading(true);
    setMessage('');
    try {
      const response = await api.get(`/admin_pro/ordenes/${selectedOrden.id_orden}/repuestos/reporte`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `repuestos-orden-${selectedOrden.id_orden}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage('Reporte descargado correctamente.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'No se pudo generar el reporte.');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpdateOrden = async () => {
    if (!selectedOrden) return;
    setSaving(true);
    setMessage('');

    try {
      await api.put(`/admin_pro/ordenes/${selectedOrden.id_orden}`, {
        estado: status,
        tecnico_id: assignedTechnician,
      });
      setMessage('Orden actualizada correctamente.');
      fetchOrdenes(setOrdenes, setLoading, setError);
      setSelectedOrden((prev) => ({ ...prev, estado: status, tecnico_id: assignedTechnician }));
    } catch (err) {
      setMessage(err.response?.data?.error || 'No se pudo actualizar la orden.');
    } finally {
      setSaving(false);
    }
  };

  const ordenesWithActions = ordenes.map((orden) => ({
    ...orden,
    onShowDetails: () => handleShowDetails(orden),
  }));

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestión avanzada de órdenes</h2>
        <p className="text-gray-500 mt-1">Supervisa y actualiza el estado de órdenes, revisa técnicos asignados y prioriza el trabajo.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          {loading && <div className="text-gray-600">Cargando órdenes...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && <Table columns={columns} data={ordenesWithActions} />}
        </section>

        <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm border border-slate-800">
          <h3 className="text-lg font-semibold">Panel de acción rápida</h3>
          <p className="mt-2 text-sm text-slate-300">Selecciona una orden para ver detalles y cambiar su estado.</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Órdenes totales</p>
              <p className="mt-2 text-3xl font-semibold">{ordenes.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Técnicos disponibles</p>
              <p className="mt-2 text-3xl font-semibold">{technicians.length}</p>
            </div>
          </div>
        </aside>
      </div>

      {selectedOrden && (
        <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Editar orden #{selectedOrden.id_orden}</h3>
              <p className="text-sm text-gray-500">Cliente: {selectedOrden.cliente} · Equipo: {selectedOrden.equipo}</p>
            </div>
            <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">Estado actual: {selectedOrden.estado}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Cambiar estado</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Asignar técnico</span>
              <select
                value={assignedTechnician || ''}
                onChange={(e) => setAssignedTechnician(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Sin asignar</option>
                {technicians.map((tech) => (
                  <option key={tech.id_tecnico} value={tech.id_tecnico}>{tech.nombre}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleUpdateOrden}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={handleDownloadRepuestosReport}
              disabled={downloading}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {downloading ? 'Generando reporte...' : 'Generar reporte de repuestos'}
            </button>
          </div>

          {message && <div className="mt-4 text-sm text-slate-600">{message}</div>}

          <div className="mt-8 rounded-3xl bg-slate-50 p-5 border border-gray-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold">Repuestos en esta orden</h4>
                <p className="text-sm text-gray-500">Revisa todas las piezas solicitadas y su estado de aprobación.</p>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">{repuestosOrden.length} ítems</span>
            </div>

            {repuestoLoading && <div className="text-gray-600">Cargando repuestos...</div>}
            {repuestoError && <div className="text-red-600">{repuestoError}</div>}
            {!repuestoLoading && !repuestoError && (
              <Table
                columns={[
                  { header: 'Repuesto', accessor: 'nombre' },
                  { header: 'Categoría', accessor: 'categoria' },
                  { header: 'Pieza solicitada', accessor: 'pieza_solicitada' },
                  { header: 'Cantidad', accessor: 'cantidad_usada' },
                  { header: 'Aprobación', accessor: 'estado_aprobacion' },
                  { header: 'Costo', accessor: 'costo_unitario' },
                ]}
                data={repuestosOrden}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
