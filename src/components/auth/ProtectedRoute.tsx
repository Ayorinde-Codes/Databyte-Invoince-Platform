import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Role, Permission } from '@/hooks/usePermissions';
import { LoadingPage } from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  allowedPermissions?: Permission[];
  requireAll?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  allowedPermissions = [],
  requireAll = false,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, isLoading, requiresPasswordChange } = useAuth();
  const {
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasPermission,
  } = usePermissions();
  const location = useLocation();
  const pathname = location.pathname;

  // Show loading state
  if (isLoading) {
    return <LoadingPage message="Checking authentication..." />;
  }

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Require password change: redirect to change-password page until they change it
  if (requiresPasswordChange && pathname !== '/dashboard/change-password') {
    return <Navigate to="/dashboard/change-password" replace />;
  }

  // Check role/permission access
  let hasAccess = false;

  if (allowedRoles.length > 0) {
    hasAccess = requireAll
      ? hasAllRoles(...allowedRoles)
      : hasAnyRole(...allowedRoles);
  }

  if (allowedPermissions.length > 0) {
    const hasPerms = requireAll
      ? allowedPermissions.every((perm) => hasPermission(perm))
      : hasAnyPermission(...allowedPermissions);

    if (allowedRoles.length > 0) {
      hasAccess = hasAccess && hasPerms;
    } else {
      hasAccess = hasPerms;
    }
  }

  // If no restrictions, allow access
  if (allowedRoles.length === 0 && allowedPermissions.length === 0) {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

