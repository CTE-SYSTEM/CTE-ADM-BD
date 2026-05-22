import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MetricBarChart from '../../components/MetricBarChart';
import Table from '../../components/Table';
import api from '../../services/api';

const currency = (value) => `$ ${Number(value || 0).toFixed(2)}`;

const currentYear = new Date().getFullYear();

const detailColumns = [
  { header: 'Tipo', accessor: 'tipo' },
  { header: 'Fecha', accessor: 'fecha' },
  { header: 'Concepto', accessor: 'concepto' },
  { header: 'Monto', accessor: 'monto' },
  { header: 'Pago', accessor: 'metodo_pago' },
];

export default function Ganancias() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`);
  const [toDate, setToDate] = useState(`${currentYear}-12-31`);

  const fetchGanancias = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (fromDate) query.set('fecha_inicio', fromDate);
      if (toDate) query.set('fecha_fin', toDate);
      const res = await api.get(`/admin_pro/analitica/ganancias?${query.toString()}`);
      setData(res.data?.data || null);
    } catch {
      setError('No se pudo cargar el modulo de ganancias.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGanancias();
  }, [fetchGanancias]);

  const totals = data?.totals || {};
  const balanceLabel = Number(totals.ganancia_neta || 0) >= 0 ? 'Ganancia neta' : 'Perdida neta';
  const marginPercent = Number(totals.ingresos || 0)
    ? ((Number(totals.ganancia_neta || 0) / Number(totals.ingresos || 0)) * 100).toFixed(1)
    : '0.0';

  const detail = useMemo(
    () =>
      (data?.detail || []).map((item) => ({
        ...item,
        fecha: item.fecha ? new Date(item.fecha).toLocaleDateString() : '-',
        monto: currency(item.monto),
        metodo_pago: item.metodo_pago || '-',
      })),
    [data]
  );

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ganancias</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Mini modulo de autogestion para ingresos, gastos, ganancias y perdidas del negocio.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[150px_150px_auto] sm:items-end">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Desde</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasta</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <button
            type="button"
            onClick={fetchGanancias}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:bg-slate-300"
          >
            Consultar
          </button>
        </div>
      </div>

      {loading && <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-400 text-center">Calculando ganancias...</div>}
      {error && <div className="rounded-2xl bg-red-50 p-6 text-red-700 shadow-sm">{error}</div>}

      {!loading && !error && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Ingresos</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{currency(totals.ingresos)}</p>
              <p className="mt-2 text-xs font-semibold text-gray-400">{totals.facturas || 0} facturas</p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Gastos</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{currency(totals.gastos)}</p>
              <p className="mt-2 text-xs font-semibold text-gray-400">{totals.compras || 0} compras registradas</p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{balanceLabel}</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{currency(totals.ganancia_neta)}</p>
              <p className="mt-2 text-xs font-semibold text-gray-400">Margen neto {marginPercent}%</p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Costo usado</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{currency(totals.costo_repuestos_usados)}</p>
              <p className="mt-2 text-xs font-semibold text-gray-400">Repuestos consumidos en ordenes</p>
            </div>
          </div>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Balance mensual</h2>
              <p className="text-sm text-gray-400">Ingresos, gastos y ganancia neta calculados por mes.</p>
            </div>
            <MetricBarChart
              data={data.monthly || []}
              labelKey="etiqueta"
              series={[
                { key: 'ingresos', label: 'Ingresos', color: '#059669' },
                { key: 'gastos', label: 'Gastos', color: '#dc2626' },
                { key: 'ganancia_neta', label: 'Ganancia neta', color: '#4f46e5' },
              ]}
              formatValue={(value) => {
                const number = Number(value) || 0;
                if (Math.abs(number) >= 1000) return `$ ${(number / 1000).toFixed(1)}K`;
                return `$ ${number.toFixed(0)}`;
              }}
            />
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Movimientos recientes</h2>
              <p className="text-sm text-gray-400">Ultimos ingresos y gastos usados para el calculo del periodo.</p>
            </div>
            <div className="overflow-x-auto">
              {detail.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-sm">
                  No hay movimientos registrados para el periodo seleccionado.
                </div>
              ) : (
                <Table columns={detailColumns} data={detail} sortable />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
