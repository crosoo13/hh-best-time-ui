import { HhStatsResponse, ActivityResponse, AnalyticsResult, RawVacancy } from './types';

// --- ИНТЕРФЕЙСЫ И КОНСТАНТЫ ---

/**
 * Описывает результат для одного конкретного временного слота.
 * Экспортируем, чтобы использовать в AiRecommendationCard.
 */
export interface BestTimeResult {
    recommendedHour: number | null;
    reasoning: string;
    dayLabel?: string;
    maxScore?: number;
    dayIndex?: number;
}

/**
 * Описывает итоговый, сложный результат с тремя видами рекомендаций.
 * Экспортируем, чтобы использовать в AiRecommendationCard.
 */
export interface FinalRecommendations {
    immediateToday: BestTimeResult | null;
    bestIn3Days: BestTimeResult | null;
    bestIn7Days: BestTimeResult | null;
}

/**
 * Карта коэффициентов видимости в зависимости от числа конкурентов.
 */
const VISIBILITY_SCORE_MAP = [
    1.0,  // 0 конкурентов
    0.95, // 1 конкурент
    0.90, // 2 конкурента
    0.75, // 3 конкурента
    0.6,  // 4 конкурента
    0.5,  // 5 конкурентов
    0.4,  // 6 конкурентов
];

/**
 * Надежный массив с названиями дней недели. Индекс 0 = Воскресенье.
 */
const WEEKDAY_LABELS_RU = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];


// --- ХЕЛПЕР-ФУНКЦИИ ---

/**
 * Возвращает коэффициент видимости на основе количества конкурентов.
 */
function getVisibilityScore(competitorCount: number): number {
    const count = Math.round(competitorCount);
    if (count < VISIBILITY_SCORE_MAP.length) {
        return VISIBILITY_SCORE_MAP[count];
    }
    return 0.3;
}


// --- ОСНОВНАЯ АНАЛИТИЧЕСКАЯ ФУНКЦИЯ ---

export function calculateAdvancedRecommendation(
    hhStats: HhStatsResponse | null,
    activityData: ActivityResponse | null,
    regionUtcOffset: number | null
): FinalRecommendations {
    const defaultResult: FinalRecommendations = {
        immediateToday: null,
        bestIn3Days: null,
        bestIn7Days: null,
    };

    if (!hhStats || !activityData || !Array.isArray(activityData.heatmapData) || activityData.heatmapData.length === 0 || regionUtcOffset === null) {
        return defaultResult;
    }

    // --- Подготовка данных ---
    const nowInUtc = new Date();
    const currentHourInRegion = (nowInUtc.getUTCHours() + regionUtcOffset + 24) % 24;
    const todayInRegion = new Date(nowInUtc.getTime() + regionUtcOffset * 3600 * 1000);
    
    const dayOffsets = [0, 1, 2, 3, 4, 5, 6, 7];
    const activities = dayOffsets.map(offset => {
        const targetDate = new Date(todayInRegion);
        targetDate.setUTCDate(todayInRegion.getUTCDate() + offset);
        const dayOfWeek = (targetDate.getUTCDay() + 6) % 7; // Этот формат (ПН=0) используется для heatmap
        const dailyActivity = new Array(24).fill(0);
        activityData.heatmapData.filter(d => ((d.dayweek + 6) % 7) === dayOfWeek).forEach(d => dailyActivity[d.activehour] = d.cnt);
        return dailyActivity;
    });

    const vacanciesByCompanyAndDate = new Map<string, RawVacancy[]>();
    for (const v of hhStats.vacancies) {
        const publicationDate = new Date(v.publishedAt);
        const publicationDateInRegion = new Date(publicationDate.getTime() + regionUtcOffset * 3600 * 1000);
        const dateKey = publicationDateInRegion.toISOString().slice(0, 10);
        const key = `${v.companyName}_${dateKey}`;
        if (!vacanciesByCompanyAndDate.has(key)) {
            vacanciesByCompanyAndDate.set(key, []);
        }
        vacanciesByCompanyAndDate.get(key)!.push(v);
    }
    
    // Внутренняя функция для поиска лучшего времени в заданный день
    const findBestTime = (
        targetDate: Date, 
        startHour: number,
        activityForTargetDay: number[],
        activityForNextDay: number[]
    ): { bestHour: number, maxScore: number } => {
        const predictedCompetitionPerHour = new Array(24).fill(0);
        
        const dateFor30DayBump = new Date(targetDate);
        dateFor30DayBump.setUTCDate(targetDate.getUTCDate() - 30);
        const dateKey30DaysAgo = dateFor30DayBump.toISOString().slice(0, 10);

        const dateFor7DayBump = new Date(targetDate);
        dateFor7DayBump.setUTCDate(targetDate.getUTCDate() - 7);
        const dateKey7DaysAgo = dateFor7DayBump.toISOString().slice(0, 10);

        for (const [key, vacanciesGroup] of vacanciesByCompanyAndDate.entries()) {
            const publicationDateKey = key.split('_')[1];
            if (publicationDateKey === dateKey7DaysAgo || publicationDateKey === dateKey30DaysAgo) {
                let projectedCount = 0;
                if (publicationDateKey === dateKey7DaysAgo) {
                    projectedCount = Math.ceil(vacanciesGroup.length * 0.5);
                } else {
                    const totalCount = vacanciesGroup.length;
                    projectedCount = (totalCount === 1) ? 1 : Math.ceil(totalCount * 0.6);
                }
                for (let i = 0; i < projectedCount; i++) {
                    const vacancyToProject = vacanciesGroup[i];
                    const originalPublicationDate = new Date(vacancyToProject.publishedAt);
                    const publishedHourInRegion = (originalPublicationDate.getUTCHours() + regionUtcOffset + 24) % 24;
                    predictedCompetitionPerHour[publishedHourInRegion] += 1;
                }
            }
        }
        
        const effectiveReachScores = new Array(24).fill(0);
        for (let h = 0; h < 24; h++) {
            let potentialAudience = 0;
            const LOOKAHEAD_HOURS = 8;
            for (let i = 0; i < LOOKAHEAD_HOURS; i++) {
                const currentHour = h + i;
                if (currentHour < 24) {
                    potentialAudience += activityForTargetDay[currentHour];
                } else {
                    potentialAudience += activityForNextDay[currentHour % 24];
                }
            }
            const visibilityScore = getVisibilityScore(predictedCompetitionPerHour[h]);
            effectiveReachScores[h] = potentialAudience * visibilityScore;
        }

        let bestHour = -1;
        let maxScore = -1;
        for (let h = startHour; h < 24; h++) {
            if (effectiveReachScores[h] > maxScore) {
                maxScore = effectiveReachScores[h];
                bestHour = h;
            }
        }
        return { bestHour, maxScore };
    };

    // --- Анализ на 7 дней с надежной генерацией меток ---
    const dayLabels: string[] = [];
    for (let i = 0; i < 7; i++) {
        if (i === 0) {
            dayLabels.push("Сегодня");
        } else if (i === 1) {
            dayLabels.push("Завтра");
        } else {
            const futureDate = new Date(todayInRegion);
            futureDate.setUTCDate(todayInRegion.getUTCDate() + i);
            const dayOfWeek = futureDate.getUTCDay(); // 0 = Вс, 1 = Пн...
            dayLabels.push(WEEKDAY_LABELS_RU[dayOfWeek]);
        }
    }
    
    const allResults: BestTimeResult[] = [];
    for (let i = 0; i < 7; i++) {
        const targetDate = new Date(todayInRegion);
        targetDate.setUTCDate(todayInRegion.getUTCDate() + i);
        const startHour = (i === 0) ? Math.max(0, currentHourInRegion + 1) : 0;
        
        const result = findBestTime(targetDate, startHour, activities[i], activities[i+1]);
        
        if (result.bestHour !== -1) {
            allResults.push({
                dayIndex: i,
                dayLabel: dayLabels[i],
                recommendedHour: result.bestHour,
                maxScore: result.maxScore,
                reasoning: ''
            });
        }
    }

    if (allResults.length === 0) {
        return defaultResult;
    }
    
    // --- Выбираем 3-х победителей надежным способом по индексу ---
    const immediateToday = allResults.find(r => r.dayIndex === 0) || null;

    const threeDaySlice = allResults.filter(r => r.dayIndex! < 3);
    const bestIn3Days = threeDaySlice.length > 0
        ? threeDaySlice.reduce((best, current) => (current.maxScore! > best.maxScore!) ? current : best)
        : null;
    
    const bestIn7Days = allResults.reduce((best, current) => (current.maxScore! > best.maxScore!) ? current : best);

    const formatReasoning = (winner: BestTimeResult) => 
        `Публикация ${winner.dayLabel!.toLowerCase()} в интервале ${winner.recommendedHour!}:00-${winner.recommendedHour! + 1}:00 максимизирует охват.`;
    
    return {
        immediateToday: immediateToday ? { ...immediateToday, reasoning: formatReasoning(immediateToday) } : null,
        bestIn3Days: bestIn3Days ? { ...bestIn3Days, reasoning: formatReasoning(bestIn3Days) } : null,
        bestIn7Days: bestIn7Days ? { ...bestIn7Days, reasoning: formatReasoning(bestIn7Days) } : null,
    };
}


/**
 * Простая первоначальная функция для проверки связки данных.
 */
export function processAndAnalyzeData(
    hhStats: HhStatsResponse | null,
    activityData: ActivityResponse | null
): AnalyticsResult {
    const vacancyCount = hhStats?.total ?? 0;
    const hasActivityData = !!activityData && Array.isArray(activityData.heatmapData) && activityData.heatmapData.length > 0;
    return { vacancyCount, hasActivityData };
}