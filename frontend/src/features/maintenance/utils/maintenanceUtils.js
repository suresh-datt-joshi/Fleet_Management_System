export const MAINTENANCE_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
};

export const MAINTENANCE_TYPE = {
  PREVENTIVE: 'preventive',
  REPAIR: 'repair',
  INSPECTION: 'inspection',
};

export const MAINTENANCE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const statusColors = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  overdue: 'error',
};

export const priorityColors = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};

export const typeLabels = {
  preventive: 'Preventive',
  repair: 'Repair',
  inspection: 'Inspection',
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

export const statusLabels = {
  scheduled: 'Pending',
  overdue: 'Overdue',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const getStatusLabel = (status) => statusLabels[status] || status?.replace('_', ' ') || '—';

export const canStart = (status) => ['scheduled', 'overdue'].includes(status);
export const canComplete = (status) => status === 'in_progress';
export const canUpdateProgress = (status) => status === 'in_progress';
export const canEdit = (status) => !['completed', 'in_progress'].includes(status);
export const canDelete = (status, isAdmin = false) => {
  if (isAdmin) return true;
  return !['completed', 'in_progress'].includes(status);
};

export const getMechanicNames = (record) => {
  if (record?.assignedMechanics?.length) {
    return record.assignedMechanics.map((m) => m.name).join(', ');
  }
  return record?.assignedMechanic?.name || 'Unassigned';
};

export const getAssignedMechanics = (record) => {
  if (record?.assignedMechanics?.length) {
    return record.assignedMechanics;
  }
  if (record?.assignedMechanic) {
    return [record.assignedMechanic];
  }
  return [];
};

export const isMaintenanceAssigned = (record) => getAssignedMechanics(record).length > 0;

export const canActOnWorkOrder = (record, user, canManage) => {
  if (!canManage || !record) return false;
  if (!user || user.role !== 'mechanic') return true;

  const userId = user.id || user._id;
  const assignedIds = [
    ...(record.assignedMechanics || []).map((m) => m.id),
    record.assignedMechanic?.id,
  ].filter(Boolean);

  return assignedIds.includes(userId);
};
