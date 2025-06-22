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
  ResponsiveContainer
} from 'recharts';

// --- Единая цветовая палитра ---
const COLORS = {
  accent: '#3b82f6',
  grid: '#e5e7eb',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
};

// --- Кастомный тултип ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const allCompanies = dataPoint.companies || [];
    
    const MAX_COMPANIES_TO_SHOW = 10;
    const visibleCompanies = allCompanies.slice(0, MAX_COMPANIES_TO_SHOW);
    const hiddenCount = allCompanies.length - visibleCompanies.length;

    return (
      <div className="p-3 bg-white/95 backdrop-blur-sm border rounded-lg shadow-xl w-64" style={{ borderColor: COLORS.tooltipBorder }}>
        <p className="font-bold text-sm text-gray-800 mb-1">{label}</p>
        <p className="text-xs font-semibold mb-2" style={{ color: COLORS.accent }}>{`Всего вакансий: ${payload[0].value}`}</p>

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

// --- Интерфейсы ---
interface CompanyWithCount {
  name: string;
  count: number;
}
interface ChartDataPoint {
  count: number;
  companies: CompanyWithCount[];
}

// --- ИЗМЕНЕНИЕ 1: Добавляем новое необязательное свойство в Props ---
interface Props {
  days: Record<string, ChartDataPoint>;
  hours: Record<string, ChartDataPoint>;
  weekFull: string[];
  weekShort: string[];
  timeZoneDisplay?: string | null; // <-- НОВОЕ СВОЙСТВО
}

// --- ИЗМЕНЕНИЕ 2: Принимаем новое свойство в компоненте ---
export default function Charts({ days, hours, weekFull, weekShort, timeZoneDisplay }: Props) {
  
  // --- Подготовка данных ---
  const dayData = useMemo(() => {
    return weekShort.map((short, i) => {
      const dayKey = weekFull[i];
      const data = days[dayKey] || { count: 0, companies: [] };
      return {
        name: short,
        "Вакансии": data.count,
        companies: data.companies
      };
    });
  }, [days, weekFull, weekShort]);

  const hourData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const h = String(i).padStart(2, '0');
      const data = hours[h] || { count: 0, companies: [] };
      return {
        name: `${h}:00`,
        "Вакансии": data.count,
        companies: data.companies
      };
    });
  }, [hours]);

  // --- Вспомогательные рендер-функции ---
  const renderYAxis = <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} width={30} />;
  const renderXAxis = (dataKey: string) => <XAxis dataKey={dataKey} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />;
  const renderGrid = <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Блок с графиком по дням недели (без изменений) */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Активность по дням недели</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dayData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            {renderGrid}
            {renderXAxis("name")}
            {renderYAxis}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.15)' }} />
            <Bar 
              dataKey="Вакансии" 
              fill={COLORS.accent} 
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* --- ИЗМЕНЕНИЕ 3: Модифицируем заголовок блока с графиком по часам --- */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Активность по часам</h3>
            {timeZoneDisplay && (
                <span className="text-sm font-medium text-blue-600 bg-blue-100 rounded-full px-3 py-1">
                    {timeZoneDisplay}
                </span>
            )}
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={hourData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            {renderGrid}
            {renderXAxis("name")}
            {renderYAxis}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.grid, strokeWidth: 2 }} />
            <Line type="monotone" dataKey="Вакансии" stroke={COLORS.accent} strokeWidth={2.5} dot={false} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: COLORS.accent }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}