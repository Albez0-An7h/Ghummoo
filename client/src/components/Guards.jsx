import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Spinner } from './ui';

export function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="pt-32"><Spinner /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
