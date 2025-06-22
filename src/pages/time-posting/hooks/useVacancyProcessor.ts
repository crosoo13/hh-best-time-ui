import { useMemo } from 'react';
// Убедитесь, что путь к этим файлам верный
import { processVacancyData } from '../lib/vacancyProcessor';
import { RawApiResponse } from '../lib/types'; 

/**
 * Кастомный хук-обработчик.
 * Принимает "сырой" ответ от API и список исключенных компаний.
 * Возвращает данные, готовые для отображения в графиках.
 * * @param apiResponse - Полный объект ответа от воркера hh-stats.js.
 * @param excludedCompanies - Массив названий компаний для исключения из статистики.
 */
export const useVacancyProcessor = (apiResponse: RawApiResponse | null, excludedCompanies: string[]) => {
    
    const processedData = useMemo(() => {
        // Если ответа от API еще нет или он пустой, ничего не делаем
        if (!apiResponse || !apiResponse.vacancies) {
            return null;
        }
        
        // Вызываем основную функцию-обработчик, передавая ей:
        // 1. Массив вакансий
        // 2. Разницу во времени с Москвой
        // 3. Список исключенных компаний
        return processVacancyData(
            apiResponse.vacancies, 
            apiResponse.query.msk_time_diff, 
            excludedCompanies
        );

    }, [apiResponse, excludedCompanies]); // Пересчет будет запускаться только при изменении этих данных

    // Возвращаем данные в формате, удобном для компонентов
    return {
        displayData: processedData?.displayData || null,
        allCompanies: processedData?.allCompanies || {},
    };
};