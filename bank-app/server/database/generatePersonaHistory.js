/**
 * Persona-based transaction history generator.
 * Generates realistic transaction history for a user+account based on
 * occupation, rank/income class, and personality modifiers.
 *
 * Called by POST /api/admin/users/:id/generate-history
 */

import mongoose from 'mongoose';
import User        from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import { getOccupation, resolveIncome } from './personas/occupations.js';
import { getPersonality, NEUTRAL_MODIFIERS } from './personas/personalities.js';
import {
  DINING, GROCERIES, SHOPPING, SUBSCRIPTIONS,
  UTILITIES, AIRLINES, HOTELS, TRANSPORT, HEALTHCARE,
  FUEL, ZELLE_CONTACTS,
} from '../utils/demoData/merchants.js';
import {
  achPayroll, achGrocery, achDining, achShopping, achATM,
  achZelleOut, achZelleIn, achTransferOut, achSubscription,
  achUtility, achFuel, achAirline, achHotel, achTransport,
  achHealthcare, achWireOut, achWireIn, achMortgage, achRent,
  achSavingsTransfer, achCheckingTransfer, achInterest,
} from '../utils/demoData/achFormat.js';

// ── Helpers ────────────────────────────────────────────────────────
const rand    = (min, max) => Math.random() * (max - min) + min;
const randI   = (min, max) => Math.floor(rand(min, max + 1));
const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const round2  = (n) => Math.round(n * 100) / 100;
const clamp   = (n, min, max) => Math.max(min, Math.min(max, n));

function genRef() {
  return 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function setHour(date, h, m) { const d = new Date(date); d.setHours(h, m ?? randI(0, 59), randI(0, 59), 0); return d; }
function businessHour(d) { return setHour(d, randI(8, 20)); }
function morningHour(d)  { return setHour(d, randI(6, 10)); }
function eveHour(d)      { return setHour(d, randI(17, 22)); }
function jitter(date, days, start, end) {
  const ms = days * 86400000;
  const r = new Date(date.getTime() + (Math.random() - 0.5) * 2 * ms);
  if (r < start) return new Date(start);
  if (r > end)   return new Date(end);
  return r;
}
function* everyNDays(start, end, n) {
  let cur = new Date(start);
  while (cur <= end) { yield new Date(cur); cur = addDays(cur, n); }
}
function* eachMonth(start, end, day) {
  let cur = new Date(start.getFullYear(), start.getMonth(), day);
  if (cur < start) cur.setMonth(cur.getMonth() + 1);
  while (cur <= end) { yield new Date(cur); cur = new Date(cur.getFullYear(), cur.getMonth() + 1, day); }
}
function* eachWeek(start, end) {
  let cur = new Date(start);
  while (cur <= end) { yield new Date(cur); cur = addDays(cur, 7); }
}

// ── Build a persona-aware pattern from occupation + personality ─────
function buildPersonaPattern(occupation, rankOrClass, personality, intensity) {
  const mods  = personality?.modifiers || NEUTRAL_MODIFIERS;
  const scale = clamp(intensity, 0.25, 3.0);

  const [incomeMin, incomeMax] = resolveIncome(occupation, rankOrClass);
  // Convert annual to biweekly / monthly paycheck gross (simplified)
  const annualSalary = rand(incomeMin, incomeMax);
  const isHighEarner = annualSalary >= 150000;
  const isMidEarner  = annualSalary >= 70000;

  const biweeklyGross = round2(annualSalary / 26);
  const monthlyGross  = round2(annualSalary / 12);
  const netRatio = 0.72; // approximate take-home after tax

  const biweeklyNet = round2(biweeklyGross * netRatio);
  const monthlyNet  = round2(monthlyGross  * netRatio);

  // Housing cost scaled to income
  const housingPct = occupation.housingType === 'bah' ? 0 : (isHighEarner ? 0.20 : isMidEarner ? 0.26 : 0.32);
  const housingMonthly = occupation.housingType === 'bah'
    ? 0
    : round2(monthlyNet * housingPct);

  const diningTier  = isHighEarner ? 'luxury' : isMidEarner ? 'premium' : 'standard';
  const shoppingTier = isHighEarner ? 'luxury' : 'everyday';

  return {
    annualSalary,
    payroll: {
      schedule:    occupation.payrollSchedule,
      startDay:    10,
      amountMin:   occupation.payrollSchedule === 'biweekly' ? biweeklyNet * 0.95 : monthlyNet * 0.95,
      amountMax:   occupation.payrollSchedule === 'biweekly' ? biweeklyNet * 1.05 : monthlyNet * 1.05,
      description: (emp, date) => achPayroll(emp, date),
    },
    housing: housingMonthly > 0 ? {
      dayOfMonth:   1,
      amountMin:    housingMonthly * 0.97,
      amountMax:    housingMonthly * 1.03,
      merchant:     occupation.housingType === 'mortgage' ? 'Mortgage Payment' : 'Landlord / Property Mgmt',
      isMortgage:   occupation.housingType === 'mortgage',
    } : null,
    subscriptions: {
      count: Math.round(clamp((isHighEarner ? 6 : isMidEarner ? 4 : 2) * mods.subscriptions * scale, 1, 10)),
    },
    groceries: {
      weeklyTrips: Math.round(clamp((isMidEarner ? 1 : 1) * mods.groceries * scale, 0, 3)),
      amountMin:   round2(clamp((isHighEarner ? 100 : isMidEarner ? 70 : 45) * mods.groceries, 20, 600)),
      amountMax:   round2(clamp((isHighEarner ? 280 : isMidEarner ? 160 : 110) * mods.groceries, 40, 800)),
    },
    dining: {
      weeklyTrips: Math.round(clamp((isHighEarner ? 5 : isMidEarner ? 3 : 2) * mods.dining * scale, 0, 10)),
      amountMin:   round2(clamp((isHighEarner ? 35 : isMidEarner ? 16 : 9) * mods.dining, 5, 500)),
      amountMax:   round2(clamp((isHighEarner ? 180 : isMidEarner ? 65 : 35) * mods.dining, 10, 1000)),
      tier:        diningTier,
    },
    shopping: {
      weeklyChance: clamp((isHighEarner ? 0.7 : 0.45) * mods.shopping * scale, 0, 1),
      amountMin:    round2(clamp((isHighEarner ? 80 : 18) * mods.shopping, 5, 2000)),
      amountMax:    round2(clamp((isHighEarner ? 800 : 180) * mods.shopping, 10, 5000)),
      tier:         shoppingTier,
    },
    atm: {
      monthlyWithdrawals: Math.round(clamp(2 * mods.atm * scale, 0, 6)),
      amountMin: round2(clamp(40 * mods.atm, 20, 500)),
      amountMax: round2(clamp(200 * mods.atm, 40, 1000)),
    },
    fuel: {
      weeklyChance: clamp(0.55 * mods.fuel * scale, 0, 1),
      amountMin: round2(clamp(35 * mods.fuel, 15, 200)),
      amountMax: round2(clamp(90 * mods.fuel, 30, 400)),
    },
    utilities: {
      count: Math.round(clamp(2 * scale, 1, 5)),
    },
    healthcare: {
      monthlyChance: clamp(0.25 * mods.healthcare * scale, 0, 1),
    },
    travel: {
      tripsPerYear: clamp((isHighEarner ? 5 : isMidEarner ? 2 : 0.5) * mods.travel * scale, 0, 20),
      tier: isHighEarner ? 'first' : isMidEarner ? 'business' : 'economy',
    },
    zelle: {
      monthlyTransfers: Math.round(clamp(2 * scale, 0, 8)),
      amountMin: round2(clamp(25 * scale, 10, 500)),
      amountMax: round2(clamp(300 * scale, 20, 2000)),
    },
    transferToSavings: {
      monthlyChance: clamp(0.7 * mods.savingsRate, 0, 1),
      amountMin: round2(clamp((isHighEarner ? 2000 : isMidEarner ? 500 : 100) * mods.savingsRate, 50, 50000)),
      amountMax: round2(clamp((isHighEarner ? 8000 : isMidEarner ? 2000 : 600) * mods.savingsRate, 100, 100000)),
    },
    wires: {
      monthlyChance: clamp(
        (isHighEarner ? 0.4 : 0.1) * (mods.wireChance || 1.0) * scale,
        0, 1
      ),
      amountMin: round2(isHighEarner ? 2000 : 500),
      amountMax: round2(isHighEarner ? 50000 : 5000),
    },
  };
}

// ── Core transaction generator ─────────────────────────────────────
function buildTransactions(userId, accountId, occupation, pattern, START, END) {
  const events = [];
  const employer = occupation.employer;

  const subPool = SUBSCRIPTIONS.premium ?? SUBSCRIPTIONS.standard;
  const subCount = pattern.subscriptions.count;
  const subList = [...subPool]
    .sort(() => Math.random() - 0.5)
    .slice(0, subCount)
    .map((s, i) => ({ ...s, billingDay: [3, 5, 8, 10, 12, 15, 18, 20, 22, 25][i % 10] }));

  const utilCount = pattern.utilities.count;
  const utilList  = [...UTILITIES].sort(() => Math.random() - 0.5).slice(0, utilCount);

  // Payroll
  if (pattern.payroll.schedule === 'biweekly') {
    const firstPay = new Date(`${START.getFullYear()}-01-${String(pattern.payroll.startDay).padStart(2, '0')}T09:00:00Z`);
    for (const d of everyNDays(firstPay <= START ? firstPay : START, END, 14)) {
      const txDate = morningHour(d);
      events.push({ transactionDate: txDate, type: 'credit', category: 'payroll',
        amount: round2(rand(pattern.payroll.amountMin, pattern.payroll.amountMax)),
        description: pattern.payroll.description(employer, txDate), merchant: employer });
    }
  } else {
    for (const d of eachMonth(START, END, pattern.payroll.startDay)) {
      const txDate = morningHour(d);
      events.push({ transactionDate: txDate, type: 'credit', category: 'payroll',
        amount: round2(rand(pattern.payroll.amountMin, pattern.payroll.amountMax)),
        description: pattern.payroll.description(employer, txDate), merchant: employer });
    }
  }

  // Housing
  if (pattern.housing) {
    const h = pattern.housing;
    for (const d of eachMonth(START, END, h.dayOfMonth)) {
      const txDate = setHour(d, 8, 0);
      events.push({ transactionDate: txDate, type: 'debit', category: 'transfer',
        amount: round2(rand(h.amountMin, h.amountMax)),
        description: h.isMortgage ? achMortgage() : achRent(txDate),
        merchant: h.merchant });
    }
  }

  // Subscriptions
  for (const sub of subList) {
    for (const d of eachMonth(START, END, sub.billingDay)) {
      const txDate = setHour(d, randI(0, 5));
      events.push({ transactionDate: txDate, type: 'debit', category: 'subscription',
        amount: round2(sub.amount * rand(0.99, 1.01)),
        description: achSubscription(sub.desc || sub.name, txDate), merchant: sub.name });
    }
  }

  // Utilities
  for (const util of utilList) {
    const utilDay = randI(10, 28);
    for (const d of eachMonth(START, END, utilDay)) {
      const txDate = businessHour(d);
      events.push({ transactionDate: txDate, type: 'debit', category: 'utilities',
        amount: round2(rand(util.min, util.max)),
        description: achUtility(util.name, txDate), merchant: util.name });
    }
  }

  // Groceries
  if (pattern.groceries.weeklyTrips > 0) {
    const grocDay = randI(0, 6);
    for (const week of eachWeek(START, END)) {
      const d = addDays(week, grocDay);
      if (d > END) break;
      for (let t = 0; t < pattern.groceries.weeklyTrips; t++) {
        const merchant = pick(GROCERIES);
        const txDate = businessHour(jitter(d, 1, START, END));
        events.push({ transactionDate: txDate, type: 'debit', category: 'shopping',
          amount: round2(rand(pattern.groceries.amountMin, pattern.groceries.amountMax)),
          description: achGrocery(merchant, txDate), merchant });
      }
    }
  }

  // Dining
  const diningPool = DINING[pattern.dining.tier] ?? DINING.standard;
  for (const week of eachWeek(START, END)) {
    const days = Array.from({ length: 7 }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, pattern.dining.weeklyTrips);
    for (const offset of days) {
      const d = addDays(week, offset);
      if (d > END) break;
      const merchant = pick(diningPool);
      const txDate = eveHour(d);
      events.push({ transactionDate: txDate, type: 'debit', category: 'dining',
        amount: round2(rand(pattern.dining.amountMin, pattern.dining.amountMax)),
        description: achDining(merchant, txDate), merchant });
    }
  }

  // Shopping
  if (pattern.shopping.weeklyChance > 0) {
    const shopPool = SHOPPING[pattern.shopping.tier] ?? SHOPPING.everyday;
    for (const week of eachWeek(START, END)) {
      if (Math.random() < pattern.shopping.weeklyChance) {
        const d = addDays(week, randI(0, 6));
        if (d > END) break;
        const merchant = pick(shopPool);
        const txDate = businessHour(d);
        events.push({ transactionDate: txDate, type: 'debit', category: 'shopping',
          amount: round2(rand(pattern.shopping.amountMin, pattern.shopping.amountMax)),
          description: achShopping(merchant, txDate), merchant });
      }
    }
  }

  // ATM
  if (pattern.atm.monthlyWithdrawals > 0) {
    for (const d of eachMonth(START, END, 15)) {
      for (let i = 0; i < pattern.atm.monthlyWithdrawals; i++) {
        const txDate = businessHour(jitter(d, 7, START, END));
        events.push({ transactionDate: txDate, type: 'debit', category: 'atm',
          amount: round2(rand(pattern.atm.amountMin, pattern.atm.amountMax)),
          description: achATM(txDate), merchant: 'ATM' });
      }
    }
  }

  // Fuel
  if (pattern.fuel.weeklyChance > 0) {
    for (const week of eachWeek(START, END)) {
      if (Math.random() < pattern.fuel.weeklyChance) {
        const d = addDays(week, randI(0, 6));
        if (d > END) break;
        const merchant = pick(FUEL);
        const txDate = morningHour(d);
        events.push({ transactionDate: txDate, type: 'debit', category: 'other',
          amount: round2(rand(pattern.fuel.amountMin, pattern.fuel.amountMax)),
          description: achFuel(merchant, txDate), merchant });
      }
    }
  }

  // Healthcare
  if (pattern.healthcare.monthlyChance > 0) {
    for (const d of eachMonth(START, END, randI(1, 28))) {
      if (Math.random() < pattern.healthcare.monthlyChance) {
        const hcItem = pick(HEALTHCARE);
        const txDate = businessHour(d);
        events.push({ transactionDate: txDate, type: 'debit', category: 'healthcare',
          amount: round2(rand(hcItem.min, hcItem.max)),
          description: achHealthcare(hcItem.name, txDate), merchant: hcItem.name });
      }
    }
  }

  // Travel
  if (pattern.travel.tripsPerYear > 0) {
    const msRange = END.getTime() - START.getTime();
    const monthsRange = msRange / (30 * 86400000);
    const tripCount = Math.max(0, Math.round(pattern.travel.tripsPerYear * (monthsRange / 12)));
    const hotelPool  = HOTELS[pattern.travel.tier === 'first' ? 'wealthy' : pattern.travel.tier === 'business' ? 'premium' : 'standard'] ?? HOTELS.standard;
    for (let t = 0; t < tripCount; t++) {
      const tripStart = new Date(START.getTime() + Math.random() * msRange * 0.9);
      const tripDays  = randI(3, 10);
      const tier = pattern.travel.tier;
      const airline = pick(AIRLINES);
      const txDate = morningHour(tripStart);
      events.push({ transactionDate: txDate, type: 'debit', category: 'travel',
        amount: round2(rand(tier === 'first' ? 1500 : tier === 'business' ? 600 : 200,
                            tier === 'first' ? 8000 : tier === 'business' ? 2500 : 700)),
        description: achAirline(airline, txDate), merchant: airline });
      for (let n = 0; n < tripDays - 1; n++) {
        const hotelDay = addDays(tripStart, n + 1);
        if (hotelDay > END) break;
        const hotel = pick(hotelPool);
        events.push({ transactionDate: setHour(hotelDay, 12, 0), type: 'debit', category: 'travel',
          amount: round2(rand(tier === 'first' ? 400 : tier === 'business' ? 180 : 80,
                              tier === 'first' ? 1200 : tier === 'business' ? 450 : 220)),
          description: achHotel(hotel), merchant: hotel });
      }
      for (let i = 0; i < randI(2, 5); i++) {
        const tDay = addDays(tripStart, randI(0, tripDays));
        if (tDay > END) break;
        const transport = pick(TRANSPORT);
        const txD = businessHour(tDay);
        events.push({ transactionDate: txD, type: 'debit', category: 'travel',
          amount: round2(rand(8, 60)), description: achTransport(transport, txD), merchant: transport });
      }
    }
  }

  // Zelle
  if (pattern.zelle.monthlyTransfers > 0) {
    for (const d of eachMonth(START, END, 10)) {
      for (let i = 0; i < pattern.zelle.monthlyTransfers; i++) {
        const day = jitter(d, 10, START, END);
        const contact = pick(ZELLE_CONTACTS);
        const isCredit = Math.random() < 0.35;
        const txDate = businessHour(day);
        events.push({ transactionDate: txDate,
          type: isCredit ? 'credit' : 'debit', category: 'zelle',
          amount: round2(rand(pattern.zelle.amountMin, pattern.zelle.amountMax)),
          description: isCredit ? achZelleIn(contact, txDate) : achZelleOut(contact, txDate),
          merchant: 'Zelle' });
      }
    }
  }

  // Transfer to savings
  if (pattern.transferToSavings.monthlyChance > 0) {
    for (const d of eachMonth(START, END, 25)) {
      if (Math.random() < pattern.transferToSavings.monthlyChance) {
        const txDate = setHour(d, 9, 0);
        events.push({ transactionDate: txDate, type: 'debit', category: 'transfer',
          amount: round2(rand(pattern.transferToSavings.amountMin, pattern.transferToSavings.amountMax)),
          description: achSavingsTransfer(txDate), merchant: 'Internal Transfer' });
      }
    }
  }

  // Wire transfers
  if (pattern.wires.monthlyChance > 0) {
    for (const d of eachMonth(START, END, 20)) {
      if (Math.random() < pattern.wires.monthlyChance) {
        const isCredit = Math.random() < 0.3;
        events.push({ transactionDate: businessHour(d),
          type: isCredit ? 'credit' : 'debit', category: 'wire',
          amount: round2(rand(pattern.wires.amountMin, pattern.wires.amountMax)),
          description: isCredit ? achWireIn() : achWireOut(),
          merchant: 'Wire Transfer' });
      }
    }
  }

  events.sort((a, b) => a.transactionDate - b.transactionDate);

  // Compute startBalance so final ≈ targetBalance
  let netFlow = 0;
  for (const e of events) netFlow += e.type === 'credit' ? e.amount : -e.amount;

  return events;
}

/**
 * Generate and persist persona history for a user's accounts.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.occupationId
 * @param {string} [opts.rankOrClass='mid']      rank (military) or income class (entry/mid/senior)
 * @param {string} [opts.personalityId]          personality modifier id (optional)
 * @param {string} [opts.historyStartDate]       ISO date string, defaults to 18 months ago
 * @param {number} [opts.activityIntensity=1.0]  0.25–3.0 multiplier for transaction volume
 * @param {object} [opts.accountOverrides]       { accountId: targetBalance } overrides
 * @param {boolean} [opts.clearExisting=false]   delete existing transactions before generating
 * @returns {Promise<{ transactionsInserted: number, accounts: array }>}
 */
export async function generatePersonaHistory({
  userId,
  occupationId,
  rankOrClass  = 'mid',
  personalityId = null,
  historyStartDate = null,
  activityIntensity = 1.0,
  accountOverrides  = {},
  clearExisting     = false,
}) {
  const occupation  = getOccupation(occupationId);
  if (!occupation)  throw Object.assign(new Error(`Unknown occupation: ${occupationId}`), { code: 'INVALID_OCCUPATION' });

  const personality = personalityId ? getPersonality(personalityId) : null;

  const START = historyStartDate
    ? new Date(historyStartDate)
    : new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000); // 18 months ago
  const END = new Date();

  if (START >= END) throw Object.assign(new Error('historyStartDate must be in the past'), { code: 'INVALID_DATE' });

  const user = await User.findById(userId).populate('accounts');
  if (!user) throw Object.assign(new Error('User not found'), { code: 'USER_NOT_FOUND' });

  const accounts = await BankAccount.find({ user: userId, status: { $ne: 'closed' } });
  if (accounts.length === 0) throw Object.assign(new Error('User has no active accounts'), { code: 'NO_ACCOUNTS' });

  const pattern = buildPersonaPattern(occupation, rankOrClass, personality, activityIntensity);

  if (clearExisting) {
    await Transaction.deleteMany({ user: userId });
  }

  let totalInserted = 0;
  const accountResults = [];

  for (const account of accounts) {
    const targetBalance = accountOverrides[String(account._id)] != null
      ? parseFloat(accountOverrides[String(account._id)])
      : account.availableBalance > 0
        ? account.availableBalance
        : account.accountType === 'savings' ? 5000 : 3000;

    // Savings accounts get a simpler pattern
    const isSavings = account.accountType === 'savings';
    const events = isSavings
      ? buildSavingsTransactions(userId, account._id, pattern, START, END)
      : buildTransactions(userId, account._id, occupation, pattern, START, END);

    let netFlow = 0;
    for (const e of events) netFlow += e.type === 'credit' ? e.amount : -e.amount;
    const startBalance = Math.max(isSavings ? 100 : 50, round2(targetBalance - netFlow));

    let running = startBalance;
    const txDocs = events.map((e) => {
      running = round2(e.type === 'credit' ? running + e.amount : Math.max(0, running - e.amount));
      return {
        user:            userId,
        account:         account._id,
        type:            e.type,
        category:        e.category,
        amount:          e.amount,
        description:     e.description,
        merchant:        e.merchant ?? null,
        status:          'completed',
        referenceNumber: genRef(),
        balanceAfter:    running,
        transactionDate: e.transactionDate,
      };
    });

    if (txDocs.length > 0) {
      await Transaction.insertMany(txDocs, { ordered: false });
    }

    const finalBalance = txDocs.length > 0 ? txDocs[txDocs.length - 1].balanceAfter : targetBalance;
    const safeBalance  = Math.max(0, round2(finalBalance));
    await BankAccount.findByIdAndUpdate(account._id, {
      balance:          safeBalance,
      availableBalance: safeBalance,
    });

    totalInserted += txDocs.length;
    accountResults.push({
      accountId:   String(account._id),
      accountName: account.accountName,
      accountType: account.accountType,
      transactions: txDocs.length,
      finalBalance: safeBalance,
    });
  }

  return { transactionsInserted: totalInserted, accounts: accountResults };
}

// ── Savings-specific transaction builder ──────────────────────────
function buildSavingsTransactions(userId, accountId, pattern, START, END) {
  const events = [];

  // Monthly interest
  const approxBalance = 8000;
  const rate = 0.042;
  for (const d of eachMonth(START, END, 1)) {
    events.push({ transactionDate: setHour(d, 6, 0), type: 'credit', category: 'deposit',
      amount: round2((approxBalance * rate / 12) * rand(0.95, 1.05)),
      description: achInterest(), merchant: 'Bank of Molten' });
  }

  // Transfers in from checking
  if (pattern.transferToSavings.monthlyChance > 0) {
    for (const d of eachMonth(START, END, 25)) {
      if (Math.random() < pattern.transferToSavings.monthlyChance) {
        const txDate = setHour(d, 9, 5);
        events.push({ transactionDate: txDate, type: 'credit', category: 'transfer',
          amount: round2(rand(pattern.transferToSavings.amountMin, pattern.transferToSavings.amountMax)),
          description: achCheckingTransfer(txDate), merchant: 'Internal Transfer' });
      }
    }
  }

  // Occasional withdrawals
  for (const d of eachMonth(START, END, 15)) {
    if (Math.random() < 0.15) {
      const [rMin, rMax] = [pattern.transferToSavings.amountMin, pattern.transferToSavings.amountMax];
      const txDate = businessHour(d);
      events.push({ transactionDate: txDate, type: 'debit', category: 'transfer',
        amount: round2(rand(rMin * 0.3, rMax * 0.3)),
        description: achTransferOut(), merchant: 'Internal Transfer' });
    }
  }

  events.sort((a, b) => a.transactionDate - b.transactionDate);
  return events;
}
