import { useState, useMemo, ChangeEvent } from 'react';
import { formatNumber } from '@/shared/lib/formatters';

// --- Типы данных ---

// Тип для страницы market-analysis
interface CompanyStat {
  company_name: string;
  vacancy_count: number;
  avg_monthly_salary: number;
  avg_hourly_rate: number;
  schedule: string;
}
interface ResultData {
  mode: string;
  companies: CompanyStat[];
}

// --- НОВОЕ: Обновленный интерфейс Props ---
// Делаем data и companies опциональными и добавляем общий title
interface Props {
  data?: ResultData;                     // Для market-analysis
  companies?: Record<string, number>;    // Для time-posting
  title: string;                         // Общий заголовок для панели
  onClose: () => void;
  excludedCompanies: string[];
  onToggleExclusion: (companyName: string) => void;
}

// --- Иконки (можно вынести в отдельный файл) ---
const IconEyeVisible = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.523 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const IconEyeHidden = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.477 3 10 3a9.955 9.955 0 00-4.542 1.071L3.707 2.293zM10 12a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" /><path d="M10 17a9.95 9.95 0 01-4.653-1.157l1.23-1.23a8.016 8.016 0 006.847 0l1.23 1.23A9.95 9.95 0 0110 17z" /></svg>;
const IconSortAsc = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m-5 4h2M5 15l7-7 7 7" /></svg>;
const IconSortDesc = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m-5 4h2M19 9l-7 7-7-7" /></svg>;


export default function CompanyDetailPanel({ data, companies, title, onClose, excludedCompanies, onToggleExclusion }: Props) {
  const [sortKey, setSortKey] = useState<'avg_hourly_rate' | 'avg_monthly_salary' | 'count'>('avg_hourly_rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // --- НОВОЕ: Универсальный обработчик данных ---
  const itemsToRender = useMemo(() => {
    let sortable: any[];

    if (data) { // Режим "Market Analysis"
      sortable = [...data.companies];
    } else if (companies) { // Режим "Time Posting"
      sortable = Object.entries(companies).map(([name, count]) => ({
        company_name: name,
        count: count
      }));
      // Для режима time-posting доступна только сортировка по 'count'
      if (sortKey !== 'count') setSortKey('count');
    } else {
      return [];
    }
    
    // Общая логика сортировки
    sortable.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === undefined || valB === undefined) return 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return sortable;
  }, [data, companies, sortKey, sortOrder]);


  const handleSortKeyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortKey(e.target.value as any);
  };
  const toggleSortOrder = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col animate-slide-in-right">
        
        {/* --- Заголовок --- */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200" aria-label="Закрыть">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* --- НОВОЕ: Условный рендеринг сортировки --- */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-4">
            <label htmlFor="sort-select" className="text-sm font-medium text-gray-500">Сортировать по:</label>
            <select
              id="sort-select"
              value={sortKey}
              onChange={handleSortKeyChange}
              className="block w-auto text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {data ? ( // Поля сортировки для Market Analysis
                <>
                  <option value="avg_hourly_rate">Ставке</option>
                  <option value="avg_monthly_salary">Зарплате</option>
                </>
              ) : ( // Поля сортировки для Time Posting
                <option value="count">Количеству постов</option>
              )}
            </select>
            <button onClick={toggleSortOrder} className="p-2 rounded-full hover:bg-gray-200" aria-label="Сменить направление">
              {sortOrder === 'desc' ? <IconSortDesc /> : <IconSortAsc />}
            </button>
          </div>
        </div>
        
        {/* --- Общий список --- */}
        <div className="flex-grow p-4 overflow-y-auto">
          {itemsToRender.length > 0 ? (
            <ul className="space-y-3">
              {itemsToRender.map((item) => {
                const isExcluded = excludedCompanies.includes(item.company_name);
                
                return (
                  <li key={item.company_name} className={`p-3 border rounded-md flex justify-between items-center transition-opacity ${isExcluded ? 'opacity-40 bg-gray-100' : 'bg-white'}`}>
                    {/* --- НОВОЕ: Условный рендеринг деталей компании --- */}
                    <div>
                      <p className="font-bold">{item.company_name}</p>
                      {data ? ( // Детали для Market Analysis
                        <>
                          <p className="text-sm text-gray-600">Вакансий найдено: {item.vacancy_count}</p>
                          <p className="text-sm text-gray-600">Расчетный график: <span className="font-medium text-black">{item.schedule}</span></p>
                          <p className="text-sm">ЗП: <span className="font-semibold">{formatNumber(item.avg_monthly_salary)} руб/мес</span></p>
                          <p className="text-sm">Ставка: <span className="font-semibold">{formatNumber(item.avg_hourly_rate, 2)} руб/час</span></p>
                        </>
                      ) : ( // Детали для Time Posting
                        <p className="text-sm text-gray-600">Постов найдено: <span className="font-semibold">{item.count}</span></p>
                      )}
                    </div>
                    <button onClick={() => onToggleExclusion(item.company_name)} className="p-2 rounded-full hover:bg-gray-200" title={isExcluded ? 'Включить в расчет' : 'Исключить из расчета'}>
                      {isExcluded ? <IconEyeHidden /> : <IconEyeVisible />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500">Нет данных по компаниям.</p>
          )}
        </div>
      </div>
    </div>
  );
}