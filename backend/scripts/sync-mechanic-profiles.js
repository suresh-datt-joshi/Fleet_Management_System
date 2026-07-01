import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { syncMechanicProfilesFromUsers } from '../utils/mechanicUserLink.js';
import Mechanic from '../models/Mechanic.js';
import User from '../models/User.js';
import { USER_ROLES } from '../constants/roles.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const before = await Mechanic.countDocuments({ isDeleted: false });
  const mechanicUsers = await User.countDocuments({ role: USER_ROLES.MECHANIC, isDeleted: false });
  console.log(`Mechanic users: ${mechanicUsers}, Mechanic profiles before sync: ${before}`);

  await syncMechanicProfilesFromUsers();

  const after = await Mechanic.countDocuments({ isDeleted: false });
  const profiles = await Mechanic.find({ isDeleted: false }).select('firstName lastName email user').lean();
  console.log(`Mechanic profiles after sync: ${after}`);
  profiles.forEach((m) => console.log(`  - ${m.firstName} ${m.lastName} (${m.email || 'no email'})`));

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
