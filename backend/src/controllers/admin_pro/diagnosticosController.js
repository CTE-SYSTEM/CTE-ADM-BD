import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';
import { DIAGNOSTICO_ESTADOS } from '../../utils/domainValidation.js';

export const getDiagnosticosAdmin = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const { fecha_inicio, fecha_fin, year, month, week } = req.query;
    const where = {};

    if (search) {
      const isNumeric = /^\d+$/.test(search);
      where.OR = [
        ...(isNumeric ? [{ id_diagnostico: Number(search) }] : []),
        { falla_reportada: { contains: search, mode: 'insensitive' } },
        { diagnostico_real: { contains: search, mode: 'insensitive' } },
        { estado_del_diagnostico: { contains: search, mode: 'insensitive' } },
        { Estado_aprobacion: { contains: search, mode: 'insensitive' } },
        { prioridad: { contains: search, mode: 'insensitive' } },
        { equipo: { marca: { contains: search, mode: 'insensitive' } } },
        { equipo: { modelo: { contains: search, mode: 'insensitive' } } },
        { equipo: { numero_serie: { contains: search, mode: 'insensitive' } } },
        { equipo: { cliente: { nombre: { contains: search, mode: 'insensitive' } } } },
        { tecnico: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const dateFilter = buildDiagnosticoDateFilter({ fecha_inicio, fecha_fin, year, month, week });
    if (dateFilter) where.fecha_hora = dateFilter;

    const diagnosticos = await prisma.diagnosticos.findMany({
      where,
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true,
        ordenes: { include: { tecnico: true }, orderBy: { id_orden: 'desc' } },
      },
      orderBy: { fecha_hora: 'desc' },
    });

    res.json({ data: diagnosticos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener diagnosticos', details: error.message });
  }
};

const toValidInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const buildDiagnosticoDateFilter = ({ fecha_inicio, fecha_fin, year, month, week }) => {
  if (fecha_inicio || fecha_fin) {
    const range = {};
    if (fecha_inicio) range.gte = new Date(`${fecha_inicio}T00:00:00`);
    if (fecha_fin) range.lte = new Date(`${fecha_fin}T23:59:59`);
    return range;
  }

  const selectedYear = toValidInt(year);
  if (!selectedYear) return null;

  const selectedMonth = toValidInt(month);
  const selectedWeek = toValidInt(week);
  let start;
  let end;

  if (selectedMonth && selectedMonth >= 1 && selectedMonth <= 12) {
    start = new Date(selectedYear, selectedMonth - 1, 1);
    end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
  } else {
    start = new Date(selectedYear, 0, 1);
    end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
  }

  if (selectedWeek && selectedWeek >= 1 && selectedWeek <= 53) {
    const monthStart = selectedMonth ? new Date(selectedYear, selectedMonth - 1, 1) : new Date(selectedYear, 0, 1);
    start = new Date(monthStart);
    start.setDate(monthStart.getDate() + ((selectedWeek - 1) * 7));
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  return { gte: start, lte: end };
};

const escapeExcelCell = (value) => {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const downloadDiagnosticosReporteAdmin = async (req, res) => {
  try {
    const dateFilter = buildDiagnosticoDateFilter(req.query);
    const diagnosticos = await prisma.diagnosticos.findMany({
      where: dateFilter ? { fecha_hora: dateFilter } : {},
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true,
      },
      orderBy: { fecha_hora: 'desc' },
    });

    const headers = ['ID', 'Fecha', 'Cliente', 'Telefono', 'Equipo', 'Tecnico', 'Estado', 'Aprobacion', 'Prioridad', 'Presupuesto', 'Falla', 'Diagnostico'];
    const rows = diagnosticos.map((item) => [
      item.id_diagnostico,
      item.fecha_hora ? item.fecha_hora.toISOString() : '',
      item.equipo?.cliente?.nombre || '-',
      item.equipo?.cliente?.telefono || item.equipo?.cliente?.contacto_secundario || '-',
      [item.equipo?.tipo, item.equipo?.marca, item.equipo?.modelo, item.equipo?.numero_serie].filter(Boolean).join(' ') || '-',
      item.tecnico?.nombre || 'Sin asignar',
      item.estado_del_diagnostico,
      item.Estado_aprobacion,
      item.prioridad || '-',
      item.presupuesto_estimado ?? 0,
      item.falla_reportada || '-',
      item.diagnostico_real || '-',
    ]);

    const headerHtml = headers.map((header) => `<th>${escapeExcelCell(header)}</th>`).join('');
    const rowsHtml = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeExcelCell(cell)}</td>`).join('')}</tr>`)
      .join('');
    const excel = `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <table>
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </body>
</html>`;
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="diagnosticos-reporte.xls"');
    res.send(excel);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar reporte de diagnosticos', details: error.message });
  }
};

export const updateDiagnosticoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tecnico_id,
      falla_reportada,
      diagnostico_real,
      presupuesto_estimado,
      prioridad,
      estado_del_diagnostico,
      Estado_aprobacion,
    } = req.body;

    const data = {};
    if (tecnico_id !== undefined) data.tecnico_id = tecnico_id ? Number(tecnico_id) : null;
    if (falla_reportada !== undefined) data.falla_reportada = String(falla_reportada).trim() || null;
    if (diagnostico_real !== undefined) data.diagnostico_real = String(diagnostico_real).trim() || null;
    if (presupuesto_estimado !== undefined) data.presupuesto_estimado = presupuesto_estimado === '' || presupuesto_estimado === null ? null : Number(presupuesto_estimado);
    if (prioridad !== undefined) data.prioridad = String(prioridad).trim() || 'Normal';
    if (estado_del_diagnostico !== undefined) {
      if (!DIAGNOSTICO_ESTADOS.includes(estado_del_diagnostico)) {
        return res.status(400).json({ error: 'Estado de diagnostico invalido', estados_validos: DIAGNOSTICO_ESTADOS });
      }
      data.estado_del_diagnostico = estado_del_diagnostico;
    }
    if (Estado_aprobacion !== undefined) data.Estado_aprobacion = String(Estado_aprobacion).trim() || 'Pendiente';

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    const diagnostico = await prisma.diagnosticos.update({
      where: { id_diagnostico: Number(id) },
      data,
      include: {
        equipo: { include: { cliente: true } },
        tecnico: true,
        ordenes: { include: { tecnico: true }, orderBy: { id_orden: 'desc' } },
      },
    });

    res.json({ data: diagnostico });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnostico no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar diagnostico', details: error.message });
  }
};

export const updateDiagnosticoEstadoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_del_diagnostico } = req.body;

    if (!estado_del_diagnostico || !DIAGNOSTICO_ESTADOS.includes(estado_del_diagnostico)) {
      return res.status(400).json({
        error: 'Estado de diagnóstico inválido',
        estados_validos: DIAGNOSTICO_ESTADOS,
      });
    }

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT admin_pro.actualizar_estado_diagnostico(${Number(id)}, ${estado_del_diagnostico}) AS data
    `);
    const diagnostico = row?.data;

    if (diagnostico?.error) return res.status(404).json({ error: diagnostico.error });

    res.json({ data: diagnostico });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar estado del diagnóstico', details: error.message });
  }
};
