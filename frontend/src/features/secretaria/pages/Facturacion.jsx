// frontend/src/features/secretaria/pages/Facturacion.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Eye, Printer, Save, Search } from 'lucide-react';
import Table from '../../../components/Table';
import { createFactura, getFacturas, getOrdenesParaFacturar } from '../services/facturasService';
import { getGarantias } from '../services/garantiasService';
import { useInfiniteSecretariaList } from '../hooks/useInfiniteSecretariaList';

const money = (value) => `C$ ${Number(value || 0).toFixed(2)}`;
const IVA_RATE = 0.15;

const getClienteFactura = (factura) => factura.orden?.diagnostico?.equipo?.cliente?.nombre || '';
const getClienteGarantia = (garantia) => garantia.factura?.orden?.diagnostico?.equipo?.cliente?.nombre || '';
const formatBool = (value) => (value ? 'Si' : 'No');
const getGarantiaFactura = (factura) => factura?.garantias?.[0] || null;

const getEquipoFactura = (factura) => [
  factura?.orden?.diagnostico?.equipo?.tipo,
  factura?.orden?.diagnostico?.equipo?.marca,
  factura?.orden?.diagnostico?.equipo?.modelo,
].filter(Boolean).join(' ') || 'Servicio tecnico';

const getRepuestosOrden = (orden) => orden?.repuestos_facturacion || orden?.repuestos_usados || [];

const getNombreRepuesto = (detalle) =>
  detalle?.repuesto?.nombre || detalle?.pieza_solicitada || 'Pieza sin nombre';

const getPrecioUnitarioRepuesto = (detalle) => {
  if (detalle?.precio_unitario !== undefined) return Number(detalle.precio_unitario || 0);
  const costo = Number(detalle?.repuesto?.costo_individual || 0);
  const ganancia = Number(detalle?.repuesto?.ganancia_cordobas || 0);
  const porcentaje = Number(detalle?.repuesto?.porcentaje_de_ganacia || 0);

  if (ganancia > 0) return costo + ganancia;
  if (porcentaje > 0) return costo + ((costo * porcentaje) / 100);
  return costo;
};

const getTotalRepuesto = (detalle) => {
  if (detalle?.total !== undefined) return Number(detalle.total || 0);
  return Number(detalle?.cantidad_usada || 0) * getPrecioUnitarioRepuesto(detalle);
};

const buildTicketHtml = (factura, { autoPrint = false } = {}) => {
  const cliente = getClienteFactura(factura) || 'Consumidor final';
  const equipo = getEquipoFactura(factura);
  const garantia = getGarantiaFactura(factura);
  const fecha = factura.fecha_emision ? new Date(factura.fecha_emision).toLocaleString() : new Date().toLocaleString();
  const fechaInicioGarantia = garantia?.fecha_inicio ? new Date(garantia.fecha_inicio).toLocaleDateString() : '-';
  const fechaVencimientoGarantia = garantia?.fecha_vencimiento ? new Date(garantia.fecha_vencimiento).toLocaleDateString() : '-';
  const lines = [
    ['Repuestos', factura.monto_repuestos],
    ['Mano de obra', factura.mano_obra],
    ['Subtotal', factura.subtotal],
    ['IVA', factura.impuestos],
    ['TOTAL', factura.total],
  ];

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket #${factura.id_factura}</title>
        <style>
          body { font-family: Consolas, monospace; margin: 0; padding: 12px; color: #111; }
          .ticket { width: 280px; margin: 0 auto; }
          .center { text-align: center; }
          .line { border-top: 1px dashed #111; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; gap: 12px; margin: 4px 0; }
          .total { font-size: 18px; font-weight: 700; }
          .small { font-size: 11px; }
          @media print { body { padding: 0; } .ticket { width: 72mm; } }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="center">
            <strong>SISTEMA DE GESTION</strong><br />
            <span class="small">Servicio tecnico y repuestos</span><br />
            <span class="small">Managua, Nicaragua</span>
          </div>
          <div class="line"></div>
          <div class="small">
            Ticket: #${factura.id_factura}<br />
            Orden: #${factura.orden_id}<br />
            Fecha: ${fecha}<br />
            Cliente: ${cliente}<br />
            Equipo: ${equipo}<br />
            Pago: ${factura.metodo_pago || '-'}
          </div>
          <div class="line"></div>
          ${lines.map(([label, value], index) => `
            <div class="row ${index === lines.length - 1 ? 'total' : ''}">
              <span>${label}</span>
              <span>${money(value)}</span>
            </div>
          `).join('')}
          <div class="line"></div>
          <div class="center small">
            Gracias por su visita<br />
            Conserve este ticket para garantia.
          </div>
          <div class="line"></div>
          <div class="center">
            <strong>VOUCHER DE GARANTIA</strong><br />
            <span class="small">Garantia No. ${garantia?.id_garantia ? `#${garantia.id_garantia}` : 'pendiente'}</span>
          </div>
          <div class="small">
            Factura: #${factura.id_factura}<br />
            Duracion: ${garantia?.duracion_meses || 3} meses<br />
            Inicio: ${fechaInicioGarantia}<br />
            Vence: ${fechaVencimientoGarantia}<br />
            Cubre: reparacion realizada y repuestos instalados por el servicio.
          </div>
          <div class="line"></div>
          <div class="small">
            ${garantia?.condiciones || 'Garantia de 3 meses sujeta a la reparacion realizada. No cubre golpes, humedad, mala manipulacion ni intervenciones de terceros.'}
          </div>
        </div>
        ${autoPrint ? '<script>window.print();</script>' : ''}
      </body>
    </html>
  `;
};

const FacturacionPage = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [tablaActiva, setTablaActiva] = useState('facturas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [autoIva, setAutoIva] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    orden_id: '',
    monto_repuestos: '',
    mano_obra: '',
    impuestos: '',
    metodo_pago: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const facturasQuery = useInfiniteSecretariaList({
    queryKey: ['secretaria', 'facturas'],
    queryFn: getFacturas,
    search: searchTerm,
  });
  const garantiasQuery = useInfiniteSecretariaList({
    queryKey: ['secretaria', 'garantias'],
    queryFn: getGarantias,
    search: searchTerm,
  });
  const facturas = facturasQuery.rows;
  const garantias = garantiasQuery.rows;

  const subtotal = useMemo(() => {
    return Number(form.monto_repuestos || 0) + Number(form.mano_obra || 0);
  }, [form.monto_repuestos, form.mano_obra]);

  const total = useMemo(() => subtotal + Number(form.impuestos || 0), [subtotal, form.impuestos]);
  const ivaSugerido = useMemo(() => Math.round(subtotal * IVA_RATE * 100) / 100, [subtotal]);

  const selectedOrden = useMemo(() => (
    ordenes.find((orden) => String(orden.id_orden) === String(form.orden_id))
  ), [ordenes, form.orden_id]);

  const ticketFactura = useMemo(() => {
    if (!selectedTicketId) return null;
    return facturas.find((factura) => String(factura.id_factura) === String(selectedTicketId)) || null;
  }, [facturas, selectedTicketId]);

  useEffect(() => {
    if (!autoIva) return;
    setForm((prev) => ({ ...prev, impuestos: ivaSugerido.toFixed(2) }));
  }, [autoIva, ivaSugerido]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ordenesResponse = await getOrdenesParaFacturar();
      setOrdenes(ordenesResponse.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.details || 'No se pudo cargar facturacion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedOrden?.repuestos_pendientes_count > 0) {
      setError('Esta orden tiene repuestos pendientes de aprobacion. Apruebelos o rechacelos antes de crear la factura.');
      return;
    }
    if (!form.metodo_pago) {
      setError('Seleccione un metodo de pago antes de crear la factura.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await createFactura({
        ...form,
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
      });
      const facturaCreada = response.data?.data;
      setForm({ orden_id: '', monto_repuestos: '', mano_obra: '', impuestos: '', metodo_pago: '' });
      setAutoIva(true);
      setShowForm(false);
      if (facturaCreada?.id_factura) {
        setSelectedTicketId(String(facturaCreada.id_factura));
        setTablaActiva('ticket');
      }
      await Promise.all([
        loadData(),
        facturasQuery.refetch(),
        garantiasQuery.refetch(),
      ]);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.details || 'Error al crear la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleOrdenChange = (ordenId) => {
    const orden = ordenes.find((item) => String(item.id_orden) === String(ordenId));
    const montoCalculado = Number(orden?.monto_repuestos_calculado || 0).toFixed(2);

    setForm({
      ...form,
      orden_id: ordenId,
      monto_repuestos: ordenId ? montoCalculado : '',
    });
  };

  const handleMoneyChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleManualImpuestoChange = (value) => {
    setAutoIva(false);
    setForm({ ...form, impuestos: value });
  };

  const applyIvaSugerido = () => {
    setAutoIva(true);
    setForm({ ...form, impuestos: ivaSugerido.toFixed(2) });
  };

  const printTicket = (factura) => {
    if (!factura) return;
    const popup = window.open('', 'ticket_cte', 'width=380,height=640');
    if (!popup) return;
    popup.document.write(buildTicketHtml(factura, { autoPrint: true }));
    popup.document.close();
  };

  const saveTicket = async (factura) => {
    if (!factura) return;
    try {
      const fileName = `ticket-cte-${factura.id_factura}.html`;
      const html = buildTicketHtml(factura);

      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Ticket HTML', accept: { 'text/html': ['.html'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(new Blob([html], { type: 'text/html;charset=utf-8' }));
        await writable.close();
        return;
      }

      const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError('No se pudo guardar el ticket');
      }
    }
  };

  const viewTicket = (factura) => {
    setSelectedTicketId(String(factura.id_factura));
    setTablaActiva('ticket');
  };

  const columnasFacturas = [
    { header: 'ID', accessor: 'id_factura' },
    { header: 'Orden', accessor: 'orden_id' },
    { header: 'Cliente', accessor: 'cliente', render: getClienteFactura },
    { header: 'Fecha', accessor: 'fecha_emision', render: (row) => row.fecha_emision ? new Date(row.fecha_emision).toLocaleDateString() : '' },
    { header: 'Repuestos', accessor: 'monto_repuestos', render: (row) => row.monto_repuestos ? money(row.monto_repuestos) : '' },
    { header: 'Mano obra', accessor: 'mano_obra', render: (row) => row.mano_obra ? money(row.mano_obra) : '' },
    { header: 'Impuestos', accessor: 'impuestos', render: (row) => row.impuestos ? money(row.impuestos) : '' },
    { header: 'Total', accessor: 'total', render: (row) => row.total ? money(row.total) : '' },
    { header: 'Pago', accessor: 'metodo_pago' },
    {
      header: 'Acciones',
      accessor: 'acciones',
      render: (row) => (
        <button
          type="button"
          onClick={() => viewTicket(row)}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          <Eye className="h-4 w-4" /> Ver
        </button>
      ),
    },
  ];

  const columnasGarantias = [
    { header: 'ID', accessor: 'id_garantia' },
    { header: 'Factura', accessor: 'factura_id' },
    { header: 'Cliente', accessor: 'cliente', render: getClienteGarantia },
    { header: 'Orden', accessor: 'orden', render: (row) => row.factura?.orden_id || '' },
    { header: 'Duracion', accessor: 'duracion_meses', render: (row) => row.duracion_meses ? `${row.duracion_meses} meses` : '' },
    { header: 'Inicio', accessor: 'fecha_inicio', render: (row) => row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleDateString() : '' },
    { header: 'Vence', accessor: 'fecha_vencimiento', render: (row) => row.fecha_vencimiento ? new Date(row.fecha_vencimiento).toLocaleDateString() : '' },
    { header: 'Condiciones', accessor: 'condiciones', contentClassName: 'max-w-[360px] whitespace-normal break-words leading-relaxed' },
  ];

  const columnasActivas = tablaActiva === 'facturas' ? columnasFacturas : columnasGarantias;
  const datosActivos = tablaActiva === 'facturas' ? facturas : garantias;
  const activeListQuery = tablaActiva === 'facturas' ? facturasQuery : garantiasQuery;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Facturacion</h1>
        <p className="text-gray-500">Campos reales: orden finalizada, montos, impuestos, total y metodo de pago.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white px-4 py-3 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Emitir nueva factura</h2>
          <p className="text-xs text-gray-500">Abra el formulario solo cuando vaya a registrar una factura.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
          aria-expanded={showForm}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          {showForm ? 'Cerrar formulario' : 'Nueva factura'}
          {showForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {showForm && (
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <select required value={form.orden_id} onChange={(e) => handleOrdenChange(e.target.value)} className="w-full border p-2 rounded-lg">
              <option value="">Seleccione una orden</option>
              {ordenes.map((orden) => (
                <option key={orden.id_orden} value={orden.id_orden}>
                  #{orden.id_orden} - {orden.diagnostico?.equipo?.cliente?.nombre || 'Sin cliente'} - Repuestos {money(orden.monto_repuestos_calculado)}
                </option>
              ))}
            </select>
          </div>
          <Field label="Monto repuestos" value={form.monto_repuestos} onChange={(value) => setForm({ ...form, monto_repuestos: value })} readOnly />
          <Field label="Mano de obra" value={form.mano_obra} onChange={(value) => handleMoneyChange('mano_obra', value)} />
          <Field label="Impuestos" value={form.impuestos} onChange={handleManualImpuestoChange} helper={`IVA sugerido 15%: ${money(ivaSugerido)}`} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metodo de pago</label>
            <select required value={form.metodo_pago} onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })} className="w-full border p-2 rounded-lg">
              <option value="">Seleccione metodo</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div className="text-sm text-gray-500">Subtotal</div>
            <div className="font-semibold">{money(subtotal)}</div>
            <div className="text-sm text-gray-500 mt-2">Total</div>
            <div className="font-semibold">{money(total)}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <button type="button" onClick={applyIvaSugerido} className="rounded-lg border border-indigo-200 px-3 py-2 font-medium text-indigo-700 hover:bg-indigo-50">
            Aplicar IVA 15%
          </button>
          <span>{autoIva ? 'IVA automatico activo' : 'IVA editado manualmente'}</span>
          <span>La orden pasara a ENTREGADO al crear la factura.</span>
        </div>
        {selectedOrden && (
          <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-950">
            <div className="font-semibold">Detalle de la orden #{selectedOrden.id_orden}</div>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <div className="rounded-md bg-white px-3 py-2">
                <div className="text-xs font-semibold uppercase text-indigo-500">Equipo</div>
                <div>{[selectedOrden.diagnostico?.equipo?.marca, selectedOrden.diagnostico?.equipo?.modelo].filter(Boolean).join(' ') || 'Sin equipo'}</div>
              </div>
              <div className="rounded-md bg-white px-3 py-2">
                <div className="text-xs font-semibold uppercase text-indigo-500">Recepcion</div>
                <div>Cargador: {formatBool(selectedOrden.diagnostico?.deja_cargador)} | Enciende: {formatBool(selectedOrden.diagnostico?.enciende)}</div>
              </div>
              <div className="rounded-md bg-white px-3 py-2">
                <div className="text-xs font-semibold uppercase text-indigo-500">Corriente AC</div>
                <div>{formatBool(selectedOrden.diagnostico?.usa_corriente_ac)}</div>
              </div>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <div className="rounded-md bg-white px-3 py-2">
                <div className="text-xs font-semibold uppercase text-indigo-500">Resultado</div>
                <div>{selectedOrden.resultado_final || selectedOrden.estado || 'Sin cierre'}</div>
              </div>
              <div className="rounded-md bg-white px-3 py-2">
                <div className="text-xs font-semibold uppercase text-indigo-500">Enciende al salir</div>
                <div>{selectedOrden.enciende_salida === null || selectedOrden.enciende_salida === undefined ? 'No registrado' : formatBool(selectedOrden.enciende_salida)}</div>
              </div>
              <div className="rounded-md bg-white px-3 py-2">
                <div className="text-xs font-semibold uppercase text-indigo-500">AC al salir</div>
                <div>{selectedOrden.usa_corriente_ac_salida === null || selectedOrden.usa_corriente_ac_salida === undefined ? 'No registrado' : formatBool(selectedOrden.usa_corriente_ac_salida)}</div>
              </div>
            </div>
            <div className="mt-3 rounded-md bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-indigo-100 px-3 py-2">
                <div>
                  <div className="text-xs font-semibold uppercase text-indigo-500">Repuestos agregados</div>
                  <div className="text-sm font-semibold text-indigo-950">
                    {money(selectedOrden.monto_repuestos_calculado)} facturable
                  </div>
                </div>
                {selectedOrden.repuestos_pendientes_count > 0 && (
                  <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                    {selectedOrden.repuestos_pendientes_count} pendiente(s)
                  </span>
                )}
              </div>
              {getRepuestosOrden(selectedOrden).length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500">Esta orden no tiene repuestos agregados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold uppercase">Pieza</th>
                        <th className="px-3 py-2 font-semibold uppercase">Estado</th>
                        <th className="px-3 py-2 text-right font-semibold uppercase">Cant.</th>
                        <th className="px-3 py-2 text-right font-semibold uppercase">Precio</th>
                        <th className="px-3 py-2 text-right font-semibold uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getRepuestosOrden(selectedOrden).map((detalle) => {
                        const aprobado = String(detalle.estado_aprobacion || '').toUpperCase() === 'APROBADO';
                        return (
                          <tr key={detalle.id_detalle_repuesto}>
                            <td className="px-3 py-2 font-semibold text-gray-800">{getNombreRepuesto(detalle)}</td>
                            <td className="px-3 py-2">
                              <span className={`rounded px-2 py-1 font-bold ${aprobado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                                {detalle.estado_aprobacion || 'PENDIENTE'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">{detalle.cantidad_usada || 0}</td>
                            <td className="px-3 py-2 text-right">{money(getPrecioUnitarioRepuesto(detalle))}</td>
                            <td className="px-3 py-2 text-right font-semibold">{aprobado ? money(getTotalRepuesto(detalle)) : money(0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        <button type="submit" disabled={loading || !form.metodo_pago} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-60">
          Crear Factura
        </button>
      </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Historial</h2>
            <p className="text-sm text-gray-500">
              {tablaActiva === 'facturas' ? `${facturas.length} facturas registradas` : `${garantias.length} garantias registradas`}
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setTablaActiva('facturas')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${tablaActiva === 'facturas' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Facturas
            </button>
            <button
              type="button"
              onClick={() => setTablaActiva('garantias')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${tablaActiva === 'garantias' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Garantias
            </button>
          </div>
        </div>
        {tablaActiva !== 'ticket' && (
          <div className="border-b border-gray-100 p-4">
            <label className="relative block max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre del cliente..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
        )}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : tablaActiva === 'ticket' ? (
          <TicketTerminal
            ticketFactura={ticketFactura}
            onPrint={printTicket}
            onSave={saveTicket}
            onBack={() => {
              setSelectedTicketId('');
              setTablaActiva('facturas');
            }}
          />
        ) : (
          <Table
            columns={columnasActivas}
            data={datosActivos}
            onLoadMore={() => activeListQuery.fetchNextPage()}
            hasMore={tablaActiva !== 'ticket' && activeListQuery.hasNextPage}
            isLoadingMore={activeListQuery.isFetchingNextPage}
          />
        )}
      </div>
    </div>
  );
};

const TicketTerminal = ({ ticketFactura, onPrint, onSave, onBack }) => {
  const equipo = getEquipoFactura(ticketFactura);
  const garantia = getGarantiaFactura(ticketFactura);
  const fecha = ticketFactura?.fecha_emision ? new Date(ticketFactura.fecha_emision).toLocaleString() : '';
  const fechaInicioGarantia = garantia?.fecha_inicio ? new Date(garantia.fecha_inicio).toLocaleDateString() : '-';
  const fechaVencimientoGarantia = garantia?.fecha_vencimiento ? new Date(garantia.fecha_vencimiento).toLocaleDateString() : '-';
  const rows = [
    ['Repuestos', ticketFactura?.monto_repuestos],
    ['Mano de obra', ticketFactura?.mano_obra],
    ['Subtotal', ticketFactura?.subtotal],
    ['IVA', ticketFactura?.impuestos],
  ];

  return (
  <div className="p-6 bg-gray-50 min-h-screen">
    {/* Encabezado Principal */}
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="text-left">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Facturación</h2>
        <p className="text-sm font-medium text-gray-500 italic mt-0.5">Campos reales: orden finalizada, montos, impuestos, total y método de pago.</p>
      </div>
    </div>

    {error && (
      <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r-lg flex items-center gap-2 text-left">
        <span>{error}</span>
      </div>
    )}

    {/* Formulario de Facturación */}
    <form onSubmit={handleSubmit} className="mb-8 bg-white rounded-2xl shadow-xl border border-indigo-100 p-6 text-left">
      <h3 className="text-base font-bold mb-4 text-gray-800">Emitir Nueva Factura</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Orden</label>
          <select 
            required 
            value={form.orden_id} 
            onChange={(e) => handleOrdenChange(e.target.value)} 
            className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">Seleccione una orden</option>
            {ordenes.map((orden) => (
              <option key={orden.id_orden} value={orden.id_orden}>
                #{orden.id_orden} - {orden.diagnostico?.equipo?.cliente?.nombre || 'Sin cliente'} - Repuestos {money(orden.monto_repuestos_calculado)}
              </option>
            ))}
          </select>
        </div>

        <Field label="Monto repuestos" value={form.monto_repuestos} onChange={(value) => setForm({ ...form, monto_repuestos: value })} readOnly />
        <Field label="Mano de obra" value={form.mano_obra} onChange={(value) => handleMoneyChange('mano_obra', value)} />
        <Field label="Impuestos" value={form.impuestos} onChange={handleManualImpuestoChange} helper={`IVA sugerido 15%: ${money(ivaSugerido)}`} />

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Método de pago</label>
          <select 
            required 
            value={form.metodo_pago} 
            onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })} 
            className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">Seleccione método</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
          </select>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
            <span>Subtotal</span>
            <span className="text-gray-800 font-bold">{money(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-black text-indigo-900 mt-2 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-indigo-600">{money(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <button 
          type="button" 
          onClick={applyIvaSugerido} 
          className="px-3 py-1.5 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all"
        >
          Aplicar IVA 15%
        </button>
        <span className="font-medium">{autoIva ? 'IVA automático activo' : 'IVA editado manualmente'}</span>
        <span className="italic text-gray-400">• La orden pasará a ENTREGADO al crear la factura.</span>
      </div>

      {selectedOrden && (
        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs text-indigo-950">
          <div className="font-bold text-indigo-900 mb-2">Detalle de la orden #{selectedOrden.id_orden}</div>
          
          <div className="grid gap-2 md:grid-cols-3 mb-3">
            <div className="rounded-lg bg-white p-2.5 border border-indigo-100/60 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">Equipo</div>
              <div className="font-semibold text-gray-800">
                {[selectedOrden.diagnostico?.equipo?.marca, selectedOrden.diagnostico?.equipo?.modelo].filter(Boolean).join(' ') || 'Sin equipo'}
              </div>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-indigo-100/60 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">Recepción</div>
              <div className="font-semibold text-gray-800">
                Cargador: {formatBool(selectedOrden.diagnostico?.deja_cargador)} | Enciende: {formatBool(selectedOrden.diagnostico?.enciende)}
              </div>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-indigo-100/60 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">Corriente AC</div>
              <div className="font-semibold text-gray-800">
                {formatBool(selectedOrden.diagnostico?.usa_corriente_ac)}
              </div>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3 mb-3">
            <div className="rounded-lg bg-white p-2.5 border border-indigo-100/60 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">Resultado</div>
              <div className="font-semibold text-gray-800">
                {selectedOrden.resultado_final || selectedOrden.estado || 'Sin cierre'}
              </div>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-indigo-100/60 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">Enciende al salir</div>
              <div className="font-semibold text-gray-800">
                {selectedOrden.enciende_salida === null || selectedOrden.enciende_salida === undefined ? 'No registrado' : formatBool(selectedOrden.enciende_salida)}
              </div>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-indigo-100/60 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">AC al salir</div>
              <div className="font-semibold text-gray-800">
                {selectedOrden.usa_corriente_ac_salida === null || selectedOrden.usa_corriente_ac_salida === undefined ? 'No registrado' : formatBool(selectedOrden.usa_corriente_ac_salida)}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-indigo-100/80 overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between gap-3 border-b border-indigo-100 px-3 py-2 bg-indigo-50/30">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Repuestos agregados</div>
                <div className="text-xs font-bold text-indigo-950">
                  {money(selectedOrden.monto_repuestos_calculado)} facturable
                </div>
              </div>
              {selectedOrden.repuestos_pendientes_count > 0 && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  {selectedOrden.repuestos_pendientes_count} pendiente(s)
                </span>
              )}
            </div>

            {getRepuestosOrden(selectedOrden).length === 0 ? (
              <div className="px-3 py-4 text-xs italic text-gray-400 text-center">Esta orden no tiene repuestos agregados.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Pieza</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Estado</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider text-[10px]">Cant.</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider text-[10px]">Precio</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider text-[10px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {getRepuestosOrden(selectedOrden).map((detalle) => {
                      const aprobado = String(detalle.estado_aprobacion || '').toUpperCase() === 'APROBADO';
                      return (
                        <tr key={detalle.id_detalle_repuesto} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-2 font-semibold text-gray-800">{getNombreRepuesto(detalle)}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${aprobado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                              {detalle.estado_aprobacion || 'PENDIENTE'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{detalle.cantidad_usada || 0}</td>
                          <td className="px-3 py-2 text-right font-medium">{money(getPrecioUnitarioRepuesto(detalle))}</td>
                          <td className="px-3 py-2 text-right font-bold">{aprobado ? money(getTotalRepuesto(detalle)) : money(0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading || !form.metodo_pago}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
        >
          Crear Factura
        </button>
      </div>
    </form>

    {/* Historial / Tablas */}
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden text-left">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-800">Historial</h3>
          <p className="text-xs font-medium text-gray-500">
            {tablaActiva === 'facturas' ? `${facturas.length} facturas registradas` : `${garantias.length} garantías registradas`}
          </p>
        </div>
        
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setTablaActiva('facturas')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${tablaActiva === 'facturas' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Facturas
          </button>
          <button
            type="button"
            onClick={() => setTablaActiva('garantias')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${tablaActiva === 'garantias' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Garantías
          </button>
        </div>
      </div>

      {tablaActiva !== 'ticket' && (
        <div className="border-b border-gray-100 p-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre del cliente..."
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-indigo-600 flex justify-center items-center gap-2">
          <span>Cargando...</span>
        </div>
      ) : tablaActiva === 'ticket' ? (
        <TicketTerminal
          ticketFactura={ticketFactura}
          onPrint={printTicket}
          onSave={saveTicket}
          onBack={() => {
            setSelectedTicketId('');
            setTablaActiva('facturas');
          }}
        />
      ) : (
        <Table
          columns={columnasActivas}
          data={datosActivos}
          onLoadMore={() => activeListQuery.fetchNextPage()}
          hasMore={tablaActiva !== 'ticket' && activeListQuery.hasNextPage}
          isLoadingMore={activeListQuery.isFetchingNextPage}
        />
      )}
    </div>
  </div>
);
};

const TicketDivider = () => <div className="my-3 border-t border-dashed border-gray-400" />;

const TicketRow = ({ label, value, strong = false }) => (
  <div className={`flex items-center justify-between gap-4 ${strong ? 'text-base font-bold' : ''}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const Field = ({ label, value, onChange, readOnly = false, helper = '' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      className={`w-full border p-2 rounded-lg ${readOnly ? 'bg-gray-100 text-gray-700' : ''}`}
    />
    {helper && <div className="mt-1 text-xs text-gray-500">{helper}</div>}
  </div>
);

export default FacturacionPage;
