// src/pages/market-analysis/components/FilterSlider.tsx

import * as Slider from '@radix-ui/react-slider';
import { formatNumber } from '@/shared/lib/formatters';

interface Props {
  title: string;
  unit: string;
  range: [number, number];
  min: number; // <-- Новый prop для минимального значения
  max: number;
  color: string;
  onChange: (newRange: [number, number]) => void;
}

export default function FilterSlider({ title, unit, range, min, max, color, onChange }: Props) {
  if (max <= min) {
    return null; 
  }

  return (
    <div className="p-4 pt-2">
      <div className='text-sm font-medium text-gray-600 mb-4'>
        {title}: <span className='font-bold text-black'>{formatNumber(range[0])} - {formatNumber(range[1])} {unit}</span>
      </div>
      
      {/* --- ИЗМЕНЕНИЕ: Добавляем отступы для синхронизации с графиком --- */}
      <div className="pl-[45px] pr-[30px]">
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={range}
          onValueChange={onChange}
          min={min} // <-- Используем динамический min
          max={max}
          step={1}
          minStepsBetweenThumbs={1}
        >
          <Slider.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
            <Slider.Range 
              className="absolute rounded-full h-full" 
              style={{ backgroundColor: color }}
            />
          </Slider.Track>
          <Slider.Thumb 
            className="block w-4 h-4 bg-white shadow-md rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 ring-opacity-75"
            style={{ borderColor: color, ringColor: color }} 
            aria-label="Нижняя граница" 
          />
          <Slider.Thumb 
            className="block w-4 h-4 bg-white shadow-md rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 ring-opacity-75"
            style={{ borderColor: color, ringColor: color }} 
            aria-label="Верхняя граница"
          />
        </Slider.Root>
      </div>
    </div>
  );
}