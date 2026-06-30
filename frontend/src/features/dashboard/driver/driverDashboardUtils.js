import { isToday, isAfter, startOfDay, subDays } from 'date-fns';
import { TRIP_STATUS } from '../../../constants';

export const DRIVER_TRIP_STATUS_LABELS = {
  scheduled: 'Assigned',
  in_progress: 'In Progress',
  pending_dispatcher_review: 'Completed',
  reviewed: 'Completed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const DRIVER_TRIP_STATUS_COLORS = {
  scheduled: 'info',
  in_progress: 'warning',
  pending_dispatcher_review: 'success',
  reviewed: 'success',
  completed: 'success',
  cancelled: 'default',
};

export const COMPLETED_TRIP_STATUSES = [
  TRIP_STATUS.PENDING_DISPATCHER_REVIEW,
  TRIP_STATUS.REVIEWED,
  TRIP_STATUS.COMPLETED,
];

export const groupDriverTrips = (trips = [], activeTrip = null) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekAgo = subDays(now, 7);

  const active = activeTrip ? [activeTrip] : trips.filter((t) => t.status === TRIP_STATUS.IN_PROGRESS);
  const assigned = trips.filter((t) => t.status === TRIP_STATUS.SCHEDULED);
  const todaySchedule = assigned.filter((t) => t.scheduledAt && isToday(new Date(t.scheduledAt)));
  const upcoming = assigned.filter(
    (t) => t.scheduledAt && isAfter(new Date(t.scheduledAt), todayStart) && !isToday(new Date(t.scheduledAt))
  );
  const recentlyCompleted = trips
    .filter((t) => COMPLETED_TRIP_STATUSES.includes(t.status))
    .sort(
      (a, b) =>
        new Date(b.completedAt || b.submittedAt || b.updatedAt) -
        new Date(a.completedAt || a.submittedAt || a.updatedAt)
    )
    .slice(0, 5);
  const completedThisWeek = trips.filter(
    (t) =>
      COMPLETED_TRIP_STATUSES.includes(t.status) &&
      new Date(t.completedAt || t.submittedAt || t.updatedAt) >= weekAgo
  );

  return {
    active,
    assigned,
    todaySchedule,
    upcoming,
    recentlyCompleted,
    completedThisWeek,
    inProgressCount: active.length,
    assignedCount: assigned.length,
  };
};

export const buildComplianceAlerts = (driver) => {
  if (!driver) return [];

  const alerts = [];
  const now = new Date();
  const warningDays = 30;

  const checkExpiry = (date, label, type) => {
    if (!date) return;
    const expiry = new Date(date);
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= warningDays) {
      alerts.push({
        id: `${type}-${date}`,
        type,
        severity: daysLeft <= 0 ? 'critical' : daysLeft <= 7 ? 'high' : 'medium',
        title: daysLeft <= 0 ? `${label} expired` : `${label} expiring soon`,
        message:
          daysLeft <= 0
            ? `Your ${label.toLowerCase()} expired on ${expiry.toLocaleDateString()}. Contact your fleet manager.`
            : `${label} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${expiry.toLocaleDateString()})`,
        isRead: false,
      });
    }
  };

  checkExpiry(driver.licenseExpiry, 'Driver license', 'license_expiry');
  checkExpiry(driver.medicalCertificateExpiry, 'Medical certificate', 'medical_expiry');

  (driver.documents || []).forEach((doc) => {
    if (doc.expiryDate) {
      checkExpiry(doc.expiryDate, doc.name || doc.type, `document_${doc.type}`);
    }
  });

  if (driver.assignedVehicle) {
    checkExpiry(driver.assignedVehicle.insuranceExpiry, 'Vehicle insurance', 'insurance_expiry');
    checkExpiry(driver.assignedVehicle.registrationExpiry, 'Vehicle registration', 'registration_expiry');
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
  });
};
