import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const sample = [
  { name: '1', visits: 120 },
  { name: '2', visits: 200 },
  { name: '3', visits: 150 },
  { name: '4', visits: 300 },
  { name: '5', visits: 250 },
  { name: '6', visits: 320 },
  { name: '7', visits: 280 },
];

const ChartArea = ({ data = sample }) => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={{ fill: 'var(--text)' }} />
        <YAxis tick={{ fill: 'var(--text)' }} />
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <Tooltip />
        <Area type="monotone" dataKey="visits" stroke="#7c3aed" fillOpacity={1} fill="url(#colorUv)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ChartArea;
