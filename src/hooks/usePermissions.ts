import { useAuth } from './useAuth';

export type Role = 'super_admin' | 'company_admin' | 'company_user' | 'company';

export type Permission =
  | 'dashboard.view'
  | 'dashboard.manage'
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.update'
  | 'invoices.delete'
  | 'invoices.approve'
  | 'parties.view'
  | 'parties.create'
  | 'parties.update'
  | 'parties.delete'
  | 'products.view'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'erp.view'
  | 'erp.create'
  | 'erp.update'
  | 'erp.delete'
  | 'erp.sync'
  | 'firs.view'
  | 'firs.configure'
  | 'firs.generate_irn'
  | 'firs.validate'
  | 'firs.submit'
  | 'settings.view'
  | 'settings.manage'
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'reports.view'
  | 'reports.export'
  | 'services.manage'; // super_admin only

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    '*', // All permissions
  ],
  company_admin: [
    'dashboard.view',
    'dashboard.manage',
    'invoices.view',
    'invoices.create',
    'invoices.update',
    'invoices.delete',
    'invoices.approve',
    'parties.view',
    'parties.create',
    'parties.update',
    'parties.delete',
    'products.view',
    'products.create',
    'products.update',
    'products.delete',
    'erp.view',
    'erp.create',
    'erp.update',
    'erp.delete',
    'erp.sync',
    'firs.view',
    'firs.configure',
    'firs.generate_irn',
    'firs.validate',
    'firs.submit',
    'settings.view',
    'settings.manage',
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'reports.view',
    'reports.export',
  ],
  company_user: [
    'dashboard.view',
    'invoices.view',
    'parties.view',
    'products.view',
    'erp.view',
    'firs.view',
    'reports.view',
  ],
  company: [
    // Company entity has same permissions as company_admin
    'dashboard.view',
    'dashboard.manage',
    'invoices.view',
    'invoices.create',
    'invoices.update',
    'invoices.delete',
    'invoices.approve',
    'parties.view',
    'parties.create',
    'parties.update',
    'parties.delete',
    'products.view',
    'products.create',
    'products.update',
    'products.delete',
    'erp.view',
    'erp.create',
    'erp.update',
    'erp.delete',
    'erp.sync',
    'firs.view',
    'firs.configure',
    'firs.generate_irn',
    'firs.validate',
    'firs.submit',
    'settings.view',
    'settings.manage',
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'reports.view',
    'reports.export',
  ],
};

export const usePermissions = () => {
  const { user } = useAuth();

  /**
   * Get user's roles
   */
  const getRoles = (): Role[] => {
    if (!user?.roles) return [];
    return user.roles as Role[];
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: Role): boolean => {
    const roles = getRoles();
    return roles.includes(role);
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (...roles: Role[]): boolean => {
    const userRoles = getRoles();
    return roles.some((role) => userRoles.includes(role));
  };

  /**
   * Check if user has all of the specified roles
   */
  const hasAllRoles = (...roles: Role[]): boolean => {
    const userRoles = getRoles();
    return roles.every((role) => userRoles.includes(role));
  };

  /**
   * Get all permissions for the user
   */
  const getPermissions = (): Permission[] => {
    const roles = getRoles();
    const permissions = new Set<Permission>();

    // Collect all permissions from all roles
    const allPermissions: Permission[] = [];
    Object.values(ROLE_PERMISSIONS).forEach((rolePerms) => {
      rolePerms.forEach((perm) => {
        if (perm !== '*') {
          allPermissions.push(perm);
        }
      });
    });

    roles.forEach((role) => {
      const rolePerms = ROLE_PERMISSIONS[role] || [];
      rolePerms.forEach((perm) => {
        if (perm === '*') {
          // Super admin has all permissions
          allPermissions.forEach((p) => permissions.add(p));
        } else {
          permissions.add(perm);
        }
      });
    });

    return Array.from(permissions);
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    const permissions = getPermissions();
    return permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (...permissions: Permission[]): boolean => {
    const userPermissions = getPermissions();
    return permissions.some((perm) => userPermissions.includes(perm));
  };

  /**
   * Check if user can perform write operations (create, update, delete)
   */
  const canWrite = (): boolean => {
    return hasAnyRole('super_admin', 'company_admin', 'company');
  };

  /**
   * Check if user can manage settings
   */
  const canManageSettings = (): boolean => {
    return hasAnyPermission('settings.manage', '*');
  };

  /**
   * Check if user can manage ERP
   */
  const canManageERP = (): boolean => {
    return hasAnyPermission('erp.create', 'erp.update', 'erp.delete', '*');
  };

  /**
   * Check if user can manage FIRS
   */
  const canManageFIRS = (): boolean => {
    return hasAnyPermission('firs.configure', '*');
  };

  /**
   * Check if user can manage users
   */
  const canManageUsers = (): boolean => {
    return hasAnyPermission('users.create', 'users.update', 'users.delete', '*');
  };

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin');
  };

  /**
   * Check if user is company admin or company entity
   */
  const isCompanyAdmin = (): boolean => {
    return hasAnyRole('company_admin', 'company');
  };

  /**
   * Check if user is regular company user (read-only)
   */
  const isCompanyUser = (): boolean => {
    return hasRole('company_user');
  };

  return {
    getRoles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getPermissions,
    hasPermission,
    hasAnyPermission,
    canWrite,
    canManageSettings,
    canManageERP,
    canManageFIRS,
    canManageUsers,
    isSuperAdmin,
    isCompanyAdmin,
    isCompanyUser,
  };
};

