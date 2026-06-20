import { Edit3, Filter, Printer, Search, ShieldAlert } from 'lucide-react';
import logoCte from '../../../assets/Logo CTE.png';
import { EstadoBadge, PrioridadBadge } from './badges';
import { tourHighlightClass } from './constants';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatDate = (value) => {
  if (!value) return 'No registrada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No registrada';

  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatBool = (value) => (value ? 'Si' : 'No');

const getEquipoNombre = (equipo = {}) =>
  [equipo.marca, equipo.modelo].filter(Boolean).join(' ') || 'Equipo sin marca/modelo';

const buildPrintHtml = (diagnostico) => {
  const equipo = diagnostico.equipo || {};
  const cliente = equipo.cliente || diagnostico.cliente || {};
  const tecnico = diagnostico.tecnico || {};
  const companyName = 'CTE';

  const detailRows = [
    ['Cliente', cliente.nombre || 'No registrado'],
    ['Telefono', cliente.telefono || 'No registrado'],
    ['Tecnico responsable', tecnico.nombre || 'Sin tecnico asignado'],
    ['Fecha de ingreso', formatDate(diagnostico.fecha_hora)],
    ['Estado', diagnostico.estado_del_diagnostico || diagnostico.estado || 'No registrado'],
    ['Prioridad', diagnostico.prioridad || 'Normal'],
  ];

  const equipmentRows = [
    ['Tipo', equipo.tipo || 'No registrado'],
    ['Marca', equipo.marca || 'No registrada'],
    ['Modelo', equipo.modelo || 'No registrado'],
    ['Serie', equipo.numero_serie || equipo.serie || 'No registrada'],
    ['Cargador recibido', formatBool(diagnostico.deja_cargador)],
    ['Enciende', formatBool(diagnostico.enciende)],
    ['Usa corriente AC', formatBool(diagnostico.usa_corriente_ac)],
  ];

  const renderRows = (rows) => rows.map(([label, value]) => `
    <div class="field">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Hoja de diagnostico #${escapeHtml(diagnostico.id_diagnostico)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #e5e7eb;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
      }
      .sheet {
        width: 216mm;
        min-height: 279mm;
        margin: 0 auto;
        background: #ffffff;
        padding: 18mm;
      }
      .header {
        align-items: center;
        border-bottom: 3px solid #1f2937;
        display: flex;
        gap: 18px;
        padding-bottom: 18px;
      }
      .logo {
        align-items: center;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        display: flex;
        height: 78px;
        justify-content: center;
        padding: 8px;
        width: 112px;
      }
      .logo img {
        max-height: 100%;
        max-width: 100%;
        object-fit: contain;
      }
      .company { flex: 1; }
      .company h1 {
        font-size: 24px;
        letter-spacing: 0;
        margin: 0 0 4px;
        text-transform: uppercase;
      }
      .company p {
        color: #4b5563;
        font-size: 12px;
        margin: 0;
      }
      .folio {
        border: 1px solid #111827;
        border-radius: 8px;
        min-width: 140px;
        padding: 12px;
        text-align: center;
      }
      .folio span {
        color: #6b7280;
        display: block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .folio strong {
        display: block;
        font-family: Consolas, monospace;
        font-size: 24px;
        margin-top: 4px;
      }
      .title {
        margin: 22px 0 18px;
      }
      .title h2 {
        font-size: 20px;
        margin: 0;
        text-align: center;
        text-transform: uppercase;
      }
      .title p {
        color: #6b7280;
        font-size: 12px;
        margin-top: 6px;
        text-align: center;
      }
      .grid {
        display: grid;
        gap: 14px;
        grid-template-columns: 1fr 1fr;
      }
      .section {
        border: 1px solid #d1d5db;
        border-radius: 8px;
        margin-bottom: 14px;
        overflow: hidden;
      }
      .section h3 {
        background: #f3f4f6;
        border-bottom: 1px solid #d1d5db;
        font-size: 12px;
        letter-spacing: 0.08em;
        margin: 0;
        padding: 10px 12px;
        text-transform: uppercase;
      }
      .section-body {
        padding: 12px;
      }
      .field {
        border-bottom: 1px solid #e5e7eb;
        display: grid;
        gap: 10px;
        grid-template-columns: 42% 1fr;
        padding: 8px 0;
      }
      .field:last-child { border-bottom: 0; }
      .field span {
        color: #6b7280;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .field strong {
        color: #111827;
        font-size: 13px;
        line-height: 1.35;
      }
      .full {
        grid-column: 1 / -1;
      }
      .narrative {
        color: #111827;
        font-size: 13px;
        line-height: 1.55;
        min-height: 82px;
        white-space: pre-wrap;
      }
      .summary {
        border: 1px solid #111827;
        border-radius: 8px;
        display: grid;
        gap: 0;
        grid-template-columns: 1fr 1fr 1fr;
        margin: 18px 0;
      }
      .summary div {
        border-right: 1px solid #111827;
        padding: 10px;
        text-align: center;
      }
      .summary div:last-child { border-right: 0; }
      .summary span {
        color: #6b7280;
        display: block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .summary strong {
        display: block;
        font-size: 13px;
        margin-top: 5px;
      }
      .signature {
        display: grid;
        gap: 40px;
        grid-template-columns: 1fr 1fr;
        margin-top: 44px;
      }
      .signature-box {
        padding-top: 46px;
        text-align: center;
      }
      .signature-line {
        border-top: 1px solid #111827;
        padding-top: 8px;
      }
      .signature-line strong {
        display: block;
        font-size: 12px;
        text-transform: uppercase;
      }
      .signature-line span {
        color: #6b7280;
        display: block;
        font-size: 11px;
        margin-top: 3px;
      }
      .footer {
        border-top: 1px solid #d1d5db;
        color: #6b7280;
        font-size: 10px;
        margin-top: 32px;
        padding-top: 10px;
        text-align: center;
      }
      @page { margin: 0; size: letter; }
      @media print {
        body { background: #ffffff; }
        .sheet {
          box-shadow: none;
          margin: 0;
          min-height: auto;
          width: auto;
        }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <header class="header">
        <div class="logo"><img src="${escapeHtml(logoCte)}" alt="Logo ${escapeHtml(companyName)}" /></div>
        <div class="company">
          <h1>${escapeHtml(companyName)}</h1>
          <p>Hoja oficial de recepcion y diagnostico tecnico</p>
          <p>Documento para control interno y constancia del cliente.</p>
        </div>
        <div class="folio">
          <span>Diagnostico</span>
          <strong>#${escapeHtml(diagnostico.id_diagnostico || 'N/A')}</strong>
        </div>
      </header>

      <section class="title">
        <h2>Hoja de diagnostico</h2>
        <p>${escapeHtml(getEquipoNombre(equipo))}</p>
      </section>

      <section class="grid">
        <div class="section">
          <h3>Datos del cliente y atencion</h3>
          <div class="section-body">${renderRows(detailRows)}</div>
        </div>

        <div class="section">
          <h3>Datos del equipo</h3>
          <div class="section-body">${renderRows(equipmentRows)}</div>
        </div>

        <div class="section full">
          <h3>Motivo de ingreso a diagnostico</h3>
          <div class="section-body">
            <div class="narrative">${escapeHtml(diagnostico.falla_reportada || 'Sin motivo registrado')}</div>
          </div>
        </div>

        <div class="section full">
          <h3>Diagnostico tecnico</h3>
          <div class="section-body">
            <div class="narrative">${escapeHtml(diagnostico.diagnostico_real || 'Pendiente de registrar diagnostico tecnico.')}</div>
          </div>
        </div>
      </section>

      <section class="summary">
        <div><span>Numero</span><strong>#${escapeHtml(diagnostico.id_diagnostico || 'N/A')}</strong></div>
        <div><span>Aprobacion</span><strong>${escapeHtml(diagnostico.Estado_aprobacion || 'Pendiente')}</strong></div>
        <div><span>Presupuesto</span><strong>${escapeHtml(diagnostico.presupuesto_estimado ? `C$ ${Number(diagnostico.presupuesto_estimado).toFixed(2)}` : 'Pendiente')}</strong></div>
      </section>

      <section class="signature">
        <div class="signature-box">
          <div class="signature-line">
            <strong>${escapeHtml(cliente.nombre || 'Cliente')}</strong>
            <span>Firma del cliente</span>
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            <strong>${escapeHtml(tecnico.nombre || companyName)}</strong>
            <span>Recibido por / tecnico responsable</span>
          </div>
        </div>
      </section>

      <footer class="footer">
        Esta hoja respalda la recepcion del equipo y el resultado del diagnostico registrado en el sistema.
      </footer>
    </main>
  </body>
</html>`;
};

export const printDiagnostico = (diagnostico) => {
  const printWindow = window.open('', '_blank', 'width=900,height=1100');
  if (!printWindow) {
    window.alert('Permita las ventanas emergentes para imprimir la hoja de diagnostico.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintHtml(diagnostico));
  printWindow.document.close();
  printWindow.focus();

  const runPrint = () => {
    printWindow.print();
  };

  if (printWindow.document.readyState === 'complete') {
    window.setTimeout(runPrint, 250);
  } else {
    printWindow.addEventListener('load', () => window.setTimeout(runPrint, 250), { once: true });
  }
};

const TableRow = ({ diagnostico, onEdit }) => {
  const tieneTecnico = Boolean(diagnostico.tecnico_id || diagnostico.id_tecnico);

  return (
    <tr className="hover:bg-indigo-50/30 transition-colors">
      <td className="px-4 py-3 font-mono font-bold text-indigo-600">#{diagnostico.id_diagnostico}</td>
      <td className="px-4 py-3 font-medium text-gray-900">{diagnostico.equipo?.cliente?.nombre || 'N/A'}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-bold text-gray-700">{diagnostico.equipo?.modelo || 'Sin modelo'}</span>
          <span className="text-[10px] uppercase text-gray-400">{diagnostico.equipo?.marca || 'Sin marca'}</span>
          <span className="text-xs font-bold text-indigo-600">{diagnostico.equipo?.tipo || 'Sin tipo'}</span>
        </div>
      </td>
      <td className="px-4 py-3 max-w-xs truncate">{diagnostico.falla_reportada}</td>
      <td className="px-4 py-3 text-center"><PrioridadBadge prioridad={diagnostico.prioridad || 'Normal'} /></td>
      <td className="px-4 py-3 text-center"><EstadoBadge estado={diagnostico.estado_del_diagnostico || diagnostico.estado} /></td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => printDiagnostico(diagnostico)}
            className="p-2 text-slate-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm hover:shadow"
            title="Imprimir hoja de diagnostico"
          >
            <Printer className="w-4 h-4" />
          </button>
          {tieneTecnico ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-semibold" title="Asignado a tecnico. No editable.">
              <ShieldAlert className="w-4 h-4" /> Asignado
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEdit(diagnostico)}
              className="p-2 text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-indigo-200 transition-all shadow-sm hover:shadow"
              title="Editar Registro"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export const DiagnosticosTable = ({
  activeTourTarget,
  diagnosticos,
  filterTecnico,
  loading,
  onEdit,
  onFilterChange,
  onSearchChange,
  searchTerm,
}) => (
  <section data-tour-target="table" className={`space-y-4 ${tourHighlightClass(activeTourTarget === 'table')}`}>
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <h3 className="text-lg font-bold text-gray-700">Registros Recientes</h3>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID, cliente o modelo..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm bg-white"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
          <select
            value={filterTecnico}
            onChange={(event) => onFilterChange(event.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium text-gray-700 appearance-none cursor-pointer"
          >
            <option value="TODOS">Todos los registros</option>
            <option value="SIN_ASIGNAR">Sin Tecnico (Editables)</option>
            <option value="ASIGNADOS">Ya Asignados</option>
          </select>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="max-h-[70vh] overflow-auto custom-scrollbar">
        <table className="min-w-max w-full text-sm text-left text-gray-500">
          <thead className="sticky top-0 z-10 text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-bold">ID</th>
              <th className="px-4 py-3 font-bold">Cliente</th>
              <th className="px-4 py-3 font-bold">Equipo</th>
              <th className="px-4 py-3 font-bold">Falla</th>
              <th className="px-4 py-3 font-bold text-center">Prioridad</th>
              <th className="px-4 py-3 font-bold text-center">Estado</th>
              <th className="px-4 py-3 font-bold text-right">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {diagnosticos.length > 0 ? (
              diagnosticos.map((diagnostico) => (
                <TableRow key={diagnostico.id_diagnostico} diagnostico={diagnostico} onEdit={onEdit} />
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-10 text-center text-gray-400 italic bg-gray-50/50">
                  {loading ? 'Cargando datos...' : 'No se encontraron diagnosticos que coincidan con los filtros.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);
