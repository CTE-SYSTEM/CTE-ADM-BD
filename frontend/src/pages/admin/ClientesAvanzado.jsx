import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const COLUMNS = [
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Teléfono', accessor: 'telefono' },
  { header: 'Equipos', accessor: 'total_equipos' },
  { header: 'Diagnósticos', accessor: 'total_diagnosticos' },
  { header: 'Órdenes', accessor: 'total_ordenes' },
  { header: 'Última visita', accessor: 'ultima_visita' },
];

export default function ClientesAvanzado() {
  const [clientes, setClientes] = useState([]);
  const [clientesBase, setClientesBase] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [editingCliente, setEditingCliente] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  // Estados para el buscador multiparámetro
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParam, setSearchParam] = useState('global'); // 'global', 'cliente', 'telefono'

  // Petición de datos a la API
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('fecha_inicio', fromDate);
      if (toDate) params.append('fecha_fin', toDate);
      const query = params.toString();
      const [reportRes, clientesRes] = await Promise.all([
        api.get(`/admin_pro/reportes/equipos_cliente${query ? `?${query}` : ''}`),
        api.get('/clientes'),
      ]);
      const data = reportRes.data?.data || [];
      const clientesActivos = clientesRes.data?.data || [];
      setClientesBase(clientesActivos);
      
      const formateados = data.map((item) => ({
        ...item,
        raw_equipos: Number(item.total_equipos) || 0,
        raw_ordenes: Number(item.total_ordenes) || 0,
        ultima_visita: item.ultima_visita 
          ? new Date(item.ultima_visita).toLocaleDateString() 
          : '-',
      }));
      
      setClientes(formateados);
    } catch (err) {
      setError('No se pudo cargar la información de clientes.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Lógica de filtrado multiparámetro (Optimizada con useMemo)
  const clientesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return clientes;

    const normalizeText = (text) => 
      String(text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const term = normalizeText(searchTerm);

    return clientes.filter((item) => {
      const clienteMatch = normalizeText(item.cliente).includes(term);
      const telefonoMatch = normalizeText(item.telefono).includes(term);

      if (searchParam === 'cliente') return clienteMatch;
      if (searchParam === 'telefono') return telefonoMatch;
      
      // 'global' -> Busca en cualquiera de los dos campos
      return clienteMatch || telefonoMatch;
    });
  }, [clientes, searchTerm, searchParam]);

  const openEditCliente = (row) => {
    const base = clientesBase.find((cliente) => String(cliente.id_cliente) === String(row.id_cliente)) || {};
    setEditingCliente({
      id_cliente: row.id_cliente || base.id_cliente,
      nombre: base.nombre || row.cliente || '',
      telefono: base.telefono || row.telefono || '',
      direccion: base.direccion || '',
      correo: base.correo || '',
      contacto_secundario: base.contacto_secundario || '',
    });
    setEditMessage('');
  };

  const handleUpdateCliente = async (event) => {
    event.preventDefault();
    if (!editingCliente?.id_cliente) return;

    setEditLoading(true);
    setEditMessage('');
    try {
      await api.put(`/clientes/${editingCliente.id_cliente}`, {
        nombre: editingCliente.nombre,
        telefono: editingCliente.telefono,
        direccion: editingCliente.direccion,
        correo: editingCliente.correo,
        contacto_secundario: editingCliente.contacto_secundario,
      });
      setEditMessage('Cliente actualizado correctamente.');
      await fetchClientes();
      window.setTimeout(() => setEditingCliente(null), 800);
    } catch (err) {
      setEditMessage(err.response?.data?.error || 'No se pudo actualizar el cliente.');
    } finally {
      setEditLoading(false);
    }
  };

  const columns = useMemo(() => [
    ...COLUMNS,
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <button
          type="button"
          onClick={() => openEditCliente(row)}
          className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700"
        >
          Editar
        </button>
      ),
    },
  ], [clientesBase]);

  // Handlers para Descargas de Reportes utilizando la lista filtrada
  const downloadClientesCsv = () => {
    setDownloading(true);
    try {
      downloadJsonCsv(clientesFiltrados, COLUMNS, 'clientes_equipos.csv');
    } catch (err) {
      setError('No se pudo descargar el reporte en Excel.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadClientesPdf = () => {
    setDownloading(true);
    try {
      downloadJsonPdf(clientesFiltrados, COLUMNS, 'clientes_equipos.pdf', 'Clientes y equipos');
    } catch (err) {
      setError('No se pudo descargar el reporte en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  // Cálculos derivados del estado en tiempo real (basados en los datos filtrados)
  const totalEquiposGarantia = clientesFiltrados.reduce((total, item) => total + (item.raw_equipos || 0), 0);
  const totalOrdenesAsignadas = clientesFiltrados.reduce((total, item) => total + (item.raw_ordenes || 0), 0);

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado Principal */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Clientes y equipos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Identifica clientes clave, volumen de dispositivos ingresados y la última actividad registrada en el centro.</p>
      </div>

      {/* Grid Dinámico de KPIs */}
      {!loading && !error && clientes.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Base de Clientes</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{clientesFiltrados.length} usuarios</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Historial de Equipos</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{totalEquiposGarantia} unidades</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Servicios Vinculados</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{totalOrdenesAsignadas} órdenes</p>
          </div>
        </div>
      )}

      {/* Contenedor Principal de la Tabla */}
      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
        
        {/* Barra de Herramientas: Título, Buscador y Exportaciones */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-50 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Resumen de clientes</h2>
            <p className="text-sm text-gray-400">Auditoría de activos, diagnósticos parciales y flujos de trabajo.</p>
          </div>

          {/* Bloque de Búsqueda y Filtros */}
          <div className="flex flex-col gap-2 w-full lg:w-auto">
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-gray-400">Desde</span>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-gray-400">Hasta</span>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500" />
              </label>
              <button type="button" onClick={fetchClientes} disabled={loading} className="self-end rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:bg-slate-300">
                Aplicar
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-1 items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 focus-within:border-indigo-500 focus-within:bg-white transition">
              <select
                value={searchParam}
                onChange={(e) => setSearchParam(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-600 outline-none cursor-pointer border-r border-gray-200 pr-2 mr-1 h-full"
              >
                <option value="global">Todo</option>
                <option value="cliente">Cliente</option>
                <option value="telefono">Teléfono</option>
              </select>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Botones de Acción de Reportes */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={downloadClientesCsv}
                disabled={downloading || loading || clientesFiltrados.length === 0}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400 whitespace-nowrap"
              >
                Exportar Excel
              </button>
              <button
                type="button"
                onClick={downloadClientesPdf}
                disabled={downloading || loading || clientesFiltrados.length === 0}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400 whitespace-nowrap"
              >
                Exportar PDF
              </button>
            </div>
            </div>
          </div>
        </div>

        {/* Estados Dinámicos: Carga, Error o Tabla */}
        {loading && (
          <div className="text-gray-400 text-center py-10 text-sm">
            Procesando registros de la cartera...
          </div>
        )}
        
        {error && (
          <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}
        
        {!loading && !error && (
          <div className="overflow-x-auto">
            {clientesFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-sm">
                {clientes.length === 0 
                  ? "No se registran datos o movimientos de clientes disponibles en este momento."
                  : "No se encontraron resultados que coincidan con la búsqueda."}
              </div>
            ) : (
              <Table columns={columns} data={clientesFiltrados} sortable />
            )}
          </div>
        )}
      </section>

      {editingCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-800">Editar cliente</h3>
              <p className="text-sm text-gray-400">Cliente #{editingCliente.id_cliente}</p>
            </div>

            <form onSubmit={handleUpdateCliente} className="grid gap-4 md:grid-cols-2">
              {[
                ['nombre', 'Nombre'],
                ['telefono', 'Telefono'],
                ['correo', 'Correo'],
                ['contacto_secundario', 'Contacto secundario'],
              ].map(([name, label]) => (
                <label key={name} className="block">
                  <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
                  <input
                    type={name === 'correo' ? 'email' : 'text'}
                    required={name === 'nombre' || name === 'telefono'}
                    value={editingCliente[name] || ''}
                    onChange={(event) => setEditingCliente((prev) => ({ ...prev, [name]: event.target.value }))}
                    className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </label>
              ))}

              <label className="block md:col-span-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Direccion</span>
                <textarea
                  value={editingCliente.direccion || ''}
                  onChange={(event) => setEditingCliente((prev) => ({ ...prev, direccion: event.target.value }))}
                  className="mt-1.5 block min-h-20 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </label>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingCliente(null)} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200">
                  Cancelar
                </button>
                <button type="submit" disabled={editLoading} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-400">
                  {editLoading ? 'Guardando...' : 'Guardar cambios'}
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
