import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

const transformGarantias = (garantias) =>
  garantias.map((g) => {
    const fechaVencimiento = g.fecha_vencimiento ? new Date(g.fecha_vencimiento) : null;
    const isExpired = fechaVencimiento ? fechaVencimiento < new Date() : true;
    return {
      id_garantia: g.id_garantia,
      factura_id: g.factura_id,
      orden_id: g.factura?.orden?.id_orden || '-',
      cliente: g.factura?.orden?.diagnostico?.equipo?.cliente?.nombre || '-',
      equipo: g.factura?.orden?.diagnostico?.equipo?.modelo || '-',
      fecha_inicio: g.fecha_inicio ? new Date(g.fecha_inicio).toLocaleDateString() : '-',
      fecha_vencimiento: g.fecha_vencimiento ? new Date(g.fecha_vencimiento).toLocaleDateString() : '-',
      duracion_meses: g.duracion_meses ?? '-',
      condiciones: g.condiciones || '-',
      estado: isExpired ? 'Vencida' : 'Vigente',
      isExpired,
      duracion_actual: g.duracion_meses ?? 12,
    };
  });

export default function GarantiasAvanzado() {
  const [garantias, setGarantias] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [equiposGarantia, setEquiposGarantia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [facturaId, setFacturaId] = useState('');
  const [condiciones, setCondiciones] = useState('');
  const [duracionMeses, setDuracionMeses] = useState('12');
  const [equipoSearch, setEquipoSearch] = useState('');
  const [selectedEquipoId, setSelectedEquipoId] = useState('');
  const [createMessage, setCreateMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const columns = [
    { header: 'ID Garantia', accessor: 'id_garantia' },
    { header: 'Factura', accessor: 'factura_id' },
    { header: 'Orden', accessor: 'orden_id' },
    { header: 'Cliente', accessor: 'cliente' },
    { header: 'Equipo', accessor: 'equipo' },
    { header: 'Inicio', accessor: 'fecha_inicio' },
    { header: 'Vence', accessor: 'fecha_vencimiento' },
    { header: 'Duracion (meses)', accessor: 'duracion_meses' },
    { header: 'Estado', accessor: 'estado' },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <div className="flex flex-col items-center justify-center gap-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleRenewGarantia(row.id_garantia, row.duracion_actual)}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition"
          >
            Revalidar
          </button>
          <span className={`text-xs font-semibold ${row.isExpired ? 'text-red-600' : 'text-green-600'}`}>
            {row.estado}
          </span>
        </div>
      ),
    },
    { header: 'Condiciones', accessor: 'condiciones' },
  ];

  const equiposColumns = [
    { header: 'Equipo', accessor: 'id_equipo' },
    { header: 'Cliente', accessor: 'cliente' },
    { header: 'Detalle', accessor: 'equipo' },
    { header: 'Factura', accessor: 'factura_id' },
    { header: 'Garantia', accessor: 'garantia_id' },
    { header: 'Estado', accessor: 'estado' },
    {
      header: 'Accion',
      accessor: 'accion',
      render: (row) => (
        <button
          type="button"
          disabled={isProcessing || row.accion === 'Sin factura'}
          onClick={() => handleEquipoGarantiaAction(row)}
          className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
            row.garantia ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {row.accion}
        </button>
      ),
    },
  ];

  const fetchGarantias = async () => {
    setLoading(true);
    setError('');
    try {
      const [garantiasRes, facturasRes, equiposRes] = await Promise.all([
        api.get('/admin_pro/garantias'),
        api.get('/admin_pro/facturas'),
        api.get('/admin_pro/equipos'),
      ]);
      const data = garantiasRes.data?.data || [];
      setGarantias(transformGarantias(data));
      setFacturas(facturasRes.data?.data || []);
      setEquiposGarantia(equiposRes.data?.data || []);
    } catch (err) {
      setError('Error al cargar Garantias.');
    } finally {
      setLoading(false);
    }
  };

  const getFacturaEquipoId = (factura) => factura?.orden?.diagnostico?.equipo?.id_equipo;
  const getFacturaGarantia = (factura) => garantias.find((garantia) => Number(garantia.factura_id) === Number(factura.id_factura));
  const getEquipoLabel = (equipo) => [equipo.marca, equipo.modelo, equipo.tipo].filter(Boolean).join(' ') || `Equipo #${equipo.id_equipo}`;

  const equiposRevalidacion = equiposGarantia
    .map((equipo) => {
      const facturasEquipo = facturas
        .filter((factura) => Number(getFacturaEquipoId(factura)) === Number(equipo.id_equipo))
        .sort((a, b) => new Date(b.fecha_emision || 0) - new Date(a.fecha_emision || 0));
      const garantia = facturasEquipo.map(getFacturaGarantia).find(Boolean);
      const facturaAsignable = facturasEquipo.find((factura) => !getFacturaGarantia(factura)) || facturasEquipo[0] || null;

      return {
        id_equipo: equipo.id_equipo,
        cliente: equipo.cliente?.nombre || '-',
        equipo: getEquipoLabel(equipo),
        factura_id: facturaAsignable?.id_factura || garantia?.factura_id || '-',
        garantia_id: garantia?.id_garantia || '-',
        estado: garantia ? garantia.estado : 'Sin garantia',
        accion: garantia ? 'Revalidar garantia' : (facturaAsignable ? 'Asignar garantia' : 'Sin factura'),
        garantia,
        facturaAsignable,
      };
    })
    .filter((equipo) => {
      const term = equipoSearch.trim().toLowerCase();
      if (!term) return true;
      return [equipo.id_equipo, equipo.cliente, equipo.equipo, equipo.estado, equipo.factura_id]
        .some((field) => field?.toString().toLowerCase().includes(term));
    });

  const selectedEquipo = equiposRevalidacion.find((equipo) => Number(equipo.id_equipo) === Number(selectedEquipoId));

  const handleEquipoGarantiaAction = async (equipo) => {
    if (!equipo) return;
    setIsProcessing(true);
    setError('');
    setCreateMessage('');
    setActionMessage('');

    try {
      if (equipo.garantia) {
        const res = await api.post(`/admin_pro/garantias/${equipo.garantia.id_garantia}/renovar`, {
          duracion_meses: Number(duracionMeses) || Number(equipo.garantia.duracion_actual) || 12,
          condiciones: condiciones || equipo.garantia.condiciones,
        });
        setActionMessage(res.data?.message || 'Garantia revalidada correctamente.');
      } else if (equipo.facturaAsignable) {
        const res = await api.post('/admin_pro/garantias', {
          factura_id: Number(equipo.facturaAsignable.id_factura),
          condiciones,
          duracion_meses: Number(duracionMeses) || 12,
        });
        setCreateMessage(res.data?.message || 'Garantia asignada correctamente al equipo.');
      } else {
        setError('Este equipo no tiene una factura asociada. Primero debe existir una factura para poder asignarle garantia.');
        return;
      }

      setCondiciones('');
      setDuracionMeses('12');
      await fetchGarantias();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo procesar la garantia del equipo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCreateMessage('');
    setActionMessage('');
    setError('');

    if (!facturaId || !duracionMeses) {
      setError('Factura y Duracion son obligatorios.');
      return;
    }

    try {
      const res = await api.post('/admin_pro/garantias', {
        factura_id: Number(facturaId),
        condiciones,
        duracion_meses: Number(duracionMeses),
      });

      setCreateMessage(res.data?.message || 'Garantia creada correctamente.');
      setFacturaId('');
      setCondiciones('');
      setDuracionMeses('12');
      fetchGarantias();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la Garantia.');
    }
  };

  const handleRenewGarantia = async (id, duracion) => {
    setIsProcessing(true);
    setError('');
    setCreateMessage('');
    setActionMessage('');

    try {
      const res = await api.post(`/admin_pro/garantias/${id}/renovar`, {
        duracion_meses: Number(duracion) || 12,
      });
      setActionMessage(res.data?.message || 'Garantia revalidada correctamente.');
      fetchGarantias();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo revalidar la Garantia.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadGarantiasCsv = async () => {
    setDownloading(true);
    try {
      downloadJsonCsv(garantias, columns, 'garantias.csv');
    } catch (err) {
      setError('No se pudo descargar el reporte.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadGarantiasPdf = async () => {
    setDownloading(true);
    try {
      downloadJsonPdf(garantias, columns, 'garantias.pdf', 'Reporte de Garantias');
    } catch (err) {
      setError('No se pudo descargar el reporte en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchGarantias();
  }, []);

  const totalGarantias = garantias.length;
  const vigentes = garantias.filter((g) => !g.isExpired).length;
  const vencidas = garantias.filter((g) => g.isExpired).length;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestión de Garantias</h2>
        <p className="text-sm text-gray-500">Controla el ciclo de vida de Garantias y revalida las que corresponda.</p>
      </div>

      <section className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Revalidacion y asignacion por equipo</h3>
            <p className="text-sm text-gray-500">
              Si el equipo ya tiene garantia, se revalida. Si no tiene y cuenta con factura, se le asigna una nueva.
            </p>
          </div>
          <input
            value={equipoSearch}
            onChange={(e) => setEquipoSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:w-96"
            placeholder="Buscar equipo, cliente o factura"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            {loading ? <div className="text-gray-600">Cargando equipos...</div> : <Table columns={equiposColumns} data={equiposRevalidacion} />}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-sm font-medium text-gray-700">Equipo seleccionado</label>
            <select
              value={selectedEquipoId}
              onChange={(e) => setSelectedEquipoId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecciona equipo</option>
              {equiposRevalidacion.map((equipo) => (
                <option key={equipo.id_equipo} value={equipo.id_equipo}>
                  #{equipo.id_equipo} - {equipo.equipo}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{selectedEquipo?.equipo || 'Sin seleccion'}</p>
              <p className="mt-2">Cliente: {selectedEquipo?.cliente || '-'}</p>
              <p>Factura: {selectedEquipo?.factura_id || '-'}</p>
              <p>Garantia: {selectedEquipo?.garantia_id || '-'}</p>
              <p>Estado: {selectedEquipo?.estado || '-'}</p>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Duracion (meses)</span>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={duracionMeses}
                  onChange={(e) => setDuracionMeses(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Condiciones</span>
                <textarea
                  value={condiciones}
                  onChange={(e) => setCondiciones(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Condiciones para la garantia"
                />
              </label>
              <button
                type="button"
                disabled={!selectedEquipo || isProcessing || selectedEquipo?.accion === 'Sin factura'}
                onClick={() => handleEquipoGarantiaAction(selectedEquipo)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition"
              >
                {selectedEquipo?.garantia ? 'Revalidar garantia' : 'Asignar garantia'}
              </button>
            </div>
          </div>
        </div>

        {createMessage && <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{createMessage}</div>}
        {actionMessage && <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{actionMessage}</div>}
        {error && <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5 h-full">
            <h3 className="text-lg font-semibold mb-3">Crear nueva Garantia</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Factura ID</label>
                <input
                  type="number"
                  value={facturaId}
                  onChange={(e) => setFacturaId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ingresa el ID de factura"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duracion (meses)</label>
                <input
                  type="number"
                  min="1"
                  value={duracionMeses}
                  onChange={(e) => setDuracionMeses(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Condiciones</label>
                <textarea
                  value={condiciones}
                  onChange={(e) => setCondiciones(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Describe las condiciones de la Garantia"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                Guardar Garantia
              </button>
              {createMessage && <div className="text-sm text-green-600">{createMessage}</div>}
              {error && <div className="text-sm text-red-600">{error}</div>}
            </form>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5 h-full flex flex-col justify-between gap-5">
          <div>
            <h3 className="text-lg font-semibold mb-3">Resumen rápido</h3>
            <p className="text-sm text-gray-600 mb-5">
              Genera, revisa y revalida Garantias de forma ordenada. Actualiza los registros directamente desde la tabla.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-sm text-gray-500">Total</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{totalGarantias}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                <p className="text-sm text-emerald-700">Vigentes</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-900">{vigentes}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4 text-center">
                <p className="text-sm text-red-700">Vencidas</p>
                <p className="mt-2 text-2xl font-semibold text-red-900">{vencidas}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-base font-semibold">Exportar listado</h4>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={downloadGarantiasCsv}
                disabled={downloading}
                className="inline-flex min-w-[140px] items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {downloading ? 'Descargando...' : 'Exportar CSV'}
              </button>
              <button
                type="button"
                onClick={downloadGarantiasPdf}
                disabled={downloading}
                className="inline-flex min-w-[140px] items-center justify-center rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {downloading ? 'Descargando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Listado de Garantias</h3>
            <p className="text-sm text-gray-500">Revisa todas las Garantias activas y vencidas con acciones rápidas.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={downloadGarantiasCsv}
              disabled={downloading}
              className="inline-flex min-w-[140px] items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {downloading ? 'Descargando...' : 'Exportar CSV'}
            </button>
            <button
              type="button"
              onClick={downloadGarantiasPdf}
              disabled={downloading}
              className="inline-flex min-w-[140px] items-center justify-center rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {downloading ? 'Descargando...' : 'Exportar PDF'}
            </button>
          </div>
        </div>
        {loading && <div className="text-gray-600">Cargando Garantias...</div>}
        {actionMessage && <div className="mb-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{actionMessage}</div>}
        {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {!loading && <Table columns={columns} data={garantias} />}
      </section>
    </div>
  );
}

