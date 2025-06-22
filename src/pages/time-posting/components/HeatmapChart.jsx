import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Scatter,
  Cell,
} from 'recharts';

// Палитра и константы (без изменений)
const COLORS = {
  peak: '#16a34a',
  veryHigh: '#22c55e',
  high: '#4ade80',
  medium: '#86efac',
  low: '#bbf7d0',
  veryLow: '#dcfce7',
  grid: '#e5e7eb',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
};
const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

// --- ИЗМЕНЕНИЕ 1: Обновленный тултип для вывода двух видов процентов ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    if (!dataPoint || dataPoint.value === 0) return null;

    const dayName = weekDays[dataPoint.x];
    const dailyPercentage = dataPoint.dailyPercentage;
    const weeklyPercentage = dataPoint.weeklyPercentage;

    return (
      <div className="p-3 bg-white/95 backdrop-blur-sm border rounded-lg shadow-xl" style={{ borderColor: COLORS.tooltipBorder }}>
        <p className="font-bold text-sm text-gray-800 mb-1">
          {`${dayName}, ${String(dataPoint.y).padStart(2, '0')}:00`}
        </p>
        <p className="text-xs font-semibold" style={{ color: COLORS.peak }}>
          {`Доля за день: ${dailyPercentage.toFixed(2)}%`}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {/* Заменили абсолютную активность на долю за неделю */}
          {`Доля за неделю: ${weeklyPercentage.toFixed(4)}%`}
        </p>
      </div>
    );
  }
  return null;
};


export default function HeatmapChart({ data: rawData, timeZoneDisplay }) {

  // --- ИЗМЕНЕНИЕ 2: Обновленная логика вычислений в useMemo ---
  const { chartData, maxValue } = useMemo(() => {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return { chartData: [], maxValue: 0 };
    }

    // Шаг 1: Считаем сумму для каждого дня
    const dailyTotals = rawData.reduce((acc, item) => {
      acc[item.dayweek] = (acc[item.dayweek] || 0) + item.cnt;
      return acc;
    }, {});

    // Шаг 2: Считаем общую сумму за всю неделю
    const weeklyTotal = Object.values(dailyTotals).reduce((sum, current) => sum + current, 0);

    let maxFoundValue = 0;

    // Шаг 3: Трансформируем данные, добавляя оба вида процентов
    const transformedData = rawData.map(item => {
      const dayTotal = dailyTotals[item.dayweek];
      
      const dailyPercentage = dayTotal > 0 ? (item.cnt / dayTotal) * 100 : 0;
      const weeklyPercentage = weeklyTotal > 0 ? (item.cnt / weeklyTotal) * 100 : 0;

      // --- ИЗМЕНЕНИЕ 3: Возвращаем исходную формулу для индекса дня ---
      const dayIndex = (item.dayweek + 5) % 7;

      if (item.cnt > maxFoundValue) {
        maxFoundValue = item.cnt;
      }

      return {
        x: dayIndex,
        y: item.activehour,
        value: item.cnt,
        dailyPercentage: dailyPercentage,
        weeklyPercentage: weeklyPercentage,
      };
    });

    return { chartData: transformedData, maxValue: maxFoundValue };
  }, [rawData]);

  // Функция определения цвета (без изменений)
  const getColor = (value) => {
    if (!value || value === 0 || maxValue === 0) return 'rgba(241, 245, 249, 0.5)';
    const percentage = value / maxValue;
    if (percentage > 0.85) return COLORS.peak;
    if (percentage > 0.70) return COLORS.veryHigh;
    if (percentage > 0.50) return COLORS.high;
    if (percentage > 0.30) return COLORS.medium;
    if (percentage > 0.10) return COLORS.low;
    return COLORS.veryLow;
  };

  // Остальная часть JSX остается без изменений
  return (
    <div className="bg-white rounded-lg border shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Тепловая карта активности соискателей</h3>
            {timeZoneDisplay && (
                <span className="text-sm font-medium text-blue-600 bg-blue-100 rounded-full px-3 py-1">
                    {timeZoneDisplay}
                </span>
            )}
        </div>
        
        <div className="p-4" style={{ height: '600px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[-0.5, 6.5]}
                  ticks={[0, 1, 2, 3, 4, 5, 6]}
                  tickFormatter={(index) => weekDays[index]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  reversed
                  domain={[-1, 24]}
                  ticks={Array.from({ length: 13 }, (_, i) => i * 2)}
                  tickFormatter={(hour) => `${String(hour).padStart(2, '0')}:00`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <ZAxis dataKey="value" range={[400, 400]} />
                <Tooltip content={<CustomTooltip />} cursor={false} isAnimationActive={false} />
                <Scatter data={chartData} shape="square" isAnimationActive={false}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}