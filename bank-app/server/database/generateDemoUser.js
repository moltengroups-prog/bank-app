#!/usr/bin/env node
// ── Interactive demo-user generator ───────────────────────────────
// Usage: node database/generateDemoUser.js

import 'dotenv/config';
import readline from 'readline';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import { generateTransactions, generateSavingsTransactions } from '../utils/demoData/generator.js';
import { ROUTING_NUMBERS } from '../utils/demoData/merchants.js';
import { PATTERNS } from '../utils/demoData/patterns.js';

// ── Console helpers ────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  gray:   '\x1b[90m',
};

const ok  = (s) => `  ${C.green}✔${C.reset}  ${s}`;
const err = (s) => `  ${C.red}✖${C.reset}  ${s}`;
const h   = (s) => `${C.bold}${C.cyan}${s}${C.reset}`;
const dim = (s) => `${C.dim}${s}${C.reset}`;

function hr(char = '─', len = 52) {
  return `  ${C.gray}${''.padEnd(len, char)}${C.reset}`;
}

// ── Readline promise wrappers ─────────────────────────────────────
function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));
}

// ── Random account / routing number ──────────────────────────────
function genAccountNumber() {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fmtUSD(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Balance defaults per user type ────────────────────────────────
const BALANCE_DEFAULTS = {
  standard: { checkingMin: 1200,   checkingMax: 6000,   savingsMin: 800,    savingsMax: 8000   },
  premium:  { checkingMin: 8000,   checkingMax: 35000,  savingsMin: 15000,  savingsMax: 80000  },
  wealthy:  { checkingMin: 40000,  checkingMax: 150000, savingsMin: 120000, savingsMax: 500000 },
  business: { checkingMin: 25000,  checkingMax: 120000, savingsMin: 50000,  savingsMax: 250000 },
};

function randBalance(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// ── Phone number generator ────────────────────────────────────────
function genPhone() {
  const area = randInt(200, 999);
  const ex   = randInt(200, 999);
  const sub  = randInt(1000, 9999);
  return `(${area}) ${ex}-${sub}`;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + hr('═'));
  console.log(`  ${h('Bank of Molten')} ${dim('— Demo User Generator')}`);
  console.log(hr('═') + '\n');

  const rl = createRL();

  try {
    // ── Collect inputs ─────────────────────────────────────────────
    const firstName = await ask(rl, `  ${C.cyan}First name:${C.reset}  `) || 'Demo';
    const lastName  = await ask(rl, `  ${C.cyan}Last name:${C.reset}   `) || 'User';

    const defaultEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const emailInput   = await ask(rl, `  ${C.cyan}Email${C.reset} ${dim(`[${defaultEmail}]`)}: `);
    const email        = emailInput || defaultEmail;

    const passInput = await ask(rl, `  ${C.cyan}Password${C.reset} ${dim('[Demo123!]')}: `);
    const password  = passInput || 'Demo123!';

    console.log(`\n  ${C.cyan}User type:${C.reset}`);
    console.log(`    ${C.bold}1${C.reset} ${dim('standard')}  — salaried employee, $40–80k/yr, typical expenses`);
    console.log(`    ${C.bold}2${C.reset} ${dim('premium')}   — high earner, $150–300k/yr, premium lifestyle`);
    console.log(`    ${C.bold}3${C.reset} ${dim('wealthy')}   — UHNW, $300k+/yr, luxury spending + wires`);
    console.log(`    ${C.bold}4${C.reset} ${dim('business')}  — company account, high volume vendor payments`);
    const typeInput  = await ask(rl, `  ${C.cyan}Choice${C.reset} ${dim('[1]')}: `);
    const typeMap    = { '1': 'standard', '2': 'premium', '3': 'wealthy', '4': 'business' };
    const userType   = typeMap[typeInput] || 'standard';

    const defs = BALANCE_DEFAULTS[userType];

    console.log(`\n  ${C.cyan}Checking balance${C.reset} ${dim(`[${fmtUSD(defs.checkingMin)} – ${fmtUSD(defs.checkingMax)}]`)}`);
    const chkInput      = await ask(rl, `  ${C.cyan}Amount${C.reset} ${dim('[auto]')}: `);
    const checkingBal   = chkInput ? parseFloat(chkInput.replace(/[^0-9.]/g, '')) : randBalance(defs.checkingMin, defs.checkingMax);

    console.log(`\n  ${C.cyan}Savings balance${C.reset}  ${dim(`[${fmtUSD(defs.savingsMin)} – ${fmtUSD(defs.savingsMax)}]`)}`);
    const savInput      = await ask(rl, `  ${C.cyan}Amount${C.reset} ${dim('[auto]')}: `);
    const savingsBal    = savInput ? parseFloat(savInput.replace(/[^0-9.]/g, '')) : randBalance(defs.savingsMin, defs.savingsMax);

    rl.close();

    console.log('\n' + hr());
    console.log(`  Connecting to database…`);

    await connectDB();

    // ── Check for existing user ────────────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log(err(`User with email ${email} already exists.`));
      console.log(`  Run with a different email or delete the existing user first.\n`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // ── Create User ────────────────────────────────────────────────
    console.log(`  Creating user…`);
    const user = await User.create({
      firstName,
      lastName,
      email:       email.toLowerCase(),
      password,
      phoneNumber: genPhone(),
      isVerified:  true,
      role:        'user',
    });

    // ── Create Checking Account ────────────────────────────────────
    const routingNumber  = pick(ROUTING_NUMBERS);
    const chkAcctNum     = genAccountNumber();
    const savAcctNum     = genAccountNumber();

    console.log(`  Creating accounts…`);
    const checkingAccount = await BankAccount.create({
      user:          user._id,
      accountName:   userType === 'business' ? 'Business Checking' : 'Primary Checking',
      accountType:   'checking',
      accountNumber: chkAcctNum,
      routingNumber,
      balance:       0,
      availableBalance: 0,
      isPrimary:     true,
      status:        'active',
    });

    const savingsAccount = await BankAccount.create({
      user:          user._id,
      accountName:   userType === 'business' ? 'Business Savings' : 'High-Yield Savings',
      accountType:   'savings',
      accountNumber: savAcctNum,
      routingNumber,
      balance:       0,
      availableBalance: 0,
      isPrimary:     false,
      status:        'active',
    });

    // Link accounts to user
    user.accounts = [checkingAccount._id, savingsAccount._id];
    await user.save();

    // ── Generate transactions ──────────────────────────────────────
    console.log(`  Generating checking transactions…`);
    const { transactions: chkTxns, startBalance: chkStart } = generateTransactions(
      user._id, checkingAccount._id, userType, checkingBal
    );

    console.log(`  Generating savings transactions…`);
    const { transactions: savTxns, startBalance: savStart } = generateSavingsTransactions(
      user._id, savingsAccount._id, userType, savingsBal
    );

    // ── Insert transactions ────────────────────────────────────────
    console.log(`  Inserting ${chkTxns.length + savTxns.length} transactions…`);
    await Transaction.insertMany([...chkTxns, ...savTxns], { ordered: false });

    // ── Update account balances to final balanceAfter ──────────────
    const chkFinal = chkTxns.length > 0 ? chkTxns[chkTxns.length - 1].balanceAfter : checkingBal;
    const savFinal = savTxns.length > 0 ? savTxns[savTxns.length - 1].balanceAfter : savingsBal;

    await BankAccount.findByIdAndUpdate(checkingAccount._id, {
      balance:          Math.round(chkFinal * 100) / 100,
      availableBalance: Math.round(chkFinal * 100) / 100,
    });
    await BankAccount.findByIdAndUpdate(savingsAccount._id, {
      balance:          Math.round(savFinal * 100) / 100,
      availableBalance: Math.round(savFinal * 100) / 100,
    });

    // ── Summary ────────────────────────────────────────────────────
    const chkLast4 = chkAcctNum.slice(-4);
    const savLast4 = savAcctNum.slice(-4);

    const chkCreditCount = chkTxns.filter((t) => t.type === 'credit').length;
    const chkDebitCount  = chkTxns.filter((t) => t.type === 'debit').length;
    const savCreditCount = savTxns.filter((t) => t.type === 'credit').length;
    const savDebitCount  = savTxns.filter((t) => t.type === 'debit').length;

    const catCounts = {};
    for (const t of [...chkTxns, ...savTxns]) {
      catCounts[t.category] = (catCounts[t.category] ?? 0) + 1;
    }
    const topCats = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, n]) => `${cat}(${n})`)
      .join('  ');

    console.log('\n' + hr('═'));
    console.log(`  ${h('Demo User Created Successfully')}`);
    console.log(hr('═'));
    console.log(`\n  ${C.bold}User${C.reset}`);
    console.log(`  ${C.gray}Name${C.reset}      ${firstName} ${lastName}`);
    console.log(`  ${C.gray}Email${C.reset}     ${email.toLowerCase()}`);
    console.log(`  ${C.gray}Password${C.reset}  ${password}`);
    console.log(`  ${C.gray}Type${C.reset}      ${userType}`);
    console.log(`  ${C.gray}ID${C.reset}        ${user._id}`);
    console.log();
    console.log(`  ${C.bold}Accounts${C.reset}`);
    console.log(`  ${C.gray}Checking${C.reset}  ••••${chkLast4}   ${C.green}${fmtUSD(chkFinal)}${C.reset}   ${routingNumber}`);
    console.log(`  ${C.gray}Savings${C.reset}   ••••${savLast4}   ${C.green}${fmtUSD(savFinal)}${C.reset}   ${routingNumber}`);
    console.log();
    console.log(`  ${C.bold}Transaction History${C.reset}`);
    console.log(ok(`${chkTxns.length} checking transactions  (${chkCreditCount} credits, ${chkDebitCount} debits)`));
    console.log(ok(`${savTxns.length} savings transactions   (${savCreditCount} credits, ${savDebitCount} debits)`));
    console.log(ok(`History from Jan 2024 → today`));
    console.log(ok(`Payroll, housing, subscriptions, utilities`));
    console.log(ok(`Groceries, dining, shopping, travel, ATM`));
    console.log();
    console.log(`  ${C.bold}Top categories${C.reset}  ${C.dim}${topCats}${C.reset}`);
    console.log('\n' + hr('═') + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    try { rl.close(); } catch (_) {}
    console.log('\n' + err(`Failed: ${e.message}`));
    if (e.code === 11000) {
      console.log(`  ${C.dim}A user with that email already exists.${C.reset}`);
    }
    console.error(e);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

main();
