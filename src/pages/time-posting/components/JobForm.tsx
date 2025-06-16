import React, { FormEvent } from 'react';
import HhAutocomplete from '@/shared/ui/HhAutocomplete';

interface Props {
  job: string;
  city: string;
  fly: boolean;
  loading: boolean;
  onChange: (field: 'job' | 'city' | 'fly', value: string | boolean) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function JobForm({ job, city, fly, loading, onChange, onSubmit }: Props) {
  return (
    // Возвращаем белый фон, тень и отступы, которые вам нравились
    <form onSubmit={onSubmit} className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
        {/* Передаем disabled={loading} в компоненты */}
        <div className="md:col-span-4">
          <HhAutocomplete
            label="Профессия"
            value={job}
            type="position"
            onChange={val => onChange('job', val)}
            disabled={loading}
          />
        </div>

        <div className="md:col-span-6">
          <HhAutocomplete
            label="Город/Регион"
            value={city}
            type="area"
            onChange={val => onChange('city', val)}
            disabled={loading}
          />
        </div>

        <div className="md:col-span-2">
          {/* Используем новые стили для кнопки */}
          <button
            type="submit"
            disabled={loading || !job}
            className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Загрузка...' : 'Показать'}
          </button>
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={fly}
            onChange={e => onChange('fly', e.target.checked)}
            disabled={loading} // Блокируем и чекбокс во время загрузки
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">Вахта</span>
        </label>
      </div>
    </form>
  );
}