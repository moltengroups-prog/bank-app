import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

// Plain-text passwords — the User model pre('save') hook hashes them.
// Do NOT pre-hash here; that would cause double-hashing and break login.
const ADMIN_USERS = [
  {
    firstName: 'Admin',
    lastName:  'User',
    email:     'admin@bankmolten.com',
    password:  'Admin123!',
    role:      'admin',
  },
  {
    firstName: 'Support',
    lastName:  'Agent',
    email:     'agent@bankmolten.com',
    password:  'Agent123!',
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

      // Create with plain-text password — pre('save') hook hashes it once
      await User.create({
        firstName:  u.firstName,
        lastName:   u.lastName,
        email:      u.email,
        password:   u.password,
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
