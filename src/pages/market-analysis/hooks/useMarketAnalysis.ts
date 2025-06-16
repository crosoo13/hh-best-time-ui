import { useMemo } from 'react';
import type { Result, CompanyStat } from '../model/types';

export function useMarketAnalysis(
  sourceData?: Result,
  excludedCompanies?: string[],
  rateRange?: [number, number],
  salaryRange?: [number, number]
) {
  const processedData = useMemo(() => {
    if (!sourceData?.companies) {
      return { resultForCard: null, rateChartData: [], averageRate: 0, salaryChartData: [], averageSalary: 0 };
    }

    // ЭТА ЛОГИКА ОСТАЕТСЯ НЕИЗМЕННОЙ.
    // Она нужна для корректного расчета статистики для карточек и средней линии.
    const companiesAfterRangeFilter = (sourceData.companies || []).filter(c => {
      if (!c) return false;
      const isInRateRange = c.avg_hourly_rate >= (rateRange?.[0] || 0) && c.avg_hourly_rate <= (rateRange?.[1] || Infinity);
      const isInSalaryRange = c.avg_monthly_salary >= (salaryRange?.[0] || 0) && c.avg_monthly_salary <= (salaryRange?.[1] || Infinity);
      return isInRateRange && isInSalaryRange;
    });

    const activeCompanies = companiesAfterRangeFilter.filter(c => !excludedCompanies?.includes(c.company_name));
    
    // --- ИЗМЕНЕНИЕ 1: Создаем отдельный список компаний для построения ПОЛНОГО графика ---
    // Он фильтруется только по исключенным компаниям, но ИГНОРИРУЕТ фильтры слайдеров.
    const companiesForFullChart = (sourceData.companies || []).filter(c => 
      !excludedCompanies?.includes(c.company_name)
    );

    // Эта функция для статистики по-прежнему использует `activeCompanies`. ЭТО ПРАВИЛЬНО.
    const getStats = (key: keyof Pick<CompanyStat, 'avg_hourly_rate' | 'avg_monthly_salary'>) => {
      const values = activeCompanies.map(c => c[key] as number).filter(v => typeof v === 'number' && v > 0);
      if (values.length === 0) return { avg: 0, min: 0, max: 0 };
      const sum = values.reduce((acc, v) => acc + v, 0);
      return { avg: sum / values.length, min: Math.min(...values), max: Math.max(...values) };
    };

    const rateStats = getStats('avg_hourly_rate');
    const salaryStats = getStats('avg_monthly_salary');
    
    // Карточка результата также использует `activeCompanies`. ЭТО ПРАВИЛЬНО.
    const resultForCard: Result = { 
        ...sourceData, 
        kept_count: activeCompanies.reduce((sum, c) => sum + (c.vacancy_count || 0), 0), 
        companies: activeCompanies, 
        hourly_stats: { 
            avg: rateStats.avg, 
            min: rateStats.min, 
            max: rateStats.max, 
            avg_monthly: salaryStats.avg, 
            min_monthly: salaryStats.min, 
            max_monthly: salaryStats.max 
        } 
    };
    
    // Функция кластеризации остается без изменений.
    const clusterData = (companies: CompanyStat[], key: keyof Pick<CompanyStat, 'avg_hourly_rate' | 'avg_monthly_salary'>) => {
      const sorted = companies.filter(c => c && typeof c[key] === 'number' && (c[key] as number) > 0).sort((a, b) => (a[key] as number) - (b[key] as number));
      if (sorted.length === 0) return [];
      const clusters = [];
      if (sorted.length > 0) {
        let currentCluster = { companies: [sorted[0]], clusterValue: sorted[0][key] as number };
        for (let i = 1; i < sorted.length; i++) {
          const company = sorted[i];
          const companyValue = company[key] as number;
          const threshold = currentCluster.clusterValue * 0.02;
          if (Math.abs(companyValue - currentCluster.clusterValue) <= threshold) {
            currentCluster.companies.push(company);
            const sum = currentCluster.companies.reduce((acc, c) => acc + (c[key] as number), 0);
            currentCluster.clusterValue = sum / currentCluster.companies.length;
          } else {
            clusters.push(currentCluster);
            currentCluster = { companies: [company], clusterValue: companyValue };
          }
        }
        clusters.push(currentCluster);
      }
      return clusters.map((cluster, index) => ({ name: `cluster-${index}`, value: cluster.clusterValue, companies: cluster.companies }));
    };
    
    // --- ИЗМЕНЕНИЕ 2: Строим данные для графика на основе ПОЛНОГО списка компаний ---
    const rateChartData = clusterData(companiesForFullChart, 'avg_hourly_rate');
    const salaryChartData = clusterData(companiesForFullChart, 'avg_monthly_salary');

    // Возвращаем результат: статистика отфильтрована, а данные для графика - полные.
    return { resultForCard, rateChartData, averageRate: rateStats.avg, salaryChartData, averageSalary: salaryStats.avg };
  }, [sourceData, excludedCompanies, rateRange, salaryRange]);
  
  return processedData;
}