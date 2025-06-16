// src/pages/market-analysis/model/types.ts

export interface AvgSalaryInfo {
  avg: number; min: number; max: number;
  avg_monthly: number; min_monthly: number; max_monthly: number;
}

export interface CompanyStat {
  company_name: string;
  vacancy_count: number;
  avg_monthly_salary: number;
  avg_hourly_rate: number;
  schedule: string; // <-- ДОБАВЛЕНО
}

export interface Result {
  profession: string;
  mode: string;
  location: string;
  kept_count: number;
  schedule: string; // <-- ДОБАВЛЕНО
  hourly_stats: AvgSalaryInfo | null;
  companies: CompanyStat[];
}

export interface ApiResponse {
  results: Result[];
}