import React from 'react';
import { formatNumber } from '@/shared/lib/formatters'; // Используем тот же форматер

interface Props {
  total: number;
  companies: Record<string, number>;
}

export default function StatsSummary({ total, companies }: Props) {
  const top5 = Object.entries(companies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    // 1. Применяем стиль контейнера от ResultCard: белый фон, тень, рамка
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      
      {/* Основной показатель */}
      <p className="text-gray-800">
        Обработано вакансий: 
        <span className="ml-2 text-lg font-bold text-blue-600">{formatNumber(total)}</span>
      </p>

      {/* 2. Добавляем разделитель и контейнер для списка, как в ResultCard */}
      {top5.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <h3 className="font-semibold mb-2">Топ-5 компаний по вакансиям:</h3>
          
          {/* 3. Улучшаем стилизацию списка для лучшей читаемости */}
          <ul className="space-y-1.5 text-sm">
            {top5.map(([name, cnt]) => (
              <li key={name} className="flex justify-between items-center">
                <span className="text-gray-700">{name}</span>
                <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded-md">
                  {formatNumber(cnt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}