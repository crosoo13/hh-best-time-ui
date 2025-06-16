import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// --- Единая цветовая палитра ---
const COLORS = {
  accent: '#3b82f6',      // синий (blue-500)
  grid: '#e5e7eb',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
};

// --- Кастомный тултип для recharts (можно сделать общим!) ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white/95 backdrop-blur-sm border rounded-md shadow-lg" style={{ borderColor: COLORS.tooltipBorder }}>
        <p className="font-bold text-sm text-gray-700">{`${label}`}</p>
        <p className="text-xs text-blue-600">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

interface Props {
  days: Record<string, number>;
  hours: Record<string, number>;
  weekFull: string[];
  weekShort: string[];
}

export default function Charts({ days, hours, weekFull, weekShort }: Props) {
  // --- Подготовка данных (логика остается той же) ---
  const dayData = useMemo(() => {
    return weekShort.map((short, i) => ({
      name: short,
      "Вакансии": days[weekFull[i]] || 0,
    }));
  }, [days, weekFull, weekShort]);

  const hourData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const h = String(i).padStart(2, '0');
      return {
        name: `${h}:00`,
        "Вакансии": hours[h] || 0,
      };
    });
  }, [hours]);

  // --- Базовые компоненты осей для переиспользования ---
  const renderYAxis = <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />;
  const renderXAxis = (dataKey: string) => <XAxis dataKey={dataKey} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />;
  const renderGrid = <CartesianGrid strokeDasharray="5 5" stroke={COLORS.grid} vertical={false} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* --- График по дням недели (BarChart) --- */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Активность по дням недели</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dayData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            {renderGrid}
            {renderXAxis("name")}
            {renderYAxis}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} />
            <Bar dataKey="Вакансии" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* --- График по часам (LineChart) --- */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Активность по часам</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={hourData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            {renderGrid}
            {renderXAxis("name")}
            {renderYAxis}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.grid }} />
            <Line type="monotone" dataKey="Вакансии" stroke={COLORS.accent} strokeWidth={2} dot={false} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}