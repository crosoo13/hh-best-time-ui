import React from 'react';

// Убедитесь, что эти интерфейсы импортированы или определены
export interface BestTimeResult {
    recommendedHour: number | null;
    reasoning: string;
    dayLabel?: string;
    maxScore?: number;
}
export interface FinalRecommendations {
    immediateToday: BestTimeResult | null;
    bestIn3Days: BestTimeResult | null;
    bestIn7Days: BestTimeResult | null;
}

interface AiRecommendationCardProps {
    recommendation: FinalRecommendations;
    timeZoneDisplay?: string | null;
}

const RecommendationBlock: React.FC<{ result: BestTimeResult, title: string }> = ({ result, title }) => (
    <div>
        <div className="flex justify-between items-baseline gap-2">
            <h3 className="text-sm font-bold text-gray-800 flex-shrink-0">
                {title}
            </h3>
            <p className="text-xs text-gray-500 text-right">{result.reasoning}</p>
        </div>
        <div className="text-center bg-gray-50 border border-gray-200 text-gray-800 rounded-lg p-2 mt-1.5">
            <p className="font-semibold text-lg tracking-tight">
                {result.dayLabel}, {String(result.recommendedHour).padStart(2, '0')}:00 - {String(result.recommendedHour! + 1).padStart(2, '0')}:00
            </p>
        </div>
    </div>
);


const AiRecommendationCard: React.FC<AiRecommendationCardProps> = ({ recommendation, timeZoneDisplay }) => {

    const { immediateToday, bestIn3Days, bestIn7Days } = recommendation;

    const noData = !immediateToday && !bestIn3Days && !bestIn7Days;

    if (noData) {
        return (
            <div className="bg-white border rounded-lg p-6 h-full flex flex-col items-center justify-center text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700">Ожидание данных</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Не удалось найти оптимальное время. Попробуйте изменить параметры поиска.
                </p>
            </div>
        );
    }

    const uniqueRecommendations = new Map<string, { result: BestTimeResult, title: string }>();

    // Порядок: 7 дней -> 3 дня -> сегодня
    if (bestIn7Days) {
        const key = `${bestIn7Days.dayLabel}-${bestIn7Days.recommendedHour}`;
        uniqueRecommendations.set(key, { result: bestIn7Days, title: 'Лучшее за 7 дней' });
    }
    if (bestIn3Days) {
        const key = `${bestIn3Days.dayLabel}-${bestIn3Days.recommendedHour}`;
        if (!uniqueRecommendations.has(key)) {
            uniqueRecommendations.set(key, { result: bestIn3Days, title: 'Лучшее за 3 дня' });
        }
    }
    if (immediateToday) {
        const key = `${immediateToday.dayLabel}-${immediateToday.recommendedHour}`;
        if (!uniqueRecommendations.has(key)) {
            uniqueRecommendations.set(key, { result: immediateToday, title: 'Ближайшее сегодня' });
        }
    }

    return (
        <div className="bg-white border rounded-lg p-4 h-full shadow-sm flex flex-col">
            <div className="flex-shrink-0 mb-2">
                <div className="flex justify-between items-center">
                    {/* --- ИЗМЕНЕНИЕ: Обновлены стили заголовка --- */}
                    <h3 className="font-semibold text-gray-800">
                        ИИ Рекомендация публикаций
                    </h3>
                    {timeZoneDisplay && (
                        <span className="text-sm font-medium text-blue-600 bg-blue-100 rounded-full px-3 py-1 flex-shrink-0">
                            {timeZoneDisplay}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-3">
                {Array.from(uniqueRecommendations.values()).map(rec => (
                    <div key={rec.title} className="pt-3 first:pt-0">
                        <RecommendationBlock {...rec} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AiRecommendationCard;