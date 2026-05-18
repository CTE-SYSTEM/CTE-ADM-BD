import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const escapeValue = (value) => {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const serializeCsv = (rows, columns) => {
  const headerRow = columns.map((col) => escapeValue(col.header)).join(',');
  const dataRows = rows.map((row) =>
    columns
      .map((col) => escapeValue(row[col.accessor]))
      .join(',')
  );
  return [headerRow, ...dataRows].join('\r\n');
};

const normalizePdfCell = (value) => {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const buildPdfTableData = (rows, columns) => {
  const headers = columns.map((col) => col.header);
  const body = rows.map((row) =>
    columns.map((col) => normalizePdfCell(row[col.accessor]))
  );

  return { headers, body };
};

const formatReportDate = () => {
  return new Date().toLocaleString('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const parseNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const cleaned = value.replace(/[^0-9.-]+/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
};

const getNumericSummaries = (rows, columns) => {
  return columns
    .map((column) => {
      const values = rows
        .map((row) => parseNumber(row[column.accessor]))
        .filter((value) => value !== null);

      if (!values.length || values.length < Math.max(2, Math.ceil(rows.length * 0.6))) return null;

      const total = values.reduce((sum, value) => sum + value, 0);
      return {
        label: column.header,
        value: total,
      };
    })
    .filter(Boolean)
    .slice(0, 3);
};

const drawHeader = (doc, title, rows, columns) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedAt = formatReportDate();
  const summaries = getNumericSummaries(rows, columns);

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setFillColor(79, 70, 229);
  doc.roundedRect(14, 10, 12, 12, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CTE', 16.2, 18);

  doc.setFontSize(16);
  doc.text(title, 32, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Centro Tecnico Electronico - Admin Pro', 32, 21);
  doc.text(`Generado: ${generatedAt}`, 32, 26);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, pageWidth - 28, summaries.length ? 30 : 18, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, pageWidth - 28, summaries.length ? 30 : 18, 3, 3, 'S');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Resumen del reporte', 20, 51);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${rows.length} registros exportados`, 20, 57);

  summaries.forEach((summary, index) => {
    const x = 20 + index * 58;
    const y = 66;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(String(summary.label).slice(0, 22), x, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(summary.value.toLocaleString('es-NI', { maximumFractionDigits: 2 }), x, y + 6);
  });

  return summaries.length ? 80 : 68;
};

const drawFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('CTE Admin Pro', 14, pageHeight - 9);
    doc.text(`Pagina ${page} de ${pageCount}`, pageWidth - 14, pageHeight - 9, { align: 'right' });
  }
};

export const downloadJsonCsv = (rows, columns, filename) => {
  const csv = serializeCsv(rows, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadJsonPdf = (rows, columns, filename, title = 'Reporte') => {
  const doc = new jsPDF();
  const { headers, body } = buildPdfTableData(rows, columns);
  const startY = drawHeader(doc, title, rows, columns);

  autoTable(doc, {
    head: [headers],
    body,
    startY,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: '#ffffff',
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    styles: {
      overflow: 'linebreak',
      cellWidth: 'wrap',
      font: 'helvetica',
      valign: 'middle',
    },
    margin: { left: 14, right: 14 },
    pageBreak: 'auto',
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 16, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(title, 14, 10);
      }
    },
  });

  drawFooter(doc);
  doc.save(filename);
};
