import React, { useState, useMemo, useEffect, useRef } from 'react';

const defaultContentClassName = 'max-w-[220px] whitespace-normal break-words leading-relaxed';

const Table = ({ columns, data, sortable = false, emptyMessage = 'No hay registros disponibles', emptyClassName = '' }) => {
  // Estado para controlar qué columna ordena y en qué sentido ('asc' o 'desc')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const topScrollRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const tableRef = useRef(null);
  const [showTopScrollbar, setShowTopScrollbar] = useState(false);

  useEffect(() => {
    const topScroll = topScrollRef.current;
    const tableWrapper = tableWrapperRef.current;
    const table = tableRef.current;
    if (!topScroll || !tableWrapper || !table) return;

    const updateTopScroll = () => {
      const needsScroll = tableWrapper.scrollWidth > tableWrapper.clientWidth;
      setShowTopScrollbar(needsScroll);
      topScroll.firstElementChild.style.width = `${tableWrapper.scrollWidth}px`;
      if (needsScroll) {
        topScroll.scrollLeft = tableWrapper.scrollLeft;
      }
    };

    const syncFromTop = () => {
      if (Math.abs(topScroll.scrollLeft - tableWrapper.scrollLeft) > 1) {
        tableWrapper.scrollLeft = topScroll.scrollLeft;
      }
    };

    const syncFromTable = () => {
      if (Math.abs(topScroll.scrollLeft - tableWrapper.scrollLeft) > 1) {
        topScroll.scrollLeft = tableWrapper.scrollLeft;
      }
    };

    topScroll.addEventListener('scroll', syncFromTop, { passive: true });
    tableWrapper.addEventListener('scroll', syncFromTable, { passive: true });

    const resizeObserver = new ResizeObserver(updateTopScroll);
    resizeObserver.observe(tableWrapper);
    resizeObserver.observe(table);
    updateTopScroll();

    window.addEventListener('resize', updateTopScroll);

    return () => {
      topScroll.removeEventListener('scroll', syncFromTop);
      tableWrapper.removeEventListener('scroll', syncFromTable);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateTopScroll);
    };
  }, [data, columns]);

  const normalizedData = Array.isArray(data) ? data : [];
  const hasData = normalizedData.length > 0;

  // Manejador del clic en las cabeceras (solo se ejecuta si sortable es true)
  const handleSort = (accessor) => {
    if (!accessor) return;

    let direction = 'asc';
    if (sortConfig.key === accessor && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: accessor, direction });
  };

  // Procesamos los datos: si "sortable" es true, aplica el algoritmo; si no, devuelve los datos planos originales
  const processedData = useMemo(() => {
    // Si la propiedad sortable no está activa, o no se ha hecho clic en ninguna columna, va por la normal
    if (!sortable || sortConfig.key === null) {
      return data;
    }

    let sortableItems = [...data];
    sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // 1. Normalización para valores nulos, vacíos o guiones
      if (aValue === undefined || aValue === null || aValue === '-') aValue = '';
      if (bValue === undefined || bValue === null || bValue === '-') bValue = '';

      // 2. Limpieza para valores de moneda (ej: "$ 150.00")
      if (typeof aValue === 'string' && aValue.includes('$')) {
        aValue = Number(aValue.replace(/[^0-9.-]+/g, '')) || 0;
        bValue = Number(bValue.replace(/[^0-9.-]+/g, '')) || 0;
      }

      // 3. Limpieza para fechas en formato de texto local (ej: DD/MM/AAAA)
      if (typeof aValue === 'string' && aValue.includes('/') && aValue.split('/').length === 3) {
        const partsA = aValue.split('/');
        const partsB = bValue.split('/');
        aValue = new Date(partsA[2], partsA[1] - 1, partsA[0]).getTime() || 0;
        bValue = new Date(partsB[2], partsB[1] - 1, partsB[0]).getTime() || 0;
      }

      // 4. Comparación puramente numérica (cantidades, IDs, stocks)
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // 5. Comparación de texto estándar (alfabético)
      const strA = aValue.toString().toLowerCase();
      const strB = bValue.toString().toLowerCase();

      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortableItems;
  }, [data, sortConfig, sortable]);

  if (!hasData) {
    return (
      <div className={`w-full min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm ${emptyClassName}`.trim()}>
        <div className="p-8 text-center">
          <div className="inline-block rounded-2xl border border-dashed border-gray-200 bg-slate-50 px-6 py-8 text-sm text-gray-500">
            {emptyMessage}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${emptyClassName}`.trim()}>
      <div
        ref={topScrollRef}
        className={`admin-table-top-scrollbar custom-scrollbar ${showTopScrollbar ? '' : 'hidden'}`.trim()}
      >
        <div style={{ width: '1px', height: '1px' }} />
      </div>

      <div ref={tableWrapperRef} className="w-full min-w-0 overflow-auto admin-scroll-wrapper custom-scrollbar">
        <table ref={tableRef} className="w-full min-w-max table-auto border-collapse">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((c, index) => {
                const accessorKey = c.accessor;
                const isSorted = sortConfig.key === accessorKey;
                const isColumnSortable = sortable && !!accessorKey && accessorKey !== 'acciones';

                return (
                  <th
                    key={accessorKey || c.header || index}
                    onClick={() => isColumnSortable && handleSort(accessorKey)}
                    className={`px-3 py-3 text-left text-[13px] font-semibold text-gray-400 uppercase tracking-tight whitespace-nowrap sm:px-6 sm:py-4 select-none ${
                      isColumnSortable ? 'cursor-pointer hover:bg-gray-100/70 hover:text-gray-600 transition-colors' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{c.header}</span>
                      {isColumnSortable && (
                        <span className={`text-[10px] transition-colors ${isSorted ? 'text-indigo-600 font-bold' : 'text-gray-300'}`}>
                          {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {processedData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/30 transition-all duration-200">
                {columns.map((c, colIndex) => (
                  <td
                    key={c.accessor || c.header || colIndex}
                    className={`min-w-0 px-3 py-3 text-sm text-gray-600 align-top sm:px-5 sm:py-3.5 ${c.cellClassName || ''}`}
                  >
                    <div className={c.contentClassName || defaultContentClassName}>
                      {c.render ? c.render(row) : (row[c.accessor] !== undefined && row[c.accessor] !== null ? row[c.accessor] : '-')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;