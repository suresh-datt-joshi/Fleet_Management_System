import * as yup from 'yup';
import { VEHICLE_STATUS } from '../../../constants';

export const vehicleSchema = yup.object({
  vehicleNumber: yup.string().required('Vehicle number is required').max(20),
  vin: yup.string().optional().max(17),
  manufacturer: yup.string().required('Manufacturer is required'),
  model: yup.string().required('Model is required'),
  year: yup.number().nullable().min(1990).max(2100),
  status: yup.string().oneOf(Object.values(VEHICLE_STATUS)),
  fuelType: yup.string().oneOf(['petrol', 'diesel', 'electric', 'cng', 'hybrid']),
  fuelLevel: yup.number().min(0).max(100).nullable(),
  odometer: yup.number().min(0).nullable(),
  registrationNumber: yup.string().optional(),
  notes: yup.string().max(1000).optional(),
  documentExpiry: yup.object({
    insurance: yup.string().nullable(),
    registration: yup.string().nullable(),
    fitness: yup.string().nullable(),
    emission: yup.string().nullable(),
    permit: yup.string().nullable(),
  }).optional(),
});

export const statusColors = {
  active: 'success',
  inactive: 'default',
  maintenance: 'warning',
  retired: 'error',
};

export const fuelTypeLabels = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  cng: 'CNG',
  hybrid: 'Hybrid',
};

export default vehicleSchema;
