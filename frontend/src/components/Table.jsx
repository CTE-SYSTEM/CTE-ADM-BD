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
            <th className="text-right p-3 text-sm" style={{ color: 'var(--text-h)' }}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="p-6 text-center text-sm text-muted">No hay registros</td>
            </tr>
          )}
          {data.map((row, i) => (
            <tr key={i} style={{ background: 'var(--bg)' }}>
              {columns.map((c) => (
                <td key={c.accessor} className="p-3 text-sm" style={{ color: 'var(--text-h)' }}>{row[c.accessor]}</td>
              ))}
              <td className="p-3 text-sm text-right">
                <button className="mr-2" style={{ color: 'var(--primary-600)' }}>Editar</button>
                <button style={{ color: '#ef4444' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
