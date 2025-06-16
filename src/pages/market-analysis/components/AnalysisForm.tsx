import { FormEvent } from 'react';
// Импортируем наш общий компонент для полей с подсказками
import HhAutocomplete from '@/shared/ui/HhAutocomplete';

type AnalysisFormProps = {
  profession: string;
  location: string;
  loading: boolean;
  onProfessionChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function AnalysisForm({
  profession,
  location,
  loading,
  onProfessionChange,
  onLocationChange,
  onSubmit,
}: AnalysisFormProps) {
  return (
    // Применяем точный стиль от другой формы: белый фон, тень, отступы
    <form onSubmit={onSubmit} className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md">
      
      {/* Используем ту же 12-колоночную сетку с теми же пропорциями */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
        {/* Поле "Профессия" - занимает 4 из 12 колонок */}
        <div className="md:col-span-4">
          <HhAutocomplete
            label="Профессия"
            value={profession}
            type="position"
            onChange={onProfessionChange}
            disabled={loading}
          />
        </div>

        {/* Поле "Регион" - занимает 6 из 12 колонок */}
        <div className="md:col-span-6">
          <HhAutocomplete
            label="Город/Регион/Россия"
            value={location}
            type="area"
            onChange={onLocationChange}
            disabled={loading}
          />
        </div>

        {/* Кнопка "Показать" - занимает 2 из 12 колонок */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading || !profession} // Блокируем, если нет профессии
            className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Загрузка...' : 'Показать'}
          </button>
        </div>
      </div>
      
      {/* Пустое место, где на другой форме был чекбокс. Здесь ничего нет. */}
    </form>
  );
}