import { FileDown, FileText } from 'lucide-react';

export const currentYear = new Date().getFullYear();

export const padDatePart = (value) => String(value).padStart(2, '0');

export const toDateInputValue = (date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;

export const formatCurrency = (value) => `C$ ${Number(value || 0).toFixed(2)}`;

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const normalizeSearchText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const detailColumns = [
  { header: 'Tipo', accessor: 'tipo' },
  { header: 'Fecha', accessor: 'fecha' },
  { header: 'Concepto', accessor: 'concepto' },
  { header: 'Monto', accessor: 'monto' },
  { header: 'Pago', accessor: 'metodo_pago' },
];

export const chartSeries = [
  { key: 'ingresos', label: 'Ingresos', color: '#059669' },
  { key: 'compras_inventario', label: 'Compras inventario', color: '#0ea5e9' },
  { key: 'ganancia_neta', label: 'Ganancia neta', color: '#4f46e5' },
  { key: 'costo_repuestos_usados', label: 'Costo usado', color: '#d97706' },
  { key: 'perdidas_reales', label: 'Perdidas reales', color: '#991b1b' },
];

export const quickFilters = [
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'anio', label: 'Anio' },
];

export const periodFilters = [
  { key: 'semanal', label: 'Semanal' },
  { key: 'mensual', label: 'Mensual' },
  { key: 'anual', label: 'Anual' },
];

export const generalReportPeriods = [
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'anio', label: 'Anio' },
];

export const orderMarginColumns = [
  { header: 'Orden', accessor: 'orden' },
  { header: 'Factura', accessor: 'factura' },
  { header: 'Fecha', accessor: 'fecha' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Equipo', accessor: 'equipo' },
  { header: 'Tecnico', accessor: 'tecnico' },
  { header: 'Estado', accessor: 'estado' },
  { header: 'Facturado', accessor: 'total_facturado' },
  { header: 'Mano obra', accessor: 'mano_obra' },
  { header: 'Ganancia repuestos', accessor: 'ganancia_repuestos' },
  { header: 'Costo', accessor: 'costo_repuestos' },
  { header: 'Ganancia', accessor: 'ganancia_servicio' },
  { header: 'Margen', accessor: 'margen_porcentaje' },
];

export const lossColumns = [
  { header: 'Accion', accessor: 'accion' },
  { header: 'Clasificacion', accessor: 'clasificacion' },
  { header: 'Fecha', accessor: 'fecha' },
  { header: 'Monto', accessor: 'monto' },
];

export const gainSourceColumns = [
  { header: 'Fuente', accessor: 'fuente' },
  { header: 'Fecha', accessor: 'fecha' },
  { header: 'Referencia', accessor: 'referencia' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Ingreso', accessor: 'ingreso_total' },
  { header: 'Costo', accessor: 'costo_repuestos' },
  { header: 'Ganancia', accessor: 'ganancia_total' },
  { header: 'Motivo', accessor: 'motivo' },
];

export const lossSourceColumns = [
  { header: 'Tipo', accessor: 'tipo' },
  { header: 'Fecha', accessor: 'fecha' },
  { header: 'Referencia', accessor: 'referencia' },
  { header: 'Cliente', accessor: 'cliente' },
  { header: 'Concepto', accessor: 'concepto' },
  { header: 'Monto', accessor: 'monto' },
  { header: 'Razon', accessor: 'razon' },
];

export const profitabilityColumns = [
  { header: 'Periodo', accessor: 'etiqueta' },
  { header: 'Ingresos', accessor: 'ingresos' },
  { header: 'Compras inventario', accessor: 'compras_inventario' },
  { header: 'Costos consumidos', accessor: 'costo_repuestos_usados' },
  { header: 'Perdidas reales', accessor: 'perdidas_reales' },
  { header: 'Ganancia neta', accessor: 'ganancia_neta' },
  { header: 'Margen servicio', accessor: 'margen_servicio' },
  { header: 'Rentabilidad', accessor: 'rentabilidad_porcentaje' },
  { header: 'Ordenes', accessor: 'ordenes_procesadas' },
];

export const summaryColumns = [
  { header: 'Indicador', accessor: 'label' },
  { header: 'Valor', accessor: 'value' },
  { header: 'Detalle', accessor: 'detail' },
];

export const alertColumns = [
  { header: 'Nivel', accessor: 'nivel' },
  { header: 'Alerta', accessor: 'titulo' },
  { header: 'Detalle', accessor: 'detalle' },
];

export const assetColumns = [
  { header: 'Activo', accessor: 'label' },
  { header: 'Valor', accessor: 'value' },
];

export const sectionOptions = [
  { id: 'todos', label: 'Todos los apartados', hint: 'Vista completa del modulo' },
  { id: 'resumen', label: 'Resumen financiero', hint: 'Totales y alertas' },
  { id: 'balance', label: 'Balance por etapa', hint: 'Semanal, mensual, anual' },
  { id: 'explicacion', label: 'Ganancias y perdidas', hint: 'Origen y razon' },
  { id: 'ordenes', label: 'Margen por orden', hint: 'Ordenes finalizadas' },
  { id: 'activos', label: 'Control de activos', hint: 'Inventario y cuentas' },
  { id: 'costos', label: 'Costos y perdidas', hint: 'Acciones financieras' },
  { id: 'rentabilidad', label: 'Rentabilidad', hint: 'Etapas del periodo' },
  { id: 'movimientos', label: 'Movimientos', hint: 'Ingresos y gastos' },
  { id: 'reporte-general', label: 'Reporte general', hint: 'PDF o Excel completo' },
];

const exportButtonBase = 'inline-flex h-9 min-w-[72px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-gray-400 disabled:shadow-none';

export function ExportButton({ children, format, ...props }) {
  const tone = format === 'pdf'
    ? 'bg-slate-800 hover:bg-slate-900'
    : 'bg-emerald-600 hover:bg-emerald-700';
  const Icon = format === 'pdf' ? FileText : FileDown;

  return (
    <button
      type="button"
      className={`${exportButtonBase} ${tone}`}
      title={format === 'pdf' ? 'Exportar a PDF' : 'Exportar a Excel'}
      {...props}
    >
      <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

export function ExportActions({ disabled, onCsv, onPdf }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ExportButton format="csv" onClick={onCsv} disabled={disabled}>
        Excel
      </ExportButton>
      <ExportButton format="pdf" onClick={onPdf} disabled={disabled}>
        PDF
      </ExportButton>
    </div>
  );
}
