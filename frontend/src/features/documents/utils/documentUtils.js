export const DOCUMENT_ENTITY_TYPES = {
  VEHICLE: 'vehicle',
  DRIVER: 'driver',
  FLEET: 'fleet',
};

export const DOCUMENT_STATUS = {
  ACTIVE: 'active',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
};

export const documentTypeLabels = {
  insurance: 'Insurance',
  registration: 'Registration',
  fitness: 'Fitness Certificate',
  emission: 'Emission Certificate',
  permit: 'Permit',
  license: 'License',
  medical: 'Medical Certificate',
  contract: 'Contract',
  other: 'Other',
};

export const entityTypeLabels = {
  vehicle: 'Vehicle',
  driver: 'Driver',
  fleet: 'Fleet',
};

export const statusColors = {
  active: 'success',
  expiring_soon: 'warning',
  expired: 'error',
  archived: 'default',
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDaysUntilExpiry = (days) => {
  if (days === null || days === undefined) return 'No expiry';
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  return `${days}d remaining`;
};
