import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const PermissionRoute = ({ children, permission, anyPermission }) => {
  const { hasPermission, hasAnyPermission } = usePermissions();

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (anyPermission && !hasAnyPermission(...anyPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PermissionRoute;
