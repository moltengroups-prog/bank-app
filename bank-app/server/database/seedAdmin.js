import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

// Plain-text passwords and PINs — the User model pre('save') hooks hash them.
// Do NOT pre-hash here; that would cause double-hashing and break login.
const ADMIN_USERS = [
  {
    firstName: 'Admin',
    lastName:  'User',
    email:     'admin@bankmolten.com',
    password:  'Admin123!',
    pin2FA:    '259148',
    role:      'admin',
  },
  {
    firstName: 'Support',
    lastName:  'Agent',
    email:     'agent@bankmolten.com',
    password:  'Agent123!',
    pin2FA:    '259148',
    role:      'support-agent',
  },
];

async function main() {
  try {
    await connectDB();

    console.log('\n  Resetting admin credentials…\n');

    for (const u of ADMIN_USERS) {
      // Force-delete any existing record so we always start fresh
      const deleted = await User.deleteOne({ email: u.email });
      if (deleted.deletedCount) {
        console.log(`  ✗  Removed existing ${u.role}: ${u.email}`);
      }

      // Create with plain-text password and PIN — pre('save') hooks hash both
      await User.create({
        firstName:  u.firstName,
        lastName:   u.lastName,
        email:      u.email,
        password:   u.password,
        pin2FA:     u.pin2FA,
        role:       u.role,
        isVerified: true,
      });

      console.log(`  ✓  Created ${u.role}`);
    }

    console.log('\n  ┌─────────────────────────────────────────────┐');
    console.log('  │           ADMIN CREDENTIALS                 │');
    console.log('  ├─────────────────────────────────────────────┤');
    for (const u of ADMIN_USERS) {
      console.log(`  │  Role    : ${u.role.padEnd(33)}│`);
      console.log(`  │  Email   : ${u.email.padEnd(33)}│`);
      console.log(`  │  Password: ${u.password.padEnd(33)}│`);
      console.log(`  │  2FA PIN : ${u.pin2FA.padEnd(33)}│`);
      console.log('  ├─────────────────────────────────────────────┤');
    }
    console.log('  └─────────────────────────────────────────────┘\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n  Seed failed:', err.message);
    process.exit(1);
  }
}

main();
