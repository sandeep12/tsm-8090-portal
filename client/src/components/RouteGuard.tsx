import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

type RouteGuardProps = {
  children: ReactNode;
  /** When true, only Administrator role may proceed. */
  requireAdmin?: boolean;
};

/**
 * Client-side route guard (usability layer only — server still enforces authz).
 */
export function RouteGuard({ children, requireAdmin = false }: RouteGuardProps) {
  const { isAuthenticated, isAdministrator } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin && !isAdministrator) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
