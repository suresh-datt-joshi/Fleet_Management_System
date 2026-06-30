import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { USER_ROLES } from '../constants/roles.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.env.SEED_ADMIN_EMAIL || 'admin@fleetmanagement.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Super admin already exists: ${email}`);
      process.exit(0);
    }

    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email,
      password,
      role: USER_ROLES.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
      phone: '+10000000000',
    });

    console.log('Super admin created successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
