import { useState, useEffect } from 'react';

const LOADING_PHRASES = [
  'Анализируем вакансии...',
  'Сопоставляем данные по регионам...',
  'Вычисляем медианные зарплаты...',
  'Ищем аномалии в часовых ставках...',
  'Группируем компании по графикам...',
  'Фильтруем нерелевантные предложения...', // Новая
  'Нормализуем диапазоны зарплат...', // Новая
  'Агрегируем данные по работодателям...', // Новая
  'Строим кривые распределения...',
  'Калибруем статистические модели...', // Новая
  'Ещё мгновение, визуализируем результаты...', // Новая
  'Почти готово, финализируем отчёт...'
];

/**
 * Кастомный хук для управления сменой фраз во время загрузки.
 * @param loading - Булево значение, активна ли загрузка.
 * @returns - Текущую строку для отображения.
 */
export function useLoadingPhrases(loading: boolean): string {
  const [loadingText, setLoadingText] = useState(LOADING_PHRASES[0]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (loading) {
      // Устанавливаем первую фразу сразу
      setLoadingText(LOADING_PHRASES[0]);
      // Запускаем интервал для смены фраз каждые 2 секунды
      intervalId = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * LOADING_PHRASES.length);
        setLoadingText(LOADING_PHRASES[randomIndex]);
      }, 2000);
    }
    // Очищаем интервал, когда загрузка заканчивается или компонент размонтируется
    return () => clearInterval(intervalId);
  }, [loading]);

  return loadingText;
}