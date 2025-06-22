import React, { useState, FormEvent, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { API, weekFull, weekShort } from '../lib/constants';

// UI Components
import JobForm from '../components/JobForm';
import StatsSummary from '../components/StatsSummary';
import Charts from '../components/Charts';
import BumpChart from '../components/BumpChart';
import AiRecommendationCard from '../components/AiRecommendationCard';
import CompanyDetailPanel from '@/shared/ui/CompanyDetailPanel';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import HeatmapChart from '../components/HeatmapChart.jsx';

// Hooks
import { useLoadingPhrases } from '../hooks/useLoadingPhrases';
import { useVacancySearch } from '../hooks/useVacancySearch';
import { useVacancyProcessor } from '../hooks/useVacancyProcessor';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

// Types and Analytics
import { ActivityResponse } from '../lib/types';
import { calculateAdvancedRecommendation } from '../lib/vacancyAnalytics';


export default function TimePostingPage() {
    // State для формы и UI
    const [job, setJob] = useState('');
    const [city, setCity] = useState('');
    const [fly, setFly] = useState(false);
    const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);
    const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
    const [timeZoneDisplay, setTimeZoneDisplay] = useState<string | null>(null);
    
    // State для сырых данных по активности
    const [heatmapData, setHeatmapData] = useState<ActivityResponse | null>(null);

    // --- ПОТОКИ ДАННЫХ ---

    // 1. Основной поиск вакансий (hh-stats)
    const { loading, error, apiResponse, search } = useVacancySearch();

    // 2. СТАРЫЙ ПОТОК: Этот хук и его результат 'displayData' остаются для совместимости со старыми графиками.
    const { displayData, allCompanies } = useVacancyProcessor(apiResponse, excludedCompanies);

    // 3. НОВЫЙ ПОТОК: Продвинутый анализ для AiRecommendationCard с учетом часового пояса.
    const advancedRecommendation = useMemo(() => {
        const regionUtcOffset = apiResponse?.timeZone?.utc_diff;
        return calculateAdvancedRecommendation(apiResponse, heatmapData, regionUtcOffset);
    }, [apiResponse, heatmapData]);

    // --- Вспомогательные хуки ---
    const loadingText = useLoadingPhrases(loading);
    useBodyScrollLock(isDetailPanelOpen);

    // Эффекты для часового пояса и логирования ошибок
    useEffect(() => {
        const newTimeZone = apiResponse?.timeZone?.display || heatmapData?.timeZone?.display;
        if (newTimeZone) {
            setTimeZoneDisplay(newTimeZone);
        }
    }, [apiResponse, heatmapData]);

    useEffect(() => {
        if (error) {
            console.error("Ошибка основного поиска вакансий:", error);
        }
    }, [error]);

    // Обработчик отправки формы
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsDetailPanelOpen(false);
        setExcludedCompanies([]);
        setHeatmapData(null);
        setTimeZoneDisplay(null);
        
        search(job, city, fly);

        if (city) {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    throw new Error('Не удалось получить сессию пользователя.');
                }
                
                const endpoint = `${API}/api/activity?city=${encodeURIComponent(city)}&job=${encodeURIComponent(job)}`;
                const response = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Не удалось загрузить данные для карты активности');
                }

                const data: ActivityResponse = await response.json();
                setHeatmapData(data);

            } catch (err: any) {
                console.error("Ошибка при загрузке данных для тепловой карты:", err.message);
                setHeatmapData(null);
            }
        }
    };

    // Обработчик изменения полей формы
    const handleChange = useCallback((field: string, value: any) => {
        if (field === 'job') setJob(value);
        if (field === 'city') setCity(value);
        if (field === 'fly') setFly(value);
    }, []);

    // Обработчик исключения компаний
    const toggleCompanyExclusion = (companyName: string) => {
        setExcludedCompanies(prev =>
            prev.includes(companyName) ? prev.filter(n => n !== companyName) : [...prev, companyName]
        );
    };

    return (
        <>
            <div className="container mx-auto p-4 space-y-8">
                <JobForm
                    job={job} city={city} fly={fly} loading={loading}
                    onChange={handleChange} onSubmit={handleSubmit}
                />

                {error && (
                    <div className="text-center p-4 text-red-600 bg-red-100 rounded-lg">
                        Ошибка. Попробуйте позже
                    </div>
                )}

                {loading && <LoadingSpinner text={loadingText} />}

                {displayData && !loading && (
                    <div className="space-y-8">
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="lg:w-1/2">
                                {/* Этот компонент использует СТАРЫЙ поток (displayData) */}
                                <StatsSummary
                                    total={displayData.total}
                                    companies={displayData.companies}
                                    onShowDetails={() => setIsDetailPanelOpen(true)}
                                />
                            </div>
                            <div className="lg:w-1/2">
                                {/* Этот компонент использует НОВЫЙ поток и получает часовой пояс */}
                                <AiRecommendationCard 
                                    recommendation={advancedRecommendation} 
                                    timeZoneDisplay={timeZoneDisplay}
                                />
                            </div>
                        </div>
                        {/* Эти компоненты используют СТАРЫЙ поток (displayData) */}
                        <Charts
                            days={displayData.days} hours={displayData.hours}
                            weekFull={weekFull} weekShort={weekShort}
                            timeZoneDisplay={timeZoneDisplay} 
                        />
                        <BumpChart bumpDates={displayData.bumpDates} />
                    </div>
                )}
                
                {/* Этот блок использует сырые данные heatmapData */}
                {!loading && !error && (
                    <div className="mt-8">
                        {heatmapData && heatmapData.heatmapData.length > 0 && (
                            <HeatmapChart 
                                data={heatmapData.heatmapData} 
                                timeZoneDisplay={timeZoneDisplay} 
                            />
                        )}
                        
                        {heatmapData && heatmapData.heatmapData.length === 0 && (
                            <div className="text-center bg-white border rounded-lg p-8">
                                <p className="text-gray-500">Данные об активности для этого региона и профессии в нашей базе отсутствуют.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isDetailPanelOpen && (
                <CompanyDetailPanel
                    companies={allCompanies}
                    title={`Все компании (${Object.keys(allCompanies).length})`}
                    excludedCompanies={excludedCompanies}
                    onToggleExclusion={toggleCompanyExclusion}
                    onClose={() => setIsDetailPanelOpen(false)}
                />
            )}
        </>
    );
}