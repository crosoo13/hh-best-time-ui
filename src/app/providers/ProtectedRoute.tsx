import React from 'react';
import { Navigate } from 'react-router-dom';
// ПРАВИЛЬНЫЙ ПУТЬ: из src/app/providers/ поднимаемся на два уровня до src/
import { useAuth } from '../../AuthContext.tsx'; 

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session } = useAuth();

  if (!session) {
    // Если сессии нет, перенаправляем на страницу логина
    return <Navigate to="/login" replace />;
  }

  // Если сессия есть, рендерим дочерний компонент (Layout)
  return children;
};

export default ProtectedRoute;