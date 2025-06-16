import React, { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'

interface Props {
  label: string
  value: string
  type: 'position' | 'area'
  onChange: (value: string) => void
}

export default function HhAutocomplete({ label, value, type, onChange }: Props) {
  const [debouncedValue] = useDebounce(value, 300)
  const [options, setOptions] = useState<string[]>([])
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    if (!debouncedValue.trim()) {
      setOptions([])
      return
    }

    const fetchSuggestions = async () => {
      let url = ''

      if (type === 'position') {
        url = `https://api.hh.ru/vacancies?text=${encodeURIComponent(debouncedValue)}&per_page=20`
      } else if (type === 'area') {
        url = `https://api.hh.ru/suggests/areas?text=${encodeURIComponent(debouncedValue)}`
      }

      try {
        const res = await fetch(url)
        const json = await res.json()

        let items: string[] =
          type === 'position'
            ? [...new Set(json.items?.map((item: any) => item.name))]
            : json.items?.map((item: any) => item.text)

        // Фильтруем по startsWith
        items = (items || []).filter((item: string) =>
          item.toLowerCase().startsWith(debouncedValue.toLowerCase())
        )

        setOptions(items)
      } catch (err) {
        console.error('Ошибка при загрузке подсказок HH:', err)
        setOptions([])
      }
    }

    fetchSuggestions()
  }, [debouncedValue, type])

  return (
    <div className="relative">
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value)
          setShowList(true)
        }}
        onBlur={() => setTimeout(() => setShowList(false), 100)}
        placeholder={`Введите ${label.toLowerCase()}`}
        className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring focus:border-indigo-300"
      />
      {showList && options.length > 0 && (
        <ul className="absolute z-[1000] w-full bg-white border mt-1 rounded shadow-lg max-h-60 overflow-auto">
          {options.map(opt => (
            <li
              key={opt}
              className="px-3 py-2 hover:bg-indigo-100 cursor-pointer text-sm"
              onClick={() => {
                onChange(opt)
                setShowList(false)
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
