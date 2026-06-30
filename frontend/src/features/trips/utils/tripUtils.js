export const TRIP_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  PENDING_DISPATCHER_REVIEW: 'pending_dispatcher_review',
  REVIEWED: 'reviewed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const FINANCIALLY_CLOSED_TRIP_STATUSES = [TRIP_STATUS.REVIEWED, TRIP_STATUS.COMPLETED];

export const statusColors = {
  scheduled: 'info',
  in_progress: 'warning',
  pending_dispatcher_review: 'secondary',
  reviewed: 'success',
  completed: 'success',
  cancelled: 'default',
};

export const statusLabels = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  pending_dispatcher_review: 'Pending Review',
  reviewed: 'Reviewed / Closed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

export const formatDistance = (km) => (km ? `${km} km` : '—');

export const canStart = (status) => status === TRIP_STATUS.SCHEDULED;
export const canComplete = (status) => status === TRIP_STATUS.IN_PROGRESS;
export const canReview = (status) => status === TRIP_STATUS.PENDING_DISPATCHER_REVIEW;
export const canCancel = (status) => [TRIP_STATUS.SCHEDULED, TRIP_STATUS.IN_PROGRESS].includes(status);
export const canEdit = (status) => status === TRIP_STATUS.SCHEDULED;
export const canDelete = (status) =>
  [TRIP_STATUS.SCHEDULED, TRIP_STATUS.CANCELLED, TRIP_STATUS.REVIEWED, TRIP_STATUS.COMPLETED].includes(status);

export const formatLocation = (loc) => {
  if (!loc?.address) return '—';
  return loc.address;
};

export const expenseCategoryLabels = {
  fuel: 'Fuel / Refill',
  food: 'Food',
  toll: 'Toll',
  lodging: 'Lodging',
  other: 'Other',
};

export const reviewExpenseFields = [
  { key: 'fuel', label: 'Fuel' },
  { key: 'tolls', label: 'Tolls' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'food', label: 'Food' },
  { key: 'lodging', label: 'Lodging' },
  { key: 'other', label: 'Other' },
];

export const defaultExpenseBreakdown = () => ({
  fuel: 0,
  tolls: 0,
  maintenance: 0,
  food: 0,
  lodging: 0,
  other: 0,
});

export const sumExpenseBreakdown = (breakdown = {}) => {
  const values = reviewExpenseFields.map(({ key }) => Number(breakdown[key]) || 0);
  return Math.round(values.reduce((sum, v) => sum + v, 0) * 100) / 100;
};

export const buildBreakdownFromDriverExpenses = (byCategory = {}) => ({
  fuel: byCategory.fuel || 0,
  tolls: byCategory.toll || 0,
  maintenance: 0,
  food: byCategory.food || 0,
  lodging: byCategory.lodging || 0,
  other: byCategory.other || 0,
});

export const consignmentStatusLabels = {
  pending: 'Pending',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  partial: 'Partial Delivery',
  failed: 'Failed',
};

export const consignmentStatusColors = {
  pending: 'default',
  picked_up: 'info',
  in_transit: 'warning',
  delivered: 'success',
  partial: 'warning',
  failed: 'error',
};

export const consignmentStatusOrder = [
  'picked_up',
  'in_transit',
  'delivered',
  'partial',
  'failed',
];
