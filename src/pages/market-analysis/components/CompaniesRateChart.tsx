// src/pages/market-analysis/components/CompaniesRateChart.tsx

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import type { CompanyStat } from '../model/types';
import { formatNumber } from '@/shared/lib/formatters';

// --- Интерфейсы ---
interface ClusterPoint {
  name: string;
  value: number;
  companies: CompanyStat[];
}
interface Props {
  data: ClusterPoint[];
  averageValue?: number;
  lineColor?: string;
  dataLabel: string;
  unit: string;
  filterRange: [number, number];
}

const CustomizedDot = (props: any) => {
  const { cx, cy, payload, filterRange, lineColor, FADED_COLOR } = props;
  if (!payload || !payload.companies) return null;
  
  const count = payload.companies.length;
  const radius = Math.min(32, 3 + count * 1.5); 
  const isActive = payload.value >= filterRange[0] && payload.value <= filterRange[1];
  const currentFill = isActive ? lineColor : FADED_COLOR;

  if (count > 0) {
    return (<circle cx={cx} cy={cy} r={radius} stroke="#fff" strokeWidth={1.5} fill={currentFill} />);
  }
  return null;
};

const CustomTooltip = ({ active, payload, dataLabel, unit }: any) => {
    if (active && payload && payload.length) {
      const cluster: ClusterPoint = payload[0].payload;
      const key = dataLabel === 'Ставка' ? 'avg_hourly_rate' : 'avg_monthly_salary';
      const MAX_COMPANIES_TO_SHOW = 9;
      const visibleCompanies = cluster.companies.slice(0, MAX_COMPANIES_TO_SHOW);
      const hiddenCount = cluster.companies.length - visibleCompanies.length;
      return (
        <div className="p-3 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg shadow-xl max-w-xs">
          <p className="font-bold text-gray-800 mb-2">{`~ ${cluster.value.toFixed(0)} ${unit} (${cluster.companies.length} комп.)`}</p>
          <ul className="text-xs text-gray-600 space-y-1 pr-2">
            {visibleCompanies.map(c => (
              <li key={c.company_name} className="flex justify-between items-center space-x-2">
                <span className="truncate">{c.company_name}</span>
                <span className="font-semibold text-gray-800 whitespace-nowrap">{`${formatNumber(c[key] as number, key === 'avg_hourly_rate' ? 2 : 0)} ${unit}`}</span>
              </li>
            ))}
            {hiddenCount > 0 && (<li className="text-center text-gray-500 pt-1">...и еще {hiddenCount}</li>)}
          </ul>
        </div>
      );
    }
    return null;
  };

export default function CompaniesRateChart({ data, averageValue, lineColor = "#60a5fa", dataLabel, unit, filterRange }: Props) {
  if (!data || data.length < 2) {
    return <div className="p-4 text-center text-gray-500">Недостаточно данных для построения графика.</div>;
  }
  
  const FADED_COLOR = '#d1d5db';
  const GRADIENT_ID = `fill-gradient-${lineColor.replace('#', '')}`;

  const allValues = data.map(p => p.value);
  const minChartValue = Math.min(...allValues);
  const maxChartValue = Math.max(...allValues);
  const chartRange = maxChartValue - minChartValue;

  const getPercent = (value: number) => {
    if (chartRange === 0) return 0;
    return ((value - minChartValue) / chartRange) * 100;
  };
  
  // Для градиента нам нужно направление слева направо, поэтому используем x2="1"
  const gradientDirection = { x1: "0", y1: "0", x2: "1", y2: "0" };
  const startPercent = Math.max(0, getPercent(filterRange[0]));
  const endPercent = Math.min(100, getPercent(filterRange[1]));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart 
        data={data}
        margin={{ top: 10, right: 30, left: 15, bottom: 5 }}
      >
        <defs>
          <linearGradient id={GRADIENT_ID} {...gradientDirection}>
            <stop offset={`${startPercent}%`} stopColor={FADED_COLOR} stopOpacity={0.4} />
            <stop offset={`${startPercent}%`} stopColor={lineColor} stopOpacity={0.4} />
            <stop offset={`${endPercent}%`} stopColor={lineColor} stopOpacity={0.4} />
            <stop offset={`${endPercent}%`} stopColor={FADED_COLOR} stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="5 5" stroke="#e5e7eb" vertical={false} />

        {/* --- ГЛАВНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ --- */}
        <XAxis 
            // 1. Ось теперь строится по числовому ЗНАЧЕНИЮ, а не по имени категории
            dataKey="value" 
            // 2. Явно указываем, что ось числовая
            type="number"
            // 3. Задаем границы оси, чтобы они не "прыгали"
            domain={[minChartValue, maxChartValue]}
            tick={false} 
            axisLine={false} 
            tickLine={false}
        />
        <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(value) => `${value}`}
            allowDecimals={false}
        />
        
        <Tooltip 
            cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: '3 3' }} 
            content={<CustomTooltip dataLabel={dataLabel} unit={unit} />}
        />
        
        <Area 
            type="monotone" 
            dataKey="value"
            stroke={lineColor} 
            strokeWidth={2} 
            fill={`url(#${GRADIENT_ID})`}
            activeDot={{ r: 8, stroke: 'white', strokeWidth: 2, fill: 'currentColor' }}
            dot={<CustomizedDot lineColor={lineColor} FADED_COLOR={FADED_COLOR} filterRange={filterRange} />}
            animationDuration={300}
        />
        
        {averageValue && averageValue > 0 && (
          <ReferenceLine y={averageValue} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5}>
            <Label value={`Среднее: ${averageValue.toFixed(0)} ${unit}`} position="insideTopRight" fill="#ef4444" fontSize={12} />
          </ReferenceLine>
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}