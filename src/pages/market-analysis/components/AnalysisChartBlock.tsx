// src/pages/market-analysis/components/AnalysisChartBlock.tsx

import CompaniesRateChart from './CompaniesRateChart';

interface ChartDataPoint {
  name: string;
  value: number;
}

interface Props {
  title: string;
  chartData: ChartDataPoint[];
  averageValue: number;
  lineColor: string;
  dataLabel: string;
  unit: string;
  children?: React.ReactNode;
  // --- ДОБАВЛЯЕМ НОВЫЙ ПРОПС ---
  filterRange: [number, number]; 
}

export default function AnalysisChartBlock({ title, chartData, averageValue, lineColor, dataLabel, unit, children, filterRange }: Props) {
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {children && <div className="mb-4">{children}</div>}
      </div>

      <CompaniesRateChart
        data={chartData}
        averageValue={averageValue}
        lineColor={lineColor}
        dataLabel={dataLabel}
        unit={unit}
        // --- ПРОБРАСЫВАЕМ ПРОПС ДАЛЬШЕ ---
        filterRange={filterRange}
      />
    </div>
  );
}