export const FUEL_TYPES = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
  CNG: 'cng',
  HYBRID: 'hybrid',
};

export const FUEL_STATION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const fuelTypeLabels = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  cng: 'CNG',
  hybrid: 'Hybrid',
};

export const stationStatusColors = {
  active: 'success',
  inactive: 'default',
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

export const formatQuantity = (liters) => `${Number(liters || 0).toFixed(1)} L`;

export const formatMileage = (kmPerLiter) =>
  kmPerLiter > 0 ? `${Number(kmPerLiter).toFixed(2)} km/L` : '—';

export const estimateTripEndOdometer = (trip) => {
  const start = Number(trip?.vehicle?.odometer || 0);
  const distance = Number(trip?.distance || 0);
  if (start > 0 && distance > 0) {
    return Math.round((start + distance) * 100) / 100;
  }
  return start || '';
};
