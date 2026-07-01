import * as yup from 'yup';
import { MECHANIC_STATUS, MECHANIC_SPECIALIZATIONS } from '../../../constants';

export const mechanicSchema = yup.object({
  employeeId: yup.string().optional(),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').optional(),
  phone: yup.string().optional(),
  certificationNumber: yup.string().required('Certification number is required'),
  certificationExpiry: yup.string().required('Certification expiry is required'),
  specialization: yup.string().oneOf(Object.values(MECHANIC_SPECIALIZATIONS)),
  experienceYears: yup.number().min(0).nullable(),
  status: yup.string().oneOf(Object.values(MECHANIC_STATUS)),
  performanceScore: yup.number().min(0).max(100).nullable(),
  notes: yup.string().max(1000).optional(),
});

export const statusColors = {
  available: 'success',
  on_job: 'info',
  off_duty: 'default',
  unavailable: 'error',
};

export const documentTypeLabels = {
  certification: 'Certification',
  training: 'Training Certificate',
  id_proof: 'ID Proof',
  other: 'Other',
};

export default mechanicSchema;
