import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// --- Единая цветовая палитра ---
const COLORS = {
  accent: '#22c55e', // Зеленый для прогноза
  grid: '#e5e7eb',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
};

// --- Интерфейсы, как и в других компонентах ---
interface CompanyWithCount {
  name: string;
  count: number;
}
interface ChartDetailData {
  count: number;
  companies: CompanyWithCount[];
}

// --- Кастомный тултип, адаптированный для прогноза ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const allCompanies = dataPoint.companies || [];
    
    const MAX_COMPANIES_TO_SHOW = 10;
    const visibleCompanies = allCompanies.slice(0, MAX_COMPANIES_TO_SHOW);
    const hiddenCount = allCompanies.length - visibleCompanies.length;

    return (
      <div className="p-3 bg-white/95 backdrop-blur-sm border rounded-lg shadow-xl w-64" style={{ borderColor: COLORS.tooltipBorder }}>
        <p className="font-bold text-sm text-gray-800 mb-1">{`Дата: ${dataPoint.fullDate}`}</p>
        <p className="text-xs font-semibold mb-2" style={{ color: COLORS.accent }}>{`Прогноз подъёмов: ${payload[0].value}`}</p>

        {allCompanies.length > 0 && (
          <>
            <div className="border-t -mx-3 my-2" style={{ borderColor: COLORS.grid }}></div>
            <p className="font-semibold text-xs text-gray-700 mb-2">Компании:</p>
            <ul className="space-y-1.5 text-xs text-gray-600">
              {visibleCompanies.map((company: CompanyWithCount) => (
                <li key={company.name} className="flex justify-between items-center">
                  <span className="truncate pr-2">{company.name}</span>
                  <span className="font-semibold text-gray-800 flex-shrink-0">{company.count}</span>
                </li>
              ))}
              {hiddenCount > 0 && (
                <li className="text-center text-gray-500 pt-1">...и еще {hiddenCount}</li>
              )}
            </ul>
          </>
        )}
      </div>
    );
  }
  return null;
};


interface Props {
  bumpDates: Record<string, ChartDetailData>;
}

export default function BumpChart({ bumpDates }: Props) {
  // --- Подготовка данных для recharts ---
  const chartData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      // ИСПРАВЛЕНИЕ: Устанавливаем время на полночь по UTC, а не по локальному времени.
      // Это решает проблему со смещением даты из-за часовых поясов.
      d.setUTCHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    return days.map(date => {
      const [yyyy, mm, dd] = date.split('-');
      const dayData = bumpDates[date] || { count: 0, companies: [] };
      return {
        name: `${dd}.${mm}`,           // Формат ДД.ММ для оси X
        "Подъёмы": dayData.count,      // Значение для бара
        companies: dayData.companies,  // Данные для тултипа
        fullDate: date,                // Полная дата для тултипа
      };
    });
  }, [bumpDates]);

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">Прогноз автоподнятий на 30 дней</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            interval={1} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 11 }} 
            allowDecimals={false} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }} />
          <Bar 
            dataKey="Подъёмы" 
            // ИЗМЕНЕНИЕ: Добавлена прозрачность к цвету заливки
            fill={`${COLORS.accent}B3`} 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}