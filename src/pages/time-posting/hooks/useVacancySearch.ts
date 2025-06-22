import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { API } from '../lib/constants';
// Импортируем наш новый тип для полного ответа
import { RawApiResponse } from '../lib/types';

export const useVacancySearch = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // --- ИЗМЕНЕНИЕ №1: Состояние теперь хранит весь объект ответа или null ---
    const [apiResponse, setApiResponse] = useState<RawApiResponse | null>(null);

    const search = useCallback(async (job: string, city: string, fly: boolean) => {
        setLoading(true);
        setError(null);
        // Сбрасываем состояние
        setApiResponse(null);

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Не удалось получить сессию. Пожалуйста, войдите в систему.');
            }
            
            const url = new URL(API);
            url.pathname = '/api/hh-stats';
            url.searchParams.set('job', job);
            url.searchParams.set('city', city);
            if (fly) url.searchParams.set('fly', '1');
            
            const res = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || `Ошибка сервера: ${res.statusText}`);
            }
            
            const result = await res.json();
            // --- ИЗМЕНЕНИЕ №2: Сохраняем ВЕСЬ результат, а не только его часть ---
            setApiResponse(result);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- ИЗМЕНЕНИЕ №3: Возвращаем новый объект состояния ---
    return { loading, error, apiResponse, search };
};