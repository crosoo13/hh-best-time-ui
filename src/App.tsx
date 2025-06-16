import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./app/layouts/Layout.tsx"; 
import ProtectedRoute from "./app/providers/ProtectedRoute.tsx";
import LoginPage from "./pages/login/LoginPage.tsx";

import TimePostingPage from './pages/time-posting/ui/TimePostingPage.tsx';
import MarketPage from './pages/market-analysis/ui/MarketPage.tsx';
import SettingsPage from './pages/settings/SettingsPage.tsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* --- ВОТ ИЗМЕНЕНИЕ --- */}
        {/* Теперь по умолчанию перенаправляем на страницу анализа рынка */}
        <Route index element={<Navigate to="/market-analysis" replace />} />
        
        {/* Все остальные маршруты остаются без изменений */}
        <Route path="time-posting" element={<TimePostingPage />} />
        <Route path="market-analysis" element={<MarketPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        <Route path="*" element={<div>Страница не найдена</div>} />
      </Route>
    </Routes>
  );
}

export default App;