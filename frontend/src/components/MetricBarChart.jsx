import React from 'react';

const DEFAULT_COLORS = ['#4f46e5', '#059669', '#dc2626'];

const formatShort = (value) => {
  const number = Number(value) || 0;
  if (Math.abs(number) >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (Math.abs(number) >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return `${number}`;
};

function MetricBarChart({ data = [], labelKey = 'label', series = [], height = 260, formatValue = formatShort }) {
  const width = 920;
  const padding = { top: 24, right: 24, bottom: 58, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const normalizedSeries = series.map((item, index) => ({
    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    ...item,
  }));

  const values = data.flatMap((item) => normalizedSeries.map((serie) => Number(item[serie.key]) || 0));
  const maxValue = Math.max(1, ...values, 0);
  const minValue = Math.min(0, ...values);
  const range = maxValue - minValue || 1;
  const zeroY = padding.top + ((maxValue - 0) / range) * chartHeight;
  const groupWidth = data.length ? chartWidth / data.length : chartWidth;
  const gap = Math.max(8, groupWidth * 0.18);
  const barWidth = data.length
    ? Math.max(6, (groupWidth - gap) / Math.max(normalizedSeries.length, 1) - 3)
    : 12;

  const yForValue = (value) => padding.top + ((maxValue - value) / range) * chartHeight;

  if (!data.length || !normalizedSeries.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-slate-50 text-sm font-semibold text-gray-400">
        Sin datos para graficar.
      </div>
    );
  }

  const gridLines = Array.from({ length: 4 }, (_, index) => {
    const value = minValue + (range / 3) * index;
    return {
      value,
      y: yForValue(value),
    };
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg className="min-w-[760px] overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img">
        <rect x="0" y="0" width={width} height={height} rx="18" fill="transparent" />

        {gridLines.map((line) => (
          <g key={line.value}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={line.y}
              y2={line.y}
              stroke="var(--border)"
              strokeDasharray="4 6"
            />
            <text x={padding.left - 10} y={line.y + 4} textAnchor="end" className="fill-current text-[11px] text-gray-400">
              {formatValue(line.value)}
            </text>
          </g>
        ))}

        <line x1={padding.left} x2={width - padding.right} y1={zeroY} y2={zeroY} stroke="var(--border-strong)" />

        {data.map((item, index) => {
          const groupX = padding.left + index * groupWidth + gap / 2;
          return (
            <g key={`${item[labelKey]}-${index}`}>
              {normalizedSeries.map((serie, serieIndex) => {
                const value = Number(item[serie.key]) || 0;
                const valueY = yForValue(value);
                const y = Math.min(valueY, zeroY);
                const rectHeight = Math.max(2, Math.abs(zeroY - valueY));
                const x = groupX + serieIndex * (barWidth + 3);

                return (
                  <rect
                    key={serie.key}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={rectHeight}
                    rx="5"
                    fill={serie.color}
                    opacity="0.92"
                  >
                    <title>{`${serie.label}: ${formatValue(value)}`}</title>
                  </rect>
                );
              })}
              <text
                x={groupX + (normalizedSeries.length * (barWidth + 3)) / 2 - 2}
                y={height - 24}
                textAnchor="middle"
                className="fill-current text-[11px] font-semibold text-gray-500"
              >
                {String(item[labelKey] || '').slice(0, 8)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap gap-3">
        {normalizedSeries.map((serie) => (
          <span key={serie.key} className="inline-flex items-center gap-2 text-xs font-bold text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: serie.color }} />
            {serie.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default MetricBarChart;
