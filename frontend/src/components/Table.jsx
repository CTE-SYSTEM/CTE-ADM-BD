import React from 'react';

const Table = ({ columns, data }) => {
  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            {columns.map((c) => (
              <th 
                key={c.accessor} 
                className="text-left px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-tight whitespace-nowrap"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-10 text-center text-gray-400 font-light">
                No hay registros disponibles
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/30 transition-all duration-200">
                {columns.map((c) => (
                  <td 
                    key={c.accessor} 
                    /* 
                       "align-top" hace que si una celda crece, 
                       el resto del contenido de la fila se quede arriba. 
                    */
                    className="px-6 py-4 text-sm text-gray-600 align-top"
                  >
                    {/* 
                        Este div controla el comportamiento global:
                        - "max-w-[300px]": Evita que una columna estire la tabla al infinito.
                        - "whitespace-normal": Permite saltos de línea automáticos.
                        - "break-words": Rompe palabras largas (links o correos).
                    */}
                    <div className="max-w-[280px] whitespace-normal break-words leading-relaxed">
                      {c.render ? c.render(row) : (row[c.accessor] || '-')}
                    </div>
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;