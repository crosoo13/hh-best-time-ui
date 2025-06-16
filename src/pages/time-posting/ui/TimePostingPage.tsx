import React, { useState, FormEvent, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import JobForm from '../components/JobForm';
import StatsSummary from '../components/StatsSummary';
import Charts from '../components/Charts';
import BumpChart from '../components/BumpChart';
import { API, weekFull, weekShort } from '../lib/constants';
import { useLoadingPhrases } from '../hooks/useLoadingPhrases';

export default function TimePostingPage() {
  const [job, setJob] = useState('');
  const [city, setCity] = useState('');
  const [fly, setFly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadingText = useLoadingPhrases(loading);

  useEffect(() => {
    console.log('*** API data:', data);
  }, [data]);

  const handleChange = (field: string, value: any) => {
    if (field === 'job') setJob(value);
    if (field === 'city') setCity(value);
    if (field === 'fly') setFly(value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const url = new URL(API);
      url.searchParams.set('job', job);
      url.searchParams.set('city', city);
      if (fly) url.searchParams.set('fly', '1');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(await res.text() || res.statusText);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: logError } = await supabase
          .from('analysis_requests')
          .insert({
            user_id: user.id,
            query_details: {
              request_type: 'time_posting',
              job: job,
              city: city,
              fly: fly
            }
          });
        if (logError) {
          console.error('Ошибка логирования запроса (TimePosting):', logError.message);
        }
      }

      const json = await res.json();
      const jsonWithFallback = { ...json, bumpDates: json.bumpDates || {} };
      setData(jsonWithFallback);
    } catch (err: any)
    {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container mx-auto p-4 space-y-8">
      
      <JobForm
        job={job}
        city={city}
        fly={fly}
        loading={loading}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      {error && <div className="text-center p-4 text-red-600 bg-red-100 rounded-lg">{error}</div>}

      {loading && (
        <div className="flex items-center justify-center py-8 space-x-4">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg text-gray-600 font-medium">{loadingText}</span>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-8">
          
          {(typeof data.total === 'number' && data.companies) && (
            <StatsSummary total={data.total} companies={data.companies} />
          )}

          {(data.days && data.hours) && (
            <Charts
              days={data.days}
              hours={data.hours}
              weekFull={weekFull}
              weekShort={weekShort}
            />
          )}

          {data.bumpDates && (
            <BumpChart bumpDates={data.bumpDates} />
          )}
          
        </div>
      )}
    </div>
  );
}