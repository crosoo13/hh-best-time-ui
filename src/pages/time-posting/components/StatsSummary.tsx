// src/pages/time-posting/components/StatsSummary.tsx

import React from 'react';

// Используем ваш форматер чисел, если он доступен глобально
// import { formatNumber } from '@/shared/lib/formatters';
// Если нет, можно использовать простую замену:
const formatNumber = (num: number) => num.toLocaleString('ru-RU');

interface Props {
  total: number;
  companies: Record<string, number>;
  onShowDetails: () => void;
}

export default function StatsSummary({ total, companies, onShowDetails }: Props) {
  // ИЗМЕНЕНИЕ: Показываем топ-6
  const top6 = Object.entries(companies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const totalCompanies = Object.keys(companies).length;

  return (
    // ИЗМЕНЕНИЕ: Добавлена высота h-full и flex-контейнер для управления высотой
    <div className="bg-white p-4 rounded-lg border shadow-sm h-full flex flex-col">
      {/* Верхний блок: общая статистика */}
      <div className="flex-shrink-0">
        <p className="text-gray-800">
          Обработано вакансий:
          <span className="ml-2 text-lg font-bold text-blue-600">{formatNumber(total)}</span>
        </p>
      </div>

      {/* Средний блок: список компаний, который будет расти и скроллиться */}
      {top6.length > 0 && (
        <div className="mt-3 pt-3 border-t flex-grow overflow-y-auto pr-2">
          {/* ИЗМЕНЕНИЕ: Текст и стиль заголовка */}
          <h3 className="font-semibold text-gray-800 mb-2">Кол-во вакансий компаний:</h3>
          <ul className="space-y-1.5 text-sm">
            {top6.map(([name, cnt]) => (
              <li key={name} className="flex justify-between items-center">
                <span className="text-gray-700 truncate" title={name}>{name}</span>
                <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded-md flex-shrink-0">
                  {formatNumber(cnt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Пустой блок-распорка, если нет компаний, чтобы кнопка оставалась внизу */}
      {top6.length === 0 && <div className="flex-grow"></div>}


      {/* Нижний блок: кнопка */}
      {totalCompanies > 0 && (
        <div className="mt-4 pt-4 border-t flex-shrink-0">
          <button onClick={onShowDetails} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
            Показать все компании ({totalCompanies}) →
          </button>
        </div>
      )}
    </div>
  );
}