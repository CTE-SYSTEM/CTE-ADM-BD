import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const escapeHtml = (value) => {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const escapeXml = escapeHtml;

const getColumnName = (index) => {
  let column = '';
  let value = index + 1;

  while (value > 0) {
    const remainder = (value - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    value = Math.floor((value - 1) / 26);
  }

  return column;
};

const normalizeExcelValue = (value) => {
  if (value == null) return { type: 'string', value: '' };
  if (typeof value === 'number' && Number.isFinite(value)) return { type: 'number', value };
  if (typeof value === 'object') return { type: 'string', value: JSON.stringify(value) };
  return { type: 'string', value: String(value) };
};

const buildExcelCell = (value, rowIndex, columnIndex) => {
  const cellRef = `${getColumnName(columnIndex)}${rowIndex}`;
  const normalized = normalizeExcelValue(value);

  if (normalized.type === 'number') {
    return `<c r="${cellRef}"><v>${normalized.value}</v></c>`;
  }

  return `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(normalized.value)}</t></is></c>`;
};

const buildWorksheetXml = (rows, columns) => {
  const headerRow = `<row r="1">${columns.map((column, columnIndex) => buildExcelCell(column.header, 1, columnIndex)).join('')}</row>`;
  const dataRows = rows.map((row, rowIndex) => {
    const excelRowIndex = rowIndex + 2;
    return `<row r="${excelRowIndex}">${columns.map((column, columnIndex) => buildExcelCell(row[column.accessor], excelRowIndex, columnIndex)).join('')}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${headerRow}${dataRows}</sheetData>
</worksheet>`;
};

const encoder = new TextEncoder();

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return crc >>> 0;
});

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (view, offset, value) => view.setUint16(offset, value, true);
const writeUint32 = (view, offset, value) => view.setUint32(offset, value, true);

const concatBytes = (parts) => {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });

  return result;
};

const createZip = (files) => {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
    const checksum = crc32(contentBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, 0);
    writeUint16(localView, 12, 0);
    writeUint32(localView, 14, checksum);
    writeUint32(localView, 18, contentBytes.length);
    writeUint32(localView, 22, contentBytes.length);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, 0);
    writeUint16(centralView, 14, 0);
    writeUint32(centralView, 16, checksum);
    writeUint32(centralView, 20, contentBytes.length);
    writeUint32(centralView, 24, contentBytes.length);
    writeUint16(centralView, 28, nameBytes.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + contentBytes.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const endHeader = new Uint8Array(22);
  const endView = new DataView(endHeader.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, files.length);
  writeUint16(endView, 10, files.length);
  writeUint32(endView, 12, centralDirectory.length);
  writeUint32(endView, 16, offset);
  writeUint16(endView, 20, 0);

  return concatBytes([...localParts, centralDirectory, endHeader]);
};

const serializeExcel = (rows, columns) => {
  const worksheetXml = buildWorksheetXml(rows, columns);

  return createZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Reporte" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: worksheetXml,
    },
  ]);
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

const drawSectionTitle = (doc, title, y) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    y = 26;
  }

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title, 18, y + 6.5);

  return y + 14;
};

const drawMetadata = (doc, metadata, startY) => {
  if (!metadata?.length) return startY;

  autoTable(doc, {
    body: metadata.map((item) => [item.label, item.value]),
    startY,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      textColor: [71, 85, 105],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 44 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 17, right: 17 },
  });

  return doc.lastAutoTable.finalY + 8;
};

const drawEmptySection = (doc, y) => {
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Sin registros para este periodo.', 18, y);
  return y + 8;
};

export const downloadJsonCsv = (rows, columns, filename) => {
  const excel = serializeExcel(rows, columns);
  const excelFilename = filename.replace(/\.(csv|xls)$/i, '.xlsx');
  const blob = new Blob([excel], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = excelFilename;
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

export const downloadSectionedPdf = ({
  title = 'Reporte general',
  filename = 'reporte_general.pdf',
  description = '',
  metadata = [],
  sections = [],
}) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const totalRows = sections.reduce((sum, section) => sum + (section.rows?.length || 0), 0);
  let cursorY = drawHeader(doc, title, [{ total: totalRows }], [{ header: 'Registros', accessor: 'total' }]);

  if (description) {
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(description, 18, cursorY - 6, { maxWidth: doc.internal.pageSize.getWidth() - 36 });
  }

  cursorY = drawMetadata(doc, metadata, cursorY);

  sections.forEach((section) => {
    cursorY = drawSectionTitle(doc, section.title, cursorY);

    if (!section.rows?.length) {
      cursorY = drawEmptySection(doc, cursorY);
      return;
    }

    const { headers, body } = buildPdfTableData(section.rows, section.columns);

    autoTable(doc, {
      head: [headers],
      body,
      startY: cursorY,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: '#ffffff',
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [51, 65, 85],
        cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'auto',
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

    cursorY = doc.lastAutoTable.finalY + 12;
  });

  drawFooter(doc);
  doc.save(filename);
};
