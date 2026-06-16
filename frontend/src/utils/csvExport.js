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

const EXCEL_STYLE = {
  default: 0,
  title: 1,
  subtitle: 2,
  summaryLabel: 3,
  summaryValue: 4,
  header: 5,
  text: 6,
  textAlt: 7,
  number: 8,
  numberAlt: 9,
};

const buildExcelCell = (value, rowIndex, columnIndex, styleId = EXCEL_STYLE.default) => {
  const cellRef = `${getColumnName(columnIndex)}${rowIndex}`;
  const normalized = normalizeExcelValue(value);
  const style = styleId ? ` s="${styleId}"` : '';

  if (normalized.type === 'number') {
    return `<c r="${cellRef}"${style}><v>${normalized.value}</v></c>`;
  }

  return `<c r="${cellRef}"${style} t="inlineStr"><is><t>${escapeXml(normalized.value)}</t></is></c>`;
};

const buildColumnWidths = (rows, columns) => columns.map((column, index) => {
  const maxContent = rows.reduce((max, row) => {
    const value = normalizeExcelValue(row[column.accessor]).value;
    return Math.max(max, String(value).length);
  }, String(column.header || '').length);
  const width = Math.min(Math.max(maxContent + 4, 14), 42);
  return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
}).join('');

const buildWorksheetXml = (rows, columns, options = {}) => {
  const title = options.title || 'Reporte';
  const generatedAt = formatReportDate();
  const summaries = getNumericSummaries(rows, columns);
  const columnCount = Math.max(columns.length, 1);
  const lastColumn = getColumnName(columnCount - 1);
  const headerRowIndex = summaries.length ? 4 + summaries.length + 1 : 4;
  const headerRow = `<row r="${headerRowIndex}" ht="22" customHeight="1">${columns.map((column, columnIndex) => buildExcelCell(column.header, headerRowIndex, columnIndex, EXCEL_STYLE.header)).join('')}</row>`;
  const dataRows = rows.map((row, rowIndex) => {
    const excelRowIndex = rowIndex + headerRowIndex + 1;
    const rowStyle = rowIndex % 2 === 0 ? EXCEL_STYLE.text : EXCEL_STYLE.textAlt;
    return `<row r="${excelRowIndex}">${columns.map((column, columnIndex) => {
      const normalized = normalizeExcelValue(row[column.accessor]);
      const style = normalized.type === 'number'
        ? (rowIndex % 2 === 0 ? EXCEL_STYLE.number : EXCEL_STYLE.numberAlt)
        : rowStyle;
      return buildExcelCell(row[column.accessor], excelRowIndex, columnIndex, style);
    }).join('')}</row>`;
  }).join('');
  const summaryRows = summaries.map((summary, index) => {
    const rowIndex = 4 + index;
    return `<row r="${rowIndex}">${buildExcelCell(summary.label, rowIndex, 0, EXCEL_STYLE.summaryLabel)}${buildExcelCell(summary.value, rowIndex, 1, EXCEL_STYLE.summaryValue)}</row>`;
  }).join('');
  const mergeCells = columnCount > 1
    ? [
      `<mergeCell ref="A1:${lastColumn}1"/>`,
      `<mergeCell ref="A2:${lastColumn}2"/>`,
    ]
    : [];

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${Math.max(headerRowIndex + rows.length, headerRowIndex)}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="${headerRowIndex}" topLeftCell="A${headerRowIndex + 1}" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>${buildColumnWidths(rows, columns)}</cols>
  <sheetData>
    <row r="1" ht="26" customHeight="1">${buildExcelCell(title, 1, 0, EXCEL_STYLE.title)}</row>
    <row r="2">${buildExcelCell(`Centro Tecnico Electronico - Admin Pro | Generado: ${generatedAt} | ${rows.length} registros`, 2, 0, EXCEL_STYLE.subtitle)}</row>
    ${summaries.length ? `<row r="3">${buildExcelCell('Resumen del reporte', 3, 0, EXCEL_STYLE.summaryLabel)}</row>${summaryRows}` : ''}
    ${headerRow}${dataRows}
  </sheetData>
  <autoFilter ref="A${headerRowIndex}:${lastColumn}${Math.max(headerRowIndex + rows.length, headerRowIndex)}"/>
  ${mergeCells.length ? `<mergeCells count="${mergeCells.length}">${mergeCells.join('')}</mergeCells>` : ''}
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

const excelStylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="#,##0.00"/>
  </numFmts>
  <fonts count="4">
    <font><sz val="10"/><color rgb="FF334155"/><name val="Calibri"/></font>
    <font><b/><sz val="15"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FFCBD5E1"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF4F46E5"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFE2E8F0"/></left><right style="thin"><color rgb="FFE2E8F0"/></right><top style="thin"><color rgb="FFE2E8F0"/></top><bottom style="thin"><color rgb="FFE2E8F0"/></bottom><diagonal/></border>
    <border><bottom style="medium"><color rgb="FF4F46E5"/></bottom></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="10">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="0" fillId="4" borderId="2" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;

const serializeExcel = (rows, columns, options = {}) => {
  const worksheetXml = buildWorksheetXml(rows, columns, options);

  return createZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
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
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      content: excelStylesXml,
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

const saveExcel = (excel, filename) => {
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

export const downloadJsonCsv = (rows, columns, filename, title = 'Reporte') => {
  const excel = serializeExcel(rows, columns, { title });
  saveExcel(excel, filename);
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

const buildSectionedWorksheetXml = ({ title, description, metadata, sections }) => {
  const generatedAt = formatReportDate();
  const maxColumns = Math.max(1, ...sections.map((section) => section.columns?.length || 1));
  const lastColumn = getColumnName(maxColumns - 1);
  const rowsXml = [
    `<row r="1" ht="26" customHeight="1">${buildExcelCell(title, 1, 0, EXCEL_STYLE.title)}</row>`,
    `<row r="2">${buildExcelCell(`Centro Tecnico Electronico - Admin Pro | Generado: ${generatedAt}`, 2, 0, EXCEL_STYLE.subtitle)}</row>`,
  ];
  let rowIndex = 3;

  if (description) {
    rowsXml.push(`<row r="${rowIndex}">${buildExcelCell(description, rowIndex, 0, EXCEL_STYLE.text)}</row>`);
    rowIndex += 1;
  }

  (metadata || []).forEach((item) => {
    rowsXml.push(`<row r="${rowIndex}">${buildExcelCell(item.label, rowIndex, 0, EXCEL_STYLE.summaryLabel)}${buildExcelCell(item.value, rowIndex, 1, EXCEL_STYLE.summaryValue)}</row>`);
    rowIndex += 1;
  });

  rowIndex += 1;

  (sections || []).forEach((section) => {
    rowsXml.push(`<row r="${rowIndex}" ht="22" customHeight="1">${buildExcelCell(section.title, rowIndex, 0, EXCEL_STYLE.title)}</row>`);
    rowIndex += 1;

    rowsXml.push(`<row r="${rowIndex}">${(section.columns || []).map((column, columnIndex) => buildExcelCell(column.header, rowIndex, columnIndex, EXCEL_STYLE.header)).join('')}</row>`);
    rowIndex += 1;

    if (!section.rows?.length) {
      rowsXml.push(`<row r="${rowIndex}">${buildExcelCell('Sin registros para este periodo.', rowIndex, 0, EXCEL_STYLE.textAlt)}</row>`);
      rowIndex += 1;
    } else {
      section.rows.forEach((row, index) => {
        rowsXml.push(`<row r="${rowIndex}">${section.columns.map((column, columnIndex) => {
          const normalized = normalizeExcelValue(row[column.accessor]);
          const style = normalized.type === 'number'
            ? (index % 2 === 0 ? EXCEL_STYLE.number : EXCEL_STYLE.numberAlt)
            : (index % 2 === 0 ? EXCEL_STYLE.text : EXCEL_STYLE.textAlt);
          return buildExcelCell(row[column.accessor], rowIndex, columnIndex, style);
        }).join('')}</row>`);
        rowIndex += 1;
      });
    }

    rowIndex += 1;
  });

  const mergeCells = maxColumns > 1
    ? [
      `<mergeCell ref="A1:${lastColumn}1"/>`,
      `<mergeCell ref="A2:${lastColumn}2"/>`,
    ]
    : [];

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${Math.max(rowIndex, 2)}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <cols>${Array.from({ length: maxColumns }, (_, index) => `<col min="${index + 1}" max="${index + 1}" width="${index === 0 ? 24 : 20}" customWidth="1"/>`).join('')}</cols>
  <sheetData>${rowsXml.join('')}</sheetData>
  ${mergeCells.length ? `<mergeCells count="${mergeCells.length}">${mergeCells.join('')}</mergeCells>` : ''}
</worksheet>`;
};

export const downloadSectionedExcel = ({
  title = 'Reporte general',
  filename = 'reporte_general.xlsx',
  description = '',
  metadata = [],
  sections = [],
}) => {
  const worksheetXml = buildSectionedWorksheetXml({ title, description, metadata, sections });
  const excel = createZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
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
  <sheets><sheet name="Reporte" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: 'xl/styles.xml', content: excelStylesXml },
    { name: 'xl/worksheets/sheet1.xml', content: worksheetXml },
  ]);

  saveExcel(excel, filename);
};
