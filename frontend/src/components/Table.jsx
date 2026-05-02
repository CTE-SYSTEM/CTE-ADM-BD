import React from 'react';

const Table = ({ columns, data }) => {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="w-full table-fixed">
        <thead style={{ background: 'var(--bg)' }}>
          <tr>
            {columns.map((c) => (
              <th key={c.accessor} className="text-left p-3 text-sm" style={{ color: 'var(--text-h)' }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="p-6 text-center text-sm text-muted">No hay registros</td>
            </tr>
          )}
          {data.map((row, i) => (
            <tr key={i} style={{ background: 'var(--bg)' }}>
              {columns.map((c) => (
                <td key={c.accessor} className="p-3 text-sm" style={{ color: 'var(--text-h)' }}>
                  {c.render ? c.render(row) : row[c.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
