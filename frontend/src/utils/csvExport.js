export const downloadJsonCsv = (rows, columns, filename) => {
  const escapeValue = (value) => {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const headerRow = columns.map((col) => escapeValue(col.header)).join(',');
  const dataRows = rows.map((row) =>
    columns.map((col) => escapeValue(row[col.accessor])).join(',')
  );
  const csv = [headerRow, ...dataRows].join('\r\n');
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
