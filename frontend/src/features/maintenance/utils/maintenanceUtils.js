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

export const canStart = (status) => ['scheduled', 'overdue'].includes(status);
export const canComplete = (status) => status === 'in_progress';
export const canEdit = (status) => !['completed', 'in_progress'].includes(status);
export const canDelete = (status) => !['completed', 'in_progress'].includes(status);
