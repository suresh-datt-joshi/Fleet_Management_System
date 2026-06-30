import * as yup from 'yup';
import { DRIVER_STATUS } from '../../../constants';

export const driverSchema = yup.object({
  employeeId: yup.string().optional(),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').optional(),
  phone: yup.string().optional(),
  licenseNumber: yup.string().required('License number is required'),
  licenseExpiry: yup.string().required('License expiry is required'),
  experienceYears: yup.number().min(0).nullable(),
  medicalCertificateExpiry: yup.string().nullable(),
  status: yup.string().oneOf(Object.values(DRIVER_STATUS)),
  performanceScore: yup.number().min(0).max(100).nullable(),
  notes: yup.string().max(1000).optional(),
  emergencyContact: yup.object({
    name: yup.string().optional(),
    phone: yup.string().optional(),
    relation: yup.string().optional(),
  }).optional(),
});

export const statusColors = {
  available: 'success',
  on_trip: 'info',
  off_duty: 'default',
  suspended: 'error',
};

export const documentTypeLabels = {
  license: 'License',
  medical: 'Medical Certificate',
  id_proof: 'ID Proof',
  training: 'Training Certificate',
  other: 'Other',
};

export default driverSchema;
