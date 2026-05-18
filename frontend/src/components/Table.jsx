import React from 'react';

const defaultContentClassName = 'max-w-[220px] whitespace-normal break-words leading-relaxed';

const Table = ({ columns, data }) => {
  return (
    <div className="w-full min-w-0 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm custom-scrollbar max-h-[calc(100vh-260px)]">
      <table className="w-full min-w-max table-auto border-collapse">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-gray-100 bg-gray-50/50">
            {columns.map((c, index) => (
              <th 
                key={c.accessor || c.header || index} 
                className="text-left px-3 py-3 text-[13px] font-semibold text-gray-400 uppercase tracking-tight whitespace-nowrap sm:px-6 sm:py-4"
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
                {columns.map((c, colIndex) => (
                  <td 
                    key={c.accessor || c.header || colIndex} 
                    /* 
                       "align-top" hace que si una celda crece, 
                       el resto del contenido de la fila se quede arriba. 
                    */
                    className={`min-w-0 px-3 py-3 text-sm text-gray-600 align-top sm:px-5 sm:py-3.5 ${c.cellClassName || ''}`}
                  >
                    {/* 
                        Este div controla el comportamiento global:
                        - "max-w-[300px]": Evita que una columna estire la tabla al infinito.
                        - "whitespace-normal": Permite saltos de línea automáticos.
                        - "break-words": Rompe palabras largas (links o correos).
                    */}
                    <div className={c.contentClassName || defaultContentClassName}>
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
