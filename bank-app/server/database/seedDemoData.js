import 'dotenv/config';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';

// ── Helpers ───────────────────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Returns a Date object for n days ago at a specific hour
function dateAt(daysBack, hour = 12) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// ── Seed function (exported for API/test use) ─────────────────────

export async function seedUser(userId) {
  // Clear any existing banking data for this user
  const existing = await BankAccount.find({ user: userId });
  if (existing.length) {
    const ids = existing.map((a) => a._id);
    await Transaction.deleteMany({ account: { $in: ids } });
    await BankAccount.deleteMany({ user: userId });
  }

  // ── Checking account ──────────────────────────────────────────

  const checking = await BankAccount.create({
    user:         userId,
    accountName:  'Advantage Banking',
    accountType:  'checking',
    accountNumber: '4820193756',
    routingNumber: '026009593',
    balance:       0,    // updated after transactions
    availableBalance: 0,
    currency:     'USD',
    status:       'active',
    isPrimary:    true,
  });

  // ── Savings account ───────────────────────────────────────────

  const savings = await BankAccount.create({
    user:         userId,
    accountName:  'Advantage Savings',
    accountType:  'savings',
    accountNumber: '7312095841',
    routingNumber: '026009593',
    balance:       0,
    availableBalance: 0,
    currency:     'USD',
    status:       'active',
    isPrimary:    false,
  });

  // ── Checking transactions (oldest → newest) ───────────────────
  // Running balance computed forward from initial balance.

  const CHECKING_START = 9000.00;

  const checkingDefs = [
    { d: 30, h: 9,  type: 'credit', cat: 'payroll',      amt: 3542.50, desc: 'Direct Deposit — Acme Corp',       merch: 'Acme Corp'   },
    { d: 28, h: 10, type: 'debit',  cat: 'billpay',      amt: 1200.00, desc: 'Rent Payment — Bill Pay',           merch: null          },
    { d: 26, h: 7,  type: 'debit',  cat: 'subscription', amt: 15.99,   desc: 'Netflix.com',                       merch: 'Netflix'     },
    { d: 26, h: 7,  type: 'debit',  cat: 'subscription', amt: 9.99,    desc: 'Apple Services',                    merch: 'Apple'       },
    { d: 25, h: 14, type: 'debit',  cat: 'utilities',    amt: 124.50,  desc: 'Con Edison Electric',               merch: 'Con Edison'  },
    { d: 22, h: 11, type: 'debit',  cat: 'shopping',     amt: 178.45,  desc: 'Amazon.com',                        merch: 'Amazon'      },
    { d: 20, h: 13, type: 'debit',  cat: 'dining',       amt: 67.23,   desc: 'Chipotle Mexican Grill',            merch: 'Chipotle'    },
    { d: 18, h: 16, type: 'debit',  cat: 'atm',          amt: 200.00,  desc: 'ATM Withdrawal — BOA 5th Ave',      merch: null          },
    { d: 17, h: 15, type: 'debit',  cat: 'shopping',     amt: 134.97,  desc: 'Target',                            merch: 'Target'      },
    { d: 15, h: 10, type: 'credit', cat: 'zelle',        amt: 300.00,  desc: 'Zelle from Sarah M.',               merch: null          },
    { d: 14, h: 9,  type: 'debit',  cat: 'transfer',     amt: 500.00,  desc: `Transfer to Savings ••••${savings.last4}`, merch: null },
    { d: 12, h: 14, type: 'debit',  cat: 'healthcare',   amt: 34.12,   desc: 'CVS Pharmacy',                      merch: 'CVS'         },
    { d: 10, h: 7,  type: 'debit',  cat: 'subscription', amt: 9.99,    desc: 'Spotify Premium',                   merch: 'Spotify'     },
    { d: 9,  h: 8,  type: 'debit',  cat: 'dining',       amt: 18.43,   desc: 'Starbucks',                         merch: 'Starbucks'   },
    { d: 8,  h: 16, type: 'debit',  cat: 'shopping',     amt: 229.99,  desc: 'Best Buy',                          merch: 'Best Buy'    },
    { d: 7,  h: 11, type: 'debit',  cat: 'zelle',        amt: 100.00,  desc: 'Zelle to Mike R.',                  merch: null          },
    { d: 6,  h: 18, type: 'debit',  cat: 'shopping',     amt: 87.32,   desc: 'Whole Foods Market',                merch: 'Whole Foods' },
    { d: 5,  h: 14, type: 'debit',  cat: 'shopping',     amt: 52.30,   desc: 'Amazon.com',                        merch: 'Amazon'      },
    { d: 3,  h: 9,  type: 'credit', cat: 'payroll',      amt: 3542.50, desc: 'Direct Deposit — Acme Corp',        merch: 'Acme Corp'   },
    { d: 2,  h: 15, type: 'debit',  cat: 'travel',       amt: 442.00,  desc: 'United Airlines',                   merch: 'United'      },
    { d: 2,  h: 17, type: 'debit',  cat: 'healthcare',   amt: 29.73,   desc: 'Walgreens',                         merch: 'Walgreens'   },
    { d: 1,  h: 12, type: 'debit',  cat: 'dining',       amt: 43.18,   desc: 'Chipotle Mexican Grill',            merch: 'Chipotle'    },
    { d: 0,  h: 8,  type: 'debit',  cat: 'dining',       amt: 16.42,   desc: 'Starbucks',                         merch: 'Starbucks'   },
  ];

  let checkingBal = CHECKING_START;
  const checkingTxs = checkingDefs.map((tx) => {
    checkingBal = tx.type === 'credit'
      ? round2(checkingBal + tx.amt)
      : round2(checkingBal - tx.amt);
    return {
      user:            userId,
      account:         checking._id,
      type:            tx.type,
      category:        tx.cat,
      amount:          tx.amt,
      description:     tx.desc,
      merchant:        tx.merch,
      status:          'completed',
      balanceAfter:    checkingBal,
      transactionDate: dateAt(tx.d, tx.h),
    };
  });

  // ── Savings transactions (oldest → newest) ────────────────────

  const SAVINGS_START = 25000.00;

  const savingsDefs = [
    { d: 50, h: 9,  type: 'credit', cat: 'deposit',  amt: 200.00,  desc: 'Direct Deposit — Signing Bonus',        merch: 'Acme Corp' },
    { d: 45, h: 9,  type: 'credit', cat: 'transfer', amt: 1000.00, desc: `Transfer from Checking ••••${checking.last4}`, merch: null },
    { d: 20, h: 0,  type: 'credit', cat: 'deposit',  amt: 21.42,   desc: 'Interest Payment',                       merch: 'Bank of America' },
    { d: 14, h: 9,  type: 'credit', cat: 'transfer', amt: 500.00,  desc: `Transfer from Checking ••••${checking.last4}`, merch: null },
  ];

  let savingsBal = SAVINGS_START;
  const savingsTxs = savingsDefs.map((tx) => {
    savingsBal = tx.type === 'credit'
      ? round2(savingsBal + tx.amt)
      : round2(savingsBal - tx.amt);
    return {
      user:            userId,
      account:         savings._id,
      type:            tx.type,
      category:        tx.cat,
      amount:          tx.amt,
      description:     tx.desc,
      merchant:        tx.merch,
      status:          'completed',
      balanceAfter:    savingsBal,
      transactionDate: dateAt(tx.d, tx.h),
    };
  });

  // ── Insert all transactions ───────────────────────────────────

  await Transaction.insertMany([...checkingTxs, ...savingsTxs]);

  // ── Update account balances to match final computed balance ───

  await BankAccount.findByIdAndUpdate(checking._id, {
    balance:          checkingBal,
    availableBalance: checkingBal,
  });

  await BankAccount.findByIdAndUpdate(savings._id, {
    balance:          savingsBal,
    availableBalance: savingsBal,
  });

  // ── Link accounts to user ────────────────────────────────────

  await User.findByIdAndUpdate(userId, {
    $set: { accounts: [checking._id, savings._id] },
  });

  return {
    checking: { id: checking._id, balance: checkingBal, txCount: checkingTxs.length },
    savings:  { id: savings._id,  balance: savingsBal,  txCount: savingsTxs.length  },
  };
}

// ── CLI entry point ───────────────────────────────────────────────

async function main() {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error('\n  Usage: node database/seedDemoData.js <email>\n');
    process.exit(1);
  }

  try {
    await connectDB();

    const user = await User.findOne({ email: emailArg.toLowerCase() });
    if (!user) {
      console.error(`\n  User not found: ${emailArg}\n`);
      process.exit(1);
    }

    console.log(`\n  Seeding demo data for: ${user.firstName} ${user.lastName} <${user.email}>\n`);

    const result = await seedUser(user._id);

    console.log(`  ✓ Checking  ••••${result.checking.id.toString().slice(-4)}  $${result.checking.balance.toFixed(2).padStart(11)}   ${result.checking.txCount} transactions`);
    console.log(`  ✓ Savings   ••••${result.savings.id.toString().slice(-4)}  $${result.savings.balance.toFixed(2).padStart(11)}   ${result.savings.txCount} transactions`);
    console.log('\n  Seed complete.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n  Seed failed:', err.message);
    process.exit(1);
  }
}

// Run only when executed directly (not imported as a module)
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main();
}
