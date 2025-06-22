import { RawVacancy, CompanyWithCount, ChartDetailData, DisplayData } from './types';
import { weekFull } from './constants';

// Хелпер остаётся без изменений
const transformMapToArray = (map: Map<string, number>): CompanyWithCount[] => {
    return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
};

export const processVacancyData = (
    vacancies: RawVacancy[],
    msk_time_diff: number | null,
    excludedCompanies: string[]
): { displayData: DisplayData, allCompanies: Record<string, number> } | null => {

    if (!vacancies || !vacancies.length) return null;
    
    // --- 1. Подсчет всех компаний (до фильтрации) ---
    const allCompanies: Record<string, number> = {};
    for (const v of vacancies) {
        allCompanies[v.companyName] = (allCompanies[v.companyName] || 0) + 1;
    }

    // --- 2. Фильтрация и подготовка ---
    const filteredVacancies = vacancies.filter(v => !excludedCompanies.includes(v.companyName));
    if (!filteredVacancies.length) {
        return {
            displayData: { total: 0, days: {}, hours: {}, companies: {}, bumpDates: {} },
            allCompanies
        };
    }
    
    const newDays: Record<string, { total: number, companies: Map<string, number> }> =
        Object.fromEntries(weekFull.map(d => [d, { total: 0, companies: new Map() }]));
    const newHours: Record<string, { total: number, companies: Map<string, number> }> =
        Object.fromEntries(Array.from({ length: 24 }, (_, i) => [String(i).padStart(2, "0"), { total: 0, companies: new Map() }]));
    const newCompanies: Record<string, number> = {};
    
    const newBumpDates: Record<string, { total: number, companies: Map<string, number> }> = {};
    const recentCounts = new Map<string, Map<string, number>>(); 
    const oldVacanciesByCompany = new Map<string, RawVacancy[]>(); 

    const mskUtcOffset = 3; 
    const localTimeDiffFromMsk = msk_time_diff ?? 0;
    const regionUtcOffset = mskUtcOffset + localTimeDiffFromMsk;

    // --- 3. Основной цикл (ЭТАП 1: Сбор и распределение данных) ---
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(today.getDate() - 6);

    for (const v of filteredVacancies) {
        newCompanies[v.companyName] = (newCompanies[v.companyName] || 0) + 1;
        const publicationDate = new Date(v.publishedAt);
        const localTime = new Date(publicationDate);
        localTime.setUTCHours(localTime.getUTCHours() + regionUtcOffset);
        const dayKey = weekFull[(localTime.getUTCDay() + 6) % 7];
        newDays[dayKey].total++;
        newDays[dayKey].companies.set(v.companyName, (newDays[dayKey].companies.get(v.companyName) || 0) + 1);
        const hh = String(localTime.getUTCHours()).padStart(2, "0");
        newHours[hh].total++;
        newHours[hh].companies.set(v.companyName, (newHours[hh].companies.get(v.companyName) || 0) + 1);

        if (new Date(v.publishedAt) >= sixDaysAgo) {
            const dateKey = v.publishedAt.slice(0, 10);
            if (!recentCounts.has(dateKey)) recentCounts.set(dateKey, new Map());
            recentCounts.get(dateKey)!.set(v.companyName, (recentCounts.get(dateKey)!.get(v.companyName) || 0) + 1);
        } else {
            if (!oldVacanciesByCompany.has(v.companyName)) oldVacanciesByCompany.set(v.companyName, []);
            oldVacanciesByCompany.get(v.companyName)!.push(v);
        }
    }

    // --- 4. Цикл (ЭТАП 2: Расчет прогноза для СТАРЫХ вакансий по правилу 60%/100%) ---
    for (const [companyName, companyVacancies] of oldVacanciesByCompany.entries()) {
        const totalCount = companyVacancies.length;
        let projectedCount = 0;
        if (totalCount === 1) {
            projectedCount = 1;
        } else if (totalCount > 1) {
            // **ИЗМЕНЕНИЕ: Округление вверх**
            projectedCount = Math.ceil(totalCount * 0.6);
        }

        for (let i = 0; i < projectedCount; i++) {
            const vacancyToProject = companyVacancies[i];
            const bumpDate = new Date(vacancyToProject.publishedAt);
            bumpDate.setDate(bumpDate.getDate() + 30);
            const bumpKey = bumpDate.toISOString().slice(0, 10);
            
            if (!newBumpDates[bumpKey]) newBumpDates[bumpKey] = { total: 0, companies: new Map() };
            newBumpDates[bumpKey].total++;
            newBumpDates[bumpKey].companies.set(companyName, (newBumpDates[bumpKey].companies.get(companyName) || 0) + 1);
        }
    }

    // --- 5. Цикл (ЭТАП 3: Расчет прогноза для НЕДАВНИХ вакансий) ---
    for (const [dateKey, companiesMap] of recentCounts.entries()) {
        for (const [companyName, count] of companiesMap.entries()) {
            
            // **ИЗМЕНЕНИЕ: Округление вверх**
            const shortTermCount = Math.ceil(count * 0.5);
            if (shortTermCount > 0) {
                const shortTermDate = new Date(dateKey);
                shortTermDate.setUTCDate(shortTermDate.getUTCDate() + 7);
                const bumpKey = shortTermDate.toISOString().slice(0, 10);
                if (!newBumpDates[bumpKey]) newBumpDates[bumpKey] = { total: 0, companies: new Map() };
                newBumpDates[bumpKey].total += shortTermCount;
                newBumpDates[bumpKey].companies.set(companyName, (newBumpDates[bumpKey].companies.get(companyName) || 0) + shortTermCount);
            }
            
            const remainingCount = count - shortTermCount;
            if (remainingCount > 0) {
                let longTermProjectedCount = 0;
                if (remainingCount === 1) {
                    longTermProjectedCount = 1;
                } else if (remainingCount > 1) {
                    // **ИЗМЕНЕНИЕ: Округление вверх**
                    longTermProjectedCount = Math.ceil(remainingCount * 0.6);
                }

                if (longTermProjectedCount > 0) {
                    const longTermDate = new Date(dateKey);
                    longTermDate.setUTCDate(longTermDate.getUTCDate() + 30);
                    const bumpKey = longTermDate.toISOString().slice(0, 10);
                    if (!newBumpDates[bumpKey]) newBumpDates[bumpKey] = { total: 0, companies: new Map() };
                    newBumpDates[bumpKey].total += longTermProjectedCount;
                    newBumpDates[bumpKey].companies.set(companyName, (newBumpDates[bumpKey].companies.get(companyName) || 0) + longTermProjectedCount);
                }
            }
        }
    }

    // --- 6. Финализация данных ---
    const finalDays = Object.fromEntries(Object.entries(newDays).map(([k, v]) => [k, { count: v.total, companies: transformMapToArray(v.companies) }]));
    const finalHours = Object.fromEntries(Object.entries(newHours).map(([k, v]) => [k, { count: v.total, companies: transformMapToArray(v.companies) }]));
    const finalBumpDates = Object.fromEntries(Object.entries(newBumpDates).map(([k, v]) => [k, { count: v.total, companies: transformMapToArray(v.companies) }]));

    const displayData: DisplayData = {
        total: filteredVacancies.length,
        days: finalDays,
        hours: finalHours,
        companies: newCompanies,
        bumpDates: finalBumpDates
    };

    return { displayData, allCompanies };
};