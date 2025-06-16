import React, { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

// Единый интерфейс для всех видов подсказок от hh.ru
interface SuggestionItem {
  text: string;
}

interface SuggestionResponse {
  items: SuggestionItem[];
}

// Пропсы (свойства) компонента
interface Props {
  label: string;
  value: string;
  type: 'position' | 'area'; // Тип подсказок: 'должность' или 'город'
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function HhAutocomplete({ label, value, type, onChange, disabled = false }: Props) {
  // Задерживаем реакцию на ввод на 300 мс, чтобы не отправлять запрос на каждую букву
  const [debouncedValue] = useDebounce(value, 300); 
  
  // Состояние для хранения списка подсказок
  const [options, setOptions] = useState<string[]>([]);
  
  // Состояние для отображения/скрытия списка
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    // Создаем AbortController для возможности отмены запроса при новом вводе
    const controller = new AbortController();

    const fetchSuggestions = async () => {
      const trimmedValue = debouncedValue.trim();

      // 1. УЛУЧШЕНИЕ: Запрос отправляется только для строк длиной 3 и более символов
      if (trimmedValue.length < 3) {
        setOptions([]);
        return;
      }

      const encodedText = encodeURIComponent(trimmedValue);
      let url = '';

      if (type === 'position') {
        url = `https://api.hh.ru/suggests/vacancy_search_keyword?text=${encodedText}`;
      } else {
        url = `https://api.hh.ru/suggests/areas?text=${encodedText}`;
      }

      try {
        // Передаем сигнал от AbortController в fetch, чтобы иметь возможность отменить запрос
        const response = await fetch(url, { signal: controller.signal });
        
        if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
        
        const data: SuggestionResponse = await response.json();
        const suggestionTexts = data.items?.map(item => item.text) || [];
        setOptions(suggestionTexts);

      } catch (error: any) {
        // Если ошибка - это отмена запроса (AbortError), то это нормальное поведение.
        // Мы не будем засорять консоль этим сообщением.
        if (error.name === 'AbortError') {
          console.log('Предыдущий запрос на подсказки был отменен');
          return;
        }
        // Выводим в консоль только настоящие ошибки
        console.error("Ошибка при загрузке подсказок:", error);
        setOptions([]);
      }
    };

    fetchSuggestions();

    // 2. УЛУЧШЕНИЕ: Функция очистки, которая отменяет предыдущий запрос
    // React вызывает ее ПЕРЕД следующим запуском этого useEffect или при удалении компонента.
    return () => {
      controller.abort();
    };
  }, [debouncedValue, type]); // Эффект перезапускается, только когда меняется debouncedValue или type

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => {
          if (disabled) return;
          onChange(e.target.value);
          setShowList(true);
        }}
        onFocus={() => {
          if (value && options.length > 0) setShowList(true);
        }}
        // Скрываем список с небольшой задержкой, чтобы успел сработать клик по элементу
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        disabled={disabled}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        autoComplete="off"
      />
      
      {showList && options.length > 0 && !disabled && (
        <ul className="absolute z-[1000] w-full bg-white border mt-1 rounded shadow-lg max-h-60 overflow-auto">
          {options.map((opt, index) => (
            <li
              key={`${opt}-${index}`}
              className="px-3 py-2 hover:bg-indigo-100 cursor-pointer text-sm"
              // Используем onMouseDown вместо onClick, так как он срабатывает до onBlur инпута
              onMouseDown={() => {
                onChange(opt);
                setShowList(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}