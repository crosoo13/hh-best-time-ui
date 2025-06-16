import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import CompanyDetailPanel from '@/shared/ui/CompanyDetailPanel';
import type { ApiResponse, Result } from '../model/types';
import AnalysisChartBlock from '../components/AnalysisChartBlock';
import ResultCard from '../components/ResultCard';
import FilterSlider from '../components/FilterSlider';
import { useMarketAnalysis } from '../hooks/useMarketAnalysis';
import AnalysisForm from '../components/AnalysisForm';
import { useLoadingPhrases } from '../hooks/useLoadingPhrases';

const API_BASE_URL = 'https://api.hrvision.ru';

export default function MarketPage() {
  const [profession, setProfession] = useState('');
  const [location, setLocation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const loadingText = useLoadingPhrases(loading);

  const [activePanelData, setActivePanelData] = useState<Result | null>(null);
  const [chartMode, setChartMode] = useState<'fullDay' | 'rotation'>('fullDay');
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);
  
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
    if (data?.results) {
      const fullDaySrc = data.results.find(r => r.mode === 'fullDay');
      const rotationSrc = data.results.find(r => r.mode === 'rotation');
      
      const setupRanges = (source: Result | undefined, setMin: Function, setMax: Function, setRange: Function, key: 'avg_hourly_rate' | 'avg_monthly_salary') => {
        const values = source?.companies?.map(c => c[key]).filter(v => typeof v === 'number' && v > 0) || [];
        if (values.length > 0) {
          const minVal = Math.floor(Math.min(...values));
          const maxVal = Math.ceil(Math.max(...values));
          setMin(minVal);
          setMax(maxVal > 0 ? maxVal : 1);
          setRange([minVal, maxVal]);
        }
      };

      setupRanges(fullDaySrc, setFullDayMinRate, setFullDayMaxRate, setFullDayRateRange, 'avg_hourly_rate');
      setupRanges(rotationSrc, setRotationMinRate, setRotationMaxRate, setRotationRateRange, 'avg_hourly_rate');
      setupRanges(fullDaySrc, setFullDayMinSalary, setFullDayMaxSalary, setFullDaySalaryRange, 'avg_monthly_salary');
      setupRanges(rotationSrc, setRotationMinSalary, setRotationMaxSalary, setRotationSalaryRange, 'avg_monthly_salary');
    }
  }, [data]);

  const toggleCompanyExclusion = (companyName: string) => {
    setExcludedCompanies(prev => prev.includes(companyName) ? prev.filter(name => name !== companyName) : [...prev, companyName]);
  };

  const pollForResult = (jobId: string) => {
    const RESULT_URL = `${API_BASE_URL}/hh/result/${jobId}`;
    const POLLING_INTERVAL = 5000;
    const MAX_ATTEMPTS = 60;

    let attempts = 0;

    const intervalId = setInterval(async () => {
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
        setError("Не удалось получить результат вовремя. Попробуйте снова.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(RESULT_URL);
        if (!response.ok) {
          throw new Error('Ошибка при получении результата.');
        }

        const resultData: ApiResponse = await response.json();
        
        if (resultData && resultData.results.length > 0) {
          clearInterval(intervalId);
          setData(resultData);
          setLoading(false);
        } else {
          attempts++;
        }
      } catch (e: any) {
        clearInterval(intervalId);
        setError(e.message);
        setLoading(false);
      }
    }, POLLING_INTERVAL);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profession || !location) {
      setError("Пожалуйста, заполните оба поля: Профессия и Регион.");
      return;
    }

    setExcludedCompanies([]);
    setLoading(true);
    setError(null);
    setData(null);
    setActivePanelData(null);
    
    const API_URL = `${API_BASE_URL}/hh/analyze`;
    const requestBody = [
      { name: profession, schedule: 'fullDay', locations: [location] },
      { name: profession, schedule: 'rotation', locations: [location] }
    ];

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ошибка сети: ${response.statusText}`);
      }

      const { job_id } = await response.json();
      if (job_id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: logError } = await supabase
            .from('analysis_requests')
            .insert({ 
              user_id: user.id, 
              query_details: { profession, location } 
            });

          if (logError) {
            console.error('Ошибка логирования запроса в Supabase:', logError.message);
          }
        }
        
        pollForResult(job_id);
      } else {
        throw new Error("Не удалось получить ID задачи от сервера.");
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activePanelData) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = 'auto'; }
    return () => { document.body.style.overflow = 'auto'; };
  }, [activePanelData]);

  const fullDayData = data?.results.find(r => r.mode === 'fullDay');
  const rotationData = data?.results.find(r => r.mode === 'rotation');
  
  const processedFullDayData = useMarketAnalysis(fullDayData, excludedCompanies, fullDayRateRange, fullDaySalaryRange);
  const processedRotationData = useMarketAnalysis(rotationData, excludedCompanies, rotationRateRange, rotationSalaryRange);
  
  const chartDisplayData = chartMode === 'fullDay' ? processedFullDayData : processedRotationData;

  const RATE_CHART_COLOR = "#60a5fa";
  const SALARY_CHART_COLOR = "#4ade80";

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

        {error && <div className="text-center p-4 text-red-600 bg-red-100 rounded-lg">{error}</div>}

        {loading && (
          <div className="flex items-center justify-center py-8 space-x-4">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg text-gray-600 font-medium">{loadingText}</span>
          </div>
        )}
        
        {data && !loading && (
          <>
            <div className="grid lg:grid-cols-2 gap-8">
              <ResultCard result={processedFullDayData.resultForCard} onShowDetails={() => setActivePanelData(fullDayData || null)} />
              <ResultCard result={processedRotationData.resultForCard} onShowDetails={() => setActivePanelData(rotationData || null)} />
            </div>

            <div className="space-y-8 mt-8">
              <div className="border rounded-lg bg-white shadow-sm">
                <AnalysisChartBlock 
                  title="Распределение средних ставок" 
                  chartData={chartDisplayData.rateChartData} 
                  averageValue={chartDisplayData.averageRate} 
                  lineColor={RATE_CHART_COLOR} 
                  dataLabel="Ставка" 
                  unit="руб/час"
                  filterRange={chartMode === 'fullDay' ? fullDayRateRange : rotationRateRange}
                >
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setChartMode('fullDay')} className={`px-4 py-2 rounded-md text-sm font-medium ${chartMode === 'fullDay' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Полный день</button>
                    <button onClick={() => setChartMode('rotation')} className={`px-4 py-2 rounded-md text-sm font-medium ${chartMode === 'rotation' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Вахтовый метод</button>
                  </div>
                </AnalysisChartBlock>
                
                {chartMode === 'fullDay' 
                  ? <FilterSlider title="Фильтр по ставке" unit="₽/час" range={fullDayRateRange} min={fullDayMinRate} max={fullDayMaxRate} onChange={setFullDayRateRange} color={RATE_CHART_COLOR} />
                  : <FilterSlider title="Фильтр по ставке" unit="₽/час" range={rotationRateRange} min={rotationMinRate} max={rotationMaxRate} onChange={setRotationRateRange} color={RATE_CHART_COLOR} />
                }
              </div>

              <div className="border rounded-lg bg-white shadow-sm">
                <AnalysisChartBlock 
                  title="Распределение средних зарплат" 
                  chartData={chartDisplayData.salaryChartData} 
                  averageValue={chartDisplayData.averageSalary} 
                  lineColor={SALARY_CHART_COLOR} 
                  dataLabel="Зарплата" 
                  unit="руб/мес"
                  filterRange={chartMode === 'fullDay' ? fullDaySalaryRange : rotationSalaryRange}
                />
                
                {chartMode === 'fullDay'
                  ? <FilterSlider title="Фильтр по зарплате" unit="₽/мес" range={fullDaySalaryRange} min={fullDayMinSalary} max={fullDayMaxSalary} onChange={setFullDaySalaryRange} color={SALARY_CHART_COLOR} />
                  : <FilterSlider title="Фильтр по зарплате" unit="₽/мес" range={rotationSalaryRange} min={rotationMinSalary} max={rotationMaxSalary} onChange={setRotationSalaryRange} color={SALARY_CHART_COLOR} />
                }
              </div>
            </div>
          </>
        )}
      </div>
      
      {activePanelData && <CompanyDetailPanel data={activePanelData} onClose={() => setActivePanelData(null)} excludedCompanies={excludedCompanies} onToggleExclusion={toggleCompanyExclusion} />}
    </>
  );
}