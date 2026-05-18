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

  doc.setFontSize(18);
  doc.text(title, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(60);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 26,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: '#ffffff',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
    },
    styles: {
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    margin: { left: 14, right: 14 },
    pageBreak: 'auto',
  });

  doc.save(filename);
};
