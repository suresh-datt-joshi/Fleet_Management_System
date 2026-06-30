import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { permissions, user } = useAuth();

  const hasPermission = (permission) => permissions.includes(permission);

  const hasAnyPermission = (...perms) => perms.some((p) => permissions.includes(p));

  const hasAllPermissions = (...perms) => perms.every((p) => permissions.includes(p));

  const hasRole = (...roles) => roles.includes(user?.role);

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions, hasRole };
};

export default usePermissions;
