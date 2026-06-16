import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';
import { downloadJsonCsv, downloadJsonPdf } from '../../utils/csvExport';

// Extraídas fuera del componente para evitar recreaciones redundantes en memoria
const columns = [
  { 
    header: 'Fecha instalación', 
    accessor: 'fecha_instalacion',
    render: (row) => row.fecha_instalacion ? new Date(row.fecha_instalacion).toLocaleDateString() : '-'
  },
  { header: 'Equipo destino', accessor: 'equipo' },
  { header: 'Cliente', accessor: 'cliente' },
  { 
    header: 'Orden Asociada', 
    accessor: 'orden',
    render: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700">
        ID: #{row.orden}
      </span>
    )
  },
];

const padDate = (value) => String(value).padStart(2, '0');
const toInputDate = (date) => `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())}`;

export default function HistorialRepuesto() {
  const [repuestos, setRepuestos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedRepuestoId, setSelectedRepuestoId] = useState('');
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Carga inicial del catálogo de repuestos para el autocompletado
  useEffect(() => {
    api.get('/admin_pro/repuestos')
      .then((res) => {
        const data = res.data?.data || [];
        setRepuestos(
          data
            .filter((repuesto) => (repuesto.ordenes_detalles || []).some((detalle) =>
              String(detalle.estado_aprobacion || '').toUpperCase() === 'APROBADO'
              && String(detalle.estado_entrega || '').toUpperCase() === 'ENTREGADO'
            ))
            .map((repuesto) => ({
              id_repuesto: repuesto.id_repuesto,
              label: `ID: #${repuesto.id_repuesto} - ${repuesto.nombre || 'Sin nombre definido'}`.trim(),
            }))
        );
      })
      .catch(() => {
        setError('No se pudo sincronizar el catálogo de repuestos.');
      });
  }, []);

  // Maneja los cambios de texto en la barra inteligente e identifica la selección exacta
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const repuestoEncontrado = repuestos.find((rep) => rep.label === value);
    
    if (repuestoEncontrado) {
      setSelectedRepuestoId(repuestoEncontrado.id_repuesto);
    } else if (value === '') {
      setSelectedRepuestoId('');
    }
  };

  // Trae la bitácora de trazabilidad al seleccionar un componente válido
  useEffect(() => {
    if (!selectedRepuestoId) {
      setHistorial([]);
      return;
    }
    setLoading(true);
    setError('');
    
    api.get(`/admin_pro/repuestos/${selectedRepuestoId}/historial`)
      .then((res) => {
        const data = res.data?.data || [];
        setHistorial(
          data.map((u) => ({
            fecha_instalacion: u.fecha_entrega || null,
            equipo: u.orden?.diagnostico?.equipo?.modelo || 'Modelo no especificado',
            cliente: u.orden?.diagnostico?.equipo?.cliente?.nombre || 'Particular / Desconocido',
            orden: u.orden_id || '-',
          }))
        );
      })
      .catch(() => {
        setError('Error al procesar la línea de tiempo del repuesto.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedRepuestoId]);

  const historialFiltrado = historial.filter((item) => {
    const date = item.fecha_instalacion ? new Date(item.fecha_instalacion) : null;
    const start = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const end = toDate ? new Date(`${toDate}T23:59:59`) : null;
    if (!date) return !start && !end;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });

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
    downloadJsonPdf(historialFiltrado, columns, `historial_repuesto_${selectedRepuestoId || 'sin_repuesto'}.pdf`, 'Historial de repuesto');
  };

  const downloadHistorialExcel = () => {
    downloadJsonCsv(historialFiltrado, columns, `historial_repuesto_${selectedRepuestoId || 'sin_repuesto'}.xlsx`, 'Historial de repuesto');
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado del Módulo */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Trazabilidad de repuestos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Analiza en qué órdenes de servicio, clientes y equipos se han instalado los componentes.</p>
      </div>

      {/* Tarjeta de Control Central */}
      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
        
        {/* Input con Datalist Integrado */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-md">
          <label htmlFor="repuesto-search" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Buscar y seleccionar repuesto
          </label>
          <input
            id="repuesto-search"
            type="text"
            list="repuestos-datalist"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Escribe el ID o nombre del repuesto (ej. Pantalla, Pin...)"
            className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />

          {/* Lista de sugerencias dinámicas controlada por el cliente */}
          <datalist id="repuestos-datalist">
            {repuestos.map((repuesto) => (
              <option key={repuesto.id_repuesto} value={repuesto.label} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {[
            ['semana', 'Semana'],
            ['mes', 'Mes'],
            ['anio', 'Año'],
          ].map(([period, label]) => (
            <button key={period} type="button" onClick={() => applyQuickPeriod(period)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">{label}</button>
          ))}
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-700" />
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-700" />
          <button type="button" onClick={downloadHistorialExcel} disabled={!selectedRepuestoId || historialFiltrado.length === 0} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300">Excel</button>
          <button type="button" onClick={downloadHistorialPdf} disabled={!selectedRepuestoId || historialFiltrado.length === 0} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:bg-slate-300">PDF</button>
        </div>
        </div>

        {/* Espacio Dinámico de Visualización de Resultados */}
        <div className="pt-2 border-t border-gray-50">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-100">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-gray-400 text-center py-12 text-sm">
              Rastreando registros de instalación en bitácoras pasadas...
            </div>
          )}

          {!loading && !error && (
            <>
              {!selectedRepuestoId ? (
                <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-xs">
                  Escribe y selecciona un repuesto en el buscador superior para desplegar su historial de montaje.
                </div>
              ) : historialFiltrado.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-xs">
                  Este repuesto está actualmente en inventario y no se ha instalado en ningún dispositivo todavía.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table columns={columns} data={historialFiltrado} sortable />
                </div>
              )}
            </>
          )}
        </div>
      </section>

    </div>
  );
}
