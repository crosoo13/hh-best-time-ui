import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { ApiResponse } from '../model/types';

const API_BASE_URL = 'https://api.hrvision.ru';

export function useAnalysisRequest() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [data,    setData]    = useState<ApiResponse | null>(null);

  /** Периодически спрашиваем бек-энд, готов ли результат */
  const pollForResult = (jobId: string) => {
    const RESULT_URL       = `${API_BASE_URL}/hh/result/${jobId}`;
    const POLLING_INTERVAL = 5_000;  // 5 с
    const MAX_ATTEMPTS     = 60;     // ~5 минут

    let attempts = 0;
    const id = setInterval(async () => {
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(id);
        setError('Не удалось получить результат вовремя. Попробуйте снова.');
        setLoading(false);
        return;
      }

      try {
        const resp = await fetch(RESULT_URL);
        if (!resp.ok) throw new Error('Ошибка при получении результата.');

        const result: ApiResponse = await resp.json();
        if (result?.results?.length) {
          clearInterval(id);
          setData(result);
          setLoading(false);
        } else {
          attempts += 1;
        }
      } catch (e: any) {
        clearInterval(id);
        setError(e.message);
        setLoading(false);
      }
    }, POLLING_INTERVAL);
  };

  /** Запуск расчёта */
  const start = async (profession: string, location: string) => {
    if (!profession || !location) {
      setError('Пожалуйста, заполните оба поля: Профессия и Регион.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    const API_URL      = `${API_BASE_URL}/hh/analyze`;
    const requestBody  = [
      { name: profession, schedule: 'fullDay',  locations: [location] },
      { name: profession, schedule: 'rotation', locations: [location] },
    ];

    try {
      const resp = await fetch(API_URL, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(requestBody),
      });
      if (!resp.ok) throw new Error(`Ошибка сети: ${resp.statusText}`);

      const { job_id } = await resp.json();
      if (!job_id) throw new Error('Не удалось получить ID задачи от сервера.');

      /* логируем запрос в Supabase */
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('analysis_requests')
          .insert({ user_id: user.id, query_details: { profession, location } });
      }

      pollForResult(job_id);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return { loading, error, data, start, setError }; // setError пригодится, если нужно обнулять снаружи
}
