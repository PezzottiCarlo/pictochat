// ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useIsSetting, useIsAuthenticated } from '../context/SessionContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const isSetting = useIsSetting();

  console.log("Authentication",isAuthenticated,isSetting)

  if(!isSetting){
    return <Navigate to="/settings"/>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;