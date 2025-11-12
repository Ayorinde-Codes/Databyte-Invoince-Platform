import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Role, Permission } from '@/hooks/usePermissions';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  allowedPermissions?: Permission[];
  requireAll?: boolean; // If true, requires ALL roles/permissions; if false, requires ANY
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles = [],
  allowedPermissions = [],
  requireAll = false,
  fallback = null,
  showError = false,
}) => {
  const {
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasPermission,
  } = usePermissions();

  let hasAccess = false;

  // Check roles
  if (allowedRoles.length > 0) {
    hasAccess = requireAll
      ? hasAllRoles(...allowedRoles)
      : hasAnyRole(...allowedRoles);
  }

  // Check permissions
  if (allowedPermissions.length > 0) {
    const hasPerms = requireAll
      ? allowedPermissions.every((perm) => hasPermission(perm))
      : hasAnyPermission(...allowedPermissions);

    // If both roles and permissions are specified, user needs both
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
    if (showError) {
      return (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">
            You don't have permission to access this content.
          </p>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

