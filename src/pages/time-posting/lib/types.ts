// Данные для одной вакансии из API
export interface RawVacancy {
  id: string;
  name: string;
  companyName: string;
  publishedAt: string;
  url: string;
  salary: any;
}

// Структура для компании с ее количеством вакансий
export interface CompanyWithCount {
  name: string;
  count: number;
}

// Общая структура для данных по дням, часам и прогнозу
export interface ChartDetailData {
  count: number; // Общее кол-во
  companies: CompanyWithCount[]; // Компании с их индивидуальным кол-вом
}

// Структура всего state с обработанными данными для отображения
export interface DisplayData {
  total: number;
  days: Record<string, ChartDetailData>;
  hours: Record<string, ChartDetailData>;
  companies: Record<string, number>;
  bumpDates: Record<string, ChartDetailData>;
}

// --- ВАШИ СУЩЕСТВУЮЩИЕ ТИПЫ (ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ) ---

// Данные для одной вакансии из API
export interface RawVacancy {
  id: string;
  name: string;
  companyName: string;
  publishedAt: string;
  url: string;
  salary: any;
}

// Структура для компании с ее количеством вакансий
export interface CompanyWithCount {
  name: string;
  count: number;
}

// Общая структура для данных по дням, часам и прогнозу
export interface ChartDetailData {
  count: number; // Общее кол-во
  companies: CompanyWithCount[]; // Компании с их индивидуальным кол-вом
}

// Структура всего state с обработанными данными для отображения
export interface DisplayData {
  total: number;
  days: Record<string, ChartDetailData>;
  hours: Record<string, ChartDetailData>;
  companies: Record<string, number>;
  bumpDates: Record<string, ChartDetailData>;
}


// --- НОВОЕ: Типы для сырых API ответов ---

// Тип для ответа от hh-stats
export interface HhStatsResponse {
    query: { [key: string]: any };
    timeZone: { display: string; [key: string]: any };
    total: number;
    // Используем ваш существующий тип RawVacancy!
    vacancies: RawVacancy[];
}

// Тип для ответа от activity
export interface ActivityResponse {
    query: { [key: string]: any };
    timeZone: { display: string; [key: string]: any };
    heatmapData: Array<{
        dayweek: number;
        activehour: number;
        cnt: number;
    }>;
}

// --- НОВОЕ: Тип для результата нашего анализа ---
// Этот объект будет производить vacancyAnalytics.ts и передавать в AiRecommendationCard.tsx
export interface AnalyticsResult {
    vacancyCount: number;
    hasActivityData: boolean;
    // Здесь будут результаты будущего анализа
}