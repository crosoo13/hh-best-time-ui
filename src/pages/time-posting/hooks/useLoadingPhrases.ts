import { useState, useEffect } from 'react';

const LOADING_PHRASES = [
 'Сканируем страницы с результатами...',
  'Собираем данные о времени публикаций...',
  'Группируем вакансии по дням недели...',
  'Анализируем пики активности по часам...',
  'Отслеживаем обновления объявлений (bump)...',
  'Подсчитываем общее количество вакансий...',
  'Формируем графики активности...',
  'Ещё немного, готовим итоговую сводку...'
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