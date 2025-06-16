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

// --- Единая цветовая палитра, как в других графиках ---
const COLORS = {
  accent: '#3b82f6',      // синий (blue-500)
  grid: '#e5e7eb',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
};

// --- Кастомный тултип (можно вынести в общий файл) ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white/95 backdrop-blur-sm border rounded-md shadow-lg" style={{ borderColor: COLORS.tooltipBorder }}>
        <p className="font-bold text-sm text-gray-700">{`Дата: ${label}`}</p>
        <p className="text-xs text-blue-600">{`Прогноз: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

interface Props {
  bumpDates: Record<string, number>;
}

export default function BumpChart({ bumpDates }: Props) {
  // --- Подготовка данных для recharts ---
  const chartData = useMemo(() => {
    // 1. Создаём массив дат на 30 дней вперед
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10); // YYYY-MM-DD
    });

    // 2. Формируем данные в формате, который понимает recharts
    return days.map(date => {
      const [yyyy, mm, dd] = date.split('-');
      return {
        name: `${dd}.${mm}`, // Формат ДД.ММ для оси X
        "Подъёмы": bumpDates[date] || 0, // Значение для бара
      };
    });
  }, [bumpDates]);

  return (
    // 3. Применяем единый стиль контейнера
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      {/* 4. Используем новый заголовок */}
      <h3 className="font-semibold text-gray-800 mb-4">Прогноз Автопродление на следующие 30 дней</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="5 5" stroke={COLORS.grid} vertical={false} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            // Показываем каждый второй лейбл, чтобы не было "каши"
            interval={1} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 11 }} 
            allowDecimals={false} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} />
          <Bar dataKey="Подъёмы" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}