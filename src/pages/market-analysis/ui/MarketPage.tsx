import { useState, useEffect, FormEvent } from 'react';
import { useAnalysisRequest } from '../hooks/useAnalysisRequest';
import { useMarketAnalysis } from '../hooks/useMarketAnalysis';
import { useLoadingPhrases } from '../hooks/useLoadingPhrases';

import AnalysisForm from '../components/AnalysisForm';
import AnalysisChartBlock from '../components/AnalysisChartBlock';
import ResultCard from '../components/ResultCard';
import FilterSlider from '../components/FilterSlider';
import CompanyDetailPanel from '@/shared/ui/CompanyDetailPanel'; // <-- Используем общий компонент

import type { Result } from '../model/types';

export default function MarketPage() {
  const [profession, setProfession] = useState('');
  const [location, setLocation] = useState('');
  const { loading, error, data, start, setError } = useAnalysisRequest();
  const loadingText = useLoadingPhrases(loading);

  const [activePanelData, setActivePanelData] = useState<Result | null>(null);
  const [chartMode, setChartMode] = useState<'fullDay' | 'rotation'>('fullDay');
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);

  // ... (остальные состояния и useEffect без изменений)
  const [fullDayRateRange, setFullDayRateRange] = useState<[number, number]>([0, 1]);
  const [rotationRateRange, setRotationRateRange] = useState<[number, number]>([0, 1]);
  const [fullDaySalaryRange, setFullDaySalaryRange] = useState<[number, number]>([0, 1]);
  const [rotationSalaryRange, setRotationSalaryRange] = useState<[number, number]>([0, 1]);
  const [fullDayMinRate, setFullDayMinRate] = useState(0);
  const [rotationMinRate, setRotationMinRate] = useState(0);
  const [fullDayMinSalary, setFullDayMinSalary] = useState(0);
  const [rotationMinSalary, setRotationMinSalary] = useState(0);
  const [fullDayMaxRate, setFullDayMaxRate] = useState(1);
  const [rotationMaxRate, setRotationMaxRate] = useState(1);
  const [fullDayMaxSalary, setFullDayMaxSalary] = useState(1);
  const [rotationMaxSalary, setRotationMaxSalary] = useState(1);

  useEffect(() => {
    if (!data?.results) return;
    const calculateRanges = (
      src: Result | undefined,
      excluded: string[],
      setMin: (n: number) => void,
      setMax: (n: number) => void,
      setRange: (r: [number, number]) => void,
      key: 'avg_hourly_rate' | 'avg_monthly_salary'
    ) => {
      const values =
        src?.companies
          .filter(c => !excluded.includes(c.company_name))
          .map(c => c[key])
          .filter(v => typeof v === 'number' && v > 0) || [];
      if (values.length === 0) {
        setMin(0);
        setMax(1);
        setRange([0, 1]);
        return;
      }
      const minV = Math.floor(Math.min(...values));
      const maxV = Math.ceil(Math.max(...values));
      setMin(minV);
      setMax(maxV || 1);
      setRange([minV, maxV]);
    };

    const fullDaySrc = data.results.find(r => r.mode === 'fullDay');
    const rotationSrc = data.results.find(r => r.mode === 'rotation');

    calculateRanges(fullDaySrc, excludedCompanies, setFullDayMinRate, setFullDayMaxRate, setFullDayRateRange, 'avg_hourly_rate');
    calculateRanges(rotationSrc, excludedCompanies, setRotationMinRate, setRotationMaxRate, setRotationRateRange, 'avg_hourly_rate');
    calculateRanges(fullDaySrc, excludedCompanies, setFullDayMinSalary, setFullDayMaxSalary, setFullDaySalaryRange, 'avg_monthly_salary');
    calculateRanges(rotationSrc, excludedCompanies, setRotationMinSalary, setRotationMaxSalary, setRotationSalaryRange, 'avg_monthly_salary');
  }, [data, excludedCompanies]);

  const toggleCompanyExclusion = (name: string) => {
    setExcludedCompanies(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setExcludedCompanies([]);
    setActivePanelData(null);
    setError(null);
    start(profession, location);
  };

  useEffect(() => {
    document.body.style.overflow = activePanelData ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [activePanelData]);

  const fullDayData = data?.results.find(r => r.mode === 'fullDay');
  const rotationData = data?.results.find(r => r.mode === 'rotation');

  const processedFull = useMarketAnalysis(fullDayData, excludedCompanies, fullDayRateRange, fullDaySalaryRange);
  const processedRot = useMarketAnalysis(rotationData, excludedCompanies, rotationRateRange, rotationSalaryRange);
  const chartData = chartMode === 'fullDay' ? processedFull : processedRot;

  const RATE_COLOR = '#60a5fa';
  const SALARY_COLOR = '#4ade80';

  return (
    <>
      <div className="container mx-auto p-4 space-y-8">
        <AnalysisForm
          profession={profession}
          location={location}
          loading={loading}
          onProfessionChange={setProfession}
          onLocationChange={setLocation}
          onSubmit={handleSubmit}
        />
        {/* ... (остальной JSX без изменений) ... */}
        {error && <div className="text-center p-4 text-red-600 bg-red-100 rounded-lg">{error}</div>}
        {loading && (
          <div className="flex items-center justify-center py-8 space-x-4">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-lg text-gray-600 font-medium">{loadingText}</span>
          </div>
        )}
        {data && !loading && (
          <>
            <div className="grid lg:grid-cols-2 gap-8">
              <ResultCard result={processedFull.resultForCard} onShowDetails={() => setActivePanelData(fullDayData || null)} />
              <ResultCard result={processedRot.resultForCard} onShowDetails={() => setActivePanelData(rotationData || null)} />
            </div>
            <div className="space-y-8 mt-8">
              <div className="border rounded-lg bg-white shadow-sm">
                <AnalysisChartBlock
                  title="Распределение средних ставок"
                  chartData={chartData.rateChartData}
                  averageValue={chartData.averageRate}
                  lineColor={RATE_COLOR}
                  dataLabel="Ставка"
                  unit="руб/час"
                  filterRange={chartMode === 'fullDay' ? fullDayRateRange : rotationRateRange}
                >
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setChartMode('fullDay')} className={`px-4 py-2 rounded-md text-sm font-medium ${chartMode === 'fullDay' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Полный день</button>
                    <button onClick={() => setChartMode('rotation')} className={`px-4 py-2 rounded-md text-sm font-medium ${chartMode === 'rotation' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Вахтовый метод</button>
                  </div>
                </AnalysisChartBlock>
                {chartMode === 'fullDay' ? (
                  <FilterSlider title="Фильтр по ставке" unit="₽/час" range={fullDayRateRange} min={fullDayMinRate} max={fullDayMaxRate} onChange={setFullDayRateRange} color={RATE_COLOR} />
                ) : (
                  <FilterSlider title="Фильтр по ставке" unit="₽/час" range={rotationRateRange} min={rotationMinRate} max={rotationMaxRate} onChange={setRotationRateRange} color={RATE_COLOR} />
                )}
              </div>
              <div className="border rounded-lg bg-white shadow-sm">
                <AnalysisChartBlock
                  title="Распределение средних зарплат"
                  chartData={chartData.salaryChartData}
                  averageValue={chartData.averageSalary}
                  lineColor={SALARY_COLOR}
                  dataLabel="Зарплата"
                  unit="руб/мес"
                  filterRange={chartMode === 'fullDay' ? fullDaySalaryRange : rotationSalaryRange}
                />
                {chartMode === 'fullDay' ? (
                  <FilterSlider title="Фильтр по зарплате" unit="₽/мес" range={fullDaySalaryRange} min={fullDayMinSalary} max={fullDayMaxSalary} onChange={setFullDaySalaryRange} color={SALARY_COLOR} />
                ) : (
                  <FilterSlider title="Фильтр по зарплате" unit="₽/мес" range={rotationSalaryRange} min={rotationMinSalary} max={rotationMaxSalary} onChange={setRotationSalaryRange} color={SALARY_COLOR} />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- ИЗМЕНЕНИЕ ЗДЕСЬ --- */}
      {activePanelData && (
        <CompanyDetailPanel
          data={activePanelData}
          title={`Компании (${activePanelData.mode === 'rotation' ? 'Вахта' : 'Полный день'})`}
          onClose={() => setActivePanelData(null)}
          excludedCompanies={excludedCompanies}
          onToggleExclusion={toggleCompanyExclusion}
        />
      )}
    </>
  );
}