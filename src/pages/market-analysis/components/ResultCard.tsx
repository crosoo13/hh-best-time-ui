import { formatNumber } from '@/shared/lib/formatters';
import type { Result } from '../model/types';

interface Props {
  result: Result | null;
  onShowDetails: () => void;
}

export default function ResultCard({ result, onShowDetails }: Props) {
  if (!result) {
    return (
      <div className="p-4 border rounded-lg bg-white shadow-sm h-full">
        <p className="text-gray-500">Нет данных для отображения.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className={`text-xl font-semibold mb-2 ${result.mode === 'rotation' ? 'text-orange-700' : 'text-green-700'}`}>
        {result.mode === 'rotation' ? 'Вахтовый метод' : 'Полный день'}
      </h2>
      <p>Найдено релевантных вакансий: <span className="font-bold">{result.kept_count}</span> ({result.companies.length} комп.)</p>
      
      {result.hourly_stats ? (
        <div className="mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
          
          {/* Блок "ЗП в месяц" */}
          <div>
            {/* 1. Убрано "(общая)" */}
            <h4 className="font-semibold mb-2">ЗП в месяц:</h4>
            {/* 2. Изменен порядок: Макс, Средняя, Мин */}
            <p className="text-gray-600">Макс: {formatNumber(result.hourly_stats.max_monthly)} ₽</p>
            {/* 3. Средняя выделена большим и жирным шрифтом */}
            <p className="text-base font-semibold text-slate-800 my-1">Средняя: {formatNumber(result.hourly_stats.avg_monthly)} ₽</p>
            <p className="text-gray-600">Мин: {formatNumber(result.hourly_stats.min_monthly)} ₽</p>
          </div>

          {/* Блок "Ставка в час" */}
          <div>
            {/* 1. Убрано "(общая)" */}
            <h4 className="font-semibold mb-2">Ставка в час:</h4>
            {/* 2. Изменен порядок: Макс, Средняя, Мин */}
            <p className="text-gray-600">Макс: {formatNumber(result.hourly_stats.max, 2)} ₽</p>
            {/* 3. Средняя выделена большим и жирным шрифтом */}
            <p className="text-base font-semibold text-slate-800 my-1">Средняя: {formatNumber(result.hourly_stats.avg, 2)} ₽</p>
            <p className="text-gray-600">Мин: {formatNumber(result.hourly_stats.min, 2)} ₽</p>
          </div>

        </div>
      ) : <p className="mt-3 pt-3 border-t text-gray-500">Нет данных для статистики.</p>}

      {result.companies.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <button onClick={onShowDetails} className="text-blue-600 hover:text-blue-800 font-semibold">
            Показать детали по компаниям ({result.companies.length}) →
          </button>
        </div>
      )}
    </div>
  );
};