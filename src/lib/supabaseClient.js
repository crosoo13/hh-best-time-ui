import { createClient } from '@supabase/supabase-js'

// Вместо прямого указания ключей, мы берем их из "переменных окружения",
// которые Vite подставляет из вашего файла .env во время сборки.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Небольшая проверка, чтобы убедиться, что ключи загрузились правильно
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check your .env file.");
}

// Создаем и экспортируем клиент, как и раньше
export const supabase = createClient(supabaseUrl, supabaseKey)