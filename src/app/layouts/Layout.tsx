import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext'; // Убедитесь, что путь верный

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen p-4 space-x-4">
      
      <aside className="w-64 flex-shrink-0 bg-slate-100 rounded-xl shadow-lg overflow-hidden sticky top-4 h-[calc(100vh-2rem)]">
        <div className="flex flex-col h-full">
          
          <div className="px-6 py-5 border-b border-slate-200">
            <img 
              src="/logo.png" 
              alt="HRvision Logo" 
              className="w-full h-auto" 
            />
          </div>

          <nav className="flex-1 p-4 space-y-2 mt-4">
            {/* --- Активные ссылки --- */}
            <NavLink
              to="/market-analysis"
              className={({ isActive }) =>
                `block px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`
              }
            >
              {/* --- ИЗМЕНЕНО --- */}
              Рынок
            </NavLink>
            <NavLink
              to="/time-posting"
              className={({ isActive }) =>
                `block px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`
              }
            >
              {/* --- ИЗМЕНЕНО --- */}
              Время публикаций
            </NavLink>

            {/* --- Неактивные пункты меню --- */}
            
            {/* Отклики */}
            <div className="relative group">
              <div className="block px-4 py-2.5 text-sm font-semibold rounded-lg text-slate-400 cursor-not-allowed">
                {/* --- ИЗМЕНЕНО --- */}
                Отклики
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-slate-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Скоро
              </div>
            </div>

            {/* Конкуренты */}
            <div className="relative group">
              <div className="block px-4 py-2.5 text-sm font-semibold rounded-lg text-slate-400 cursor-not-allowed">
                {/* --- ИЗМЕНЕНО --- */}
                Конкуренты
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-slate-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Скоро
              </div>
            </div>
            
            {/* --- ДОБАВЛЕНО: Новый неактивный пункт "Авито Рынок" --- */}
            <div className="relative group">
              <div className="block px-4 py-2.5 text-sm font-semibold rounded-lg text-slate-400 cursor-not-allowed">
                Авито Рынок
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-slate-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Скоро
              </div>
            </div>

            {/* AI агент (остается в конце) */}
            <div className="relative group">
              <div className="block px-4 py-2.5 text-sm font-semibold rounded-lg text-slate-400 cursor-not-allowed">
                AI агент
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-slate-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Скоро
              </div>
            </div>
          </nav>
          
          <div className="mt-auto p-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700 truncate" title={user?.email}>
                {user?.email}
              </div>
              <div className="flex items-center space-x-2">
                <NavLink to="/settings" title="Настройки">
                  <svg className="w-5 h-5 text-slate-500 hover:text-slate-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </NavLink>
                <button onClick={handleSignOut} title="Выйти">
                  <svg className="w-5 h-5 text-slate-500 hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-100 rounded-xl shadow-lg p-6">
        <Outlet />
      </main>
      
    </div>
  );
}