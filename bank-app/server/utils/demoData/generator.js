// ── Transaction generation engine ─────────────────────────────────
import { PATTERNS } from './patterns.js';
import {
  EMPLOYERS, DINING, GROCERIES, SHOPPING, SUBSCRIPTIONS,
  UTILITIES, AIRLINES, HOTELS, TRANSPORT, HEALTHCARE,
  FUEL, ZELLE_CONTACTS, BUSINESS_VENDORS, ROUTING_NUMBERS,
} from './merchants.js';

// ── Helpers ────────────────────────────────────────────────────────
const rand  = (min, max) => Math.random() * (max - min) + min;
const randI = (min, max) => Math.floor(rand(min, max + 1));
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const round2 = (n) => Math.round(n * 100) / 100;

function genRef() {
  return (
    'TXN' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function setHour(date, h, m, s) {
  const d = new Date(date);
  d.setHours(h, m ?? randI(0, 59), s ?? randI(0, 59), 0);
  return d;
}

function businessHour(date) {
  return setHour(date, randI(8, 20), randI(0, 59));
}

function eveHour(date) {
  return setHour(date, randI(17, 22), randI(0, 59));
}

function morningHour(date) {
  return setHour(date, randI(6, 10), randI(0, 59));
}

// Jitter date by ±jitterDays, staying within [start, end]
function jitter(date, jitterDays, start, end) {
  const ms = jitterDays * 24 * 60 * 60 * 1000;
  const offset = (Math.random() - 0.5) * 2 * ms;
  const result = new Date(date.getTime() + offset);
  if (result < start) return new Date(start);
  if (result > end)   return new Date(end);
  return result;
}

// Iterate every week between two dates
function* eachWeek(start, end) {
  let cur = new Date(start);
  while (cur <= end) {
    yield new Date(cur);
    cur = addDays(cur, 7);
  }
}

// Iterate every N days between two dates
function* everyNDays(start, end, n) {
  let cur = new Date(start);
  while (cur <= end) {
    yield new Date(cur);
    cur = addDays(cur, n);
  }
}

// Iterate every month between two dates, on a fixed dayOfMonth
function* eachMonth(start, end, dayOfMonth) {
  let cur = new Date(start.getFullYear(), start.getMonth(), dayOfMonth);
  if (cur < start) {
    cur.setMonth(cur.getMonth() + 1);
  }
  while (cur <= end) {
    yield new Date(cur);
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, dayOfMonth);
  }
}

// ── Main generator ────────────────────────────────────────────────
export function generateTransactions(userId, accountId, userType, targetBalance) {
  const pattern  = PATTERNS[userType] ?? PATTERNS.standard;
  const START    = new Date('2024-01-01T00:00:00Z');
  const END      = new Date();
  const events   = [];

  // Pick stable employer for the user
  const employer = pick(EMPLOYERS[userType] ?? EMPLOYERS.standard);

  // Subscriptions chosen once, fixed billing day per sub
  const subPool  = SUBSCRIPTIONS[userType] ?? SUBSCRIPTIONS.standard;
  const subCount = Math.min(pattern.subscriptions.count, subPool.length);
  const subList  = [...subPool].sort(() => Math.random() - 0.5).slice(0, subCount).map((s, i) => ({
    ...s,
    billingDay: [3, 5, 8, 10, 12, 15, 18, 20, 22, 25][i % 10],
  }));

  // Utilities chosen once
  const utilCount = pattern.utilities.count;
  const utilList  = [...UTILITIES].sort(() => Math.random() - 0.5).slice(0, utilCount);

  // ── Payroll ──────────────────────────────────────────────────────
  const payAmount = round2(rand(pattern.payroll.amountMin, pattern.payroll.amountMax));
  const payDesc   = pattern.payroll.description(employer);

  if (pattern.payroll.schedule === 'biweekly') {
    const firstPay = new Date(`2024-01-${String(pattern.payroll.startDay).padStart(2, '0')}T09:00:00Z`);
    for (const d of everyNDays(firstPay, END, 14)) {
      events.push({
        transactionDate: morningHour(d),
        type:       'credit',
        category:   'payroll',
        amount:     round2(payAmount * rand(0.96, 1.04)),
        description: payDesc,
        merchant:   employer,
      });
    }
  } else {
    // monthly
    for (const d of eachMonth(START, END, pattern.payroll.startDay)) {
      events.push({
        transactionDate: morningHour(d),
        type:       'credit',
        category:   'payroll',
        amount:     round2(payAmount * rand(0.95, 1.05)),
        description: payDesc,
        merchant:   employer,
      });
    }
  }

  // ── Housing (rent / mortgage) ────────────────────────────────────
  if (pattern.housing) {
    const h = pattern.housing;
    const housingAmt = round2(rand(h.amountMin, h.amountMax));
    for (const d of eachMonth(START, END, h.dayOfMonth)) {
      events.push({
        transactionDate: setHour(d, 8, 0),
        type:       'debit',
        category:   'transfer',
        amount:     round2(housingAmt * rand(0.998, 1.002)),
        description: h.description,
        merchant:   h.merchant,
      });
    }
  }

  // ── Subscriptions (monthly, fixed day) ───────────────────────────
  for (const sub of subList) {
    for (const d of eachMonth(START, END, sub.billingDay)) {
      events.push({
        transactionDate: setHour(d, randI(0, 5), randI(0, 59)),
        type:       'debit',
        category:   'subscription',
        amount:     round2(sub.amount * rand(0.99, 1.01)),
        description: sub.desc || `${sub.name} Monthly`,
        merchant:   sub.name,
      });
    }
  }

  // ── Utilities (monthly, varied days) ────────────────────────────
  for (const util of utilList) {
    const utilDay = randI(10, 28);
    for (const d of eachMonth(START, END, utilDay)) {
      events.push({
        transactionDate: businessHour(d),
        type:       'debit',
        category:   'utilities',
        amount:     round2(rand(util.min, util.max)),
        description: `${util.name} - Monthly Bill`,
        merchant:   util.name,
      });
    }
  }

  // ── Groceries (weekly) ───────────────────────────────────────────
  if (pattern.groceries.weeklyTrips > 0) {
    const groceryDay = randI(0, 6);
    for (const week of eachWeek(START, END)) {
      const d = addDays(week, groceryDay);
      if (d > END) break;
      for (let t = 0; t < pattern.groceries.weeklyTrips; t++) {
        events.push({
          transactionDate: businessHour(jitter(d, 1, START, END)),
          type:       'debit',
          category:   'shopping',
          amount:     round2(rand(pattern.groceries.amountMin, pattern.groceries.amountMax)),
          description: 'Grocery Purchase',
          merchant:   pick(GROCERIES),
        });
      }
    }
  }

  // ── Dining (multiple per week) ───────────────────────────────────
  const diningPool = DINING[pattern.dining.tier] ?? DINING.standard;
  const diningDaysPerWeek = pattern.dining.weeklyTrips;
  for (const week of eachWeek(START, END)) {
    // Pick random days in this week for dining
    const days = Array.from({ length: 7 }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, diningDaysPerWeek);
    for (const offset of days) {
      const d = addDays(week, offset);
      if (d > END) break;
      events.push({
        transactionDate: eveHour(d),
        type:       'debit',
        category:   'dining',
        amount:     round2(rand(pattern.dining.amountMin, pattern.dining.amountMax)),
        description: 'Restaurant / Food',
        merchant:   pick(diningPool),
      });
    }
  }

  // ── Shopping (probabilistic per week) ───────────────────────────
  if (pattern.shopping.weeklyChance > 0) {
    const shoppingPool = SHOPPING[pattern.shopping.tier] ?? SHOPPING.everyday;
    for (const week of eachWeek(START, END)) {
      if (Math.random() < pattern.shopping.weeklyChance) {
        const d = addDays(week, randI(0, 6));
        if (d > END) break;
        events.push({
          transactionDate: businessHour(d),
          type:       'debit',
          category:   'shopping',
          amount:     round2(rand(pattern.shopping.amountMin, pattern.shopping.amountMax)),
          description: 'Retail Purchase',
          merchant:   pick(shoppingPool),
        });
      }
    }
  }

  // ── ATM ──────────────────────────────────────────────────────────
  if (pattern.atm.monthlyWithdrawals > 0) {
    for (const d of eachMonth(START, END, 15)) {
      for (let i = 0; i < pattern.atm.monthlyWithdrawals; i++) {
        const day = jitter(d, 7, START, END);
        events.push({
          transactionDate: businessHour(day),
          type:       'debit',
          category:   'atm',
          amount:     round2(rand(pattern.atm.amountMin, pattern.atm.amountMax)),
          description: 'ATM Withdrawal',
          merchant:   'ATM',
        });
      }
    }
  }

  // ── Fuel ────────────────────────────────────────────────────────
  if (pattern.fuel.weeklyChance > 0) {
    for (const week of eachWeek(START, END)) {
      if (Math.random() < pattern.fuel.weeklyChance) {
        const d = addDays(week, randI(0, 6));
        if (d > END) break;
        events.push({
          transactionDate: morningHour(d),
          type:       'debit',
          category:   'other',
          amount:     round2(rand(pattern.fuel.amountMin, pattern.fuel.amountMax)),
          description: 'Fuel / Gas',
          merchant:   pick(FUEL),
        });
      }
    }
  }

  // ── Healthcare ───────────────────────────────────────────────────
  if (pattern.healthcare.monthlyChance > 0) {
    for (const d of eachMonth(START, END, randI(1, 28))) {
      if (Math.random() < pattern.healthcare.monthlyChance) {
        const hcItem = pick(HEALTHCARE);
        events.push({
          transactionDate: businessHour(d),
          type:       'debit',
          category:   'healthcare',
          amount:     round2(rand(hcItem.min, hcItem.max)),
          description: 'Healthcare / Medical',
          merchant:   hcItem.name,
        });
      }
    }
  }

  // ── Travel (clustered into trips) ───────────────────────────────
  if (pattern.travel.tripsPerYear > 0) {
    const tripsTotal = Math.round(pattern.travel.tripsPerYear * (
      (END.getFullYear() - 2024) + (END.getMonth() + 1) / 12
    ));
    const hotelTierMap = { economy: 'standard', business: 'premium', first: 'wealthy' };
    const airlinePool  = AIRLINES;
    const hotelPool    = HOTELS[hotelTierMap[pattern.travel.tier]] ?? HOTELS.standard;
    const tripCount   = Math.max(1, tripsTotal);

    for (let t = 0; t < tripCount; t++) {
      // Random trip start within the date range
      const msRange  = END.getTime() - START.getTime();
      const tripStart = new Date(START.getTime() + Math.random() * msRange * 0.9);
      const tripDays  = randI(3, 10);

      // Outbound flight
      events.push({
        transactionDate: morningHour(tripStart),
        type:       'debit',
        category:   'travel',
        amount:     round2(rand(
          pattern.travel.tier === 'first' ? 1500 : pattern.travel.tier === 'business' ? 600 : 200,
          pattern.travel.tier === 'first' ? 8000 : pattern.travel.tier === 'business' ? 2500 : 700,
        )),
        description: 'Airfare',
        merchant:   pick(airlinePool),
      });

      // Hotel (nightly charges)
      const hotelNights = tripDays - 1;
      for (let n = 0; n < hotelNights; n++) {
        const hotelDay = addDays(tripStart, n + 1);
        if (hotelDay > END) break;
        events.push({
          transactionDate: setHour(hotelDay, 12, 0),
          type:       'debit',
          category:   'travel',
          amount:     round2(rand(
            pattern.travel.tier === 'first' ? 400 : pattern.travel.tier === 'business' ? 180 : 80,
            pattern.travel.tier === 'first' ? 1200 : pattern.travel.tier === 'business' ? 450 : 220,
          )),
          description: 'Hotel Stay',
          merchant:   pick(hotelPool),
        });
      }

      // Ground transport during trip
      const transportCount = randI(2, 5);
      for (let i = 0; i < transportCount; i++) {
        const day = addDays(tripStart, randI(0, tripDays));
        if (day > END) break;
        events.push({
          transactionDate: businessHour(day),
          type:       'debit',
          category:   'travel',
          amount:     round2(rand(8, 60)),
          description: 'Ground Transportation',
          merchant:   pick(TRANSPORT),
        });
      }
    }
  }

  // ── Zelle transfers ──────────────────────────────────────────────
  if (pattern.zelle && pattern.zelle.monthlyTransfers > 0) {
    for (const d of eachMonth(START, END, 10)) {
      const count = pattern.zelle.monthlyTransfers;
      for (let i = 0; i < count; i++) {
        const day = jitter(d, 10, START, END);
        const contact = pick(ZELLE_CONTACTS);
        const isCredit = Math.random() < 0.35;
        events.push({
          transactionDate: businessHour(day),
          type:       isCredit ? 'credit' : 'debit',
          category:   'zelle',
          amount:     round2(rand(pattern.zelle.amountMin, pattern.zelle.amountMax)),
          description: isCredit ? `Zelle from ${contact}` : `Zelle to ${contact}`,
          merchant:   'Zelle',
        });
      }
    }
  }

  // ── Business vendor payments ─────────────────────────────────────
  if (pattern.businessPayments && pattern.businessPayments.monthlyVendors > 0) {
    for (const d of eachMonth(START, END, 20)) {
      const count = pattern.businessPayments.monthlyVendors;
      for (let i = 0; i < count; i++) {
        const day = jitter(d, 8, START, END);
        events.push({
          transactionDate: businessHour(day),
          type:       'debit',
          category:   'billpay',
          amount:     round2(rand(pattern.businessPayments.amountMin, pattern.businessPayments.amountMax)),
          description: 'Vendor Payment',
          merchant:   pick(BUSINESS_VENDORS),
        });
      }
    }
  }

  // ── Wire transfers ───────────────────────────────────────────────
  if (pattern.wires && pattern.wires.monthlyChance > 0) {
    for (const d of eachMonth(START, END, 20)) {
      if (Math.random() < pattern.wires.monthlyChance) {
        const isCredit = Math.random() < 0.30;
        events.push({
          transactionDate: businessHour(d),
          type:       isCredit ? 'credit' : 'debit',
          category:   'wire',
          amount:     round2(rand(pattern.wires.amountMin, pattern.wires.amountMax)),
          description: isCredit ? 'Incoming Wire Transfer' : 'Outgoing Wire Transfer',
          merchant:   'Wire Transfer',
        });
      }
    }
  }

  // ── Transfer to savings (monthly) ───────────────────────────────
  if (pattern.transferToSavings && pattern.transferToSavings.monthlyChance > 0) {
    for (const d of eachMonth(START, END, 25)) {
      if (Math.random() < pattern.transferToSavings.monthlyChance) {
        events.push({
          transactionDate: setHour(d, 9, 0),
          type:       'debit',
          category:   'transfer',
          amount:     round2(rand(pattern.transferToSavings.amountMin, pattern.transferToSavings.amountMax)),
          description: 'Transfer to Savings',
          merchant:   'Internal Transfer',
        });
      }
    }
  }

  // ── Sort all events chronologically ─────────────────────────────
  events.sort((a, b) => a.transactionDate - b.transactionDate);

  // ── Compute startBalance so final balance ≈ targetBalance ────────
  let netFlow = 0;
  for (const e of events) {
    if (e.type === 'credit') netFlow += e.amount;
    else                     netFlow -= e.amount;
  }

  // Clamp startBalance to a sensible minimum
  const startBalance = Math.max(50, round2(targetBalance - netFlow));

  // ── Compute running balanceAfter for each transaction ────────────
  let running = startBalance;
  const transactions = events.map((e) => {
    if (e.type === 'credit') running = round2(running + e.amount);
    else                     running = round2(Math.max(0, running - e.amount));

    return {
      user:            userId,
      account:         accountId,
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

  return { transactions, startBalance };
}

// ── Savings account: fewer, simpler transactions ──────────────────
export function generateSavingsTransactions(userId, accountId, userType, targetBalance) {
  const pattern = PATTERNS[userType] ?? PATTERNS.standard;
  const START   = new Date('2024-01-01T00:00:00Z');
  const END     = new Date();
  const events  = [];

  // Monthly interest credit (small)
  const interestRate = userType === 'wealthy' ? 0.045 : userType === 'premium' ? 0.042 : 0.038;
  const approxAvg    = (pattern.savings.balanceMin + pattern.savings.balanceMax) / 2;

  for (const d of eachMonth(START, END, 1)) {
    const monthlyInterest = round2((approxAvg * interestRate) / 12 * rand(0.95, 1.05));
    events.push({
      transactionDate: setHour(d, 6, 0),
      type:       'credit',
      category:   'deposit',
      amount:     monthlyInterest,
      description: 'Interest Credit',
      merchant:   'Bank of Molten',
    });
  }

  // Transfers in from checking (mirrors the checking outflow)
  if (pattern.transferToSavings && pattern.transferToSavings.monthlyChance > 0) {
    for (const d of eachMonth(START, END, 25)) {
      if (Math.random() < pattern.transferToSavings.monthlyChance) {
        events.push({
          transactionDate: setHour(d, 9, 5),
          type:       'credit',
          category:   'transfer',
          amount:     round2(rand(pattern.transferToSavings.amountMin, pattern.transferToSavings.amountMax)),
          description: 'Transfer from Checking',
          merchant:   'Internal Transfer',
        });
      }
    }
  }

  // Occasional withdrawals from savings
  for (const d of eachMonth(START, END, 15)) {
    if (Math.random() < 0.15) {
      events.push({
        transactionDate: businessHour(d),
        type:       'debit',
        category:   'transfer',
        amount:     round2(rand(200, 2000) * (userType === 'wealthy' ? 10 : userType === 'premium' ? 3 : 1)),
        description: 'Transfer to Checking',
        merchant:   'Internal Transfer',
      });
    }
  }

  events.sort((a, b) => a.transactionDate - b.transactionDate);

  let netFlow = 0;
  for (const e of events) {
    if (e.type === 'credit') netFlow += e.amount;
    else                     netFlow -= e.amount;
  }

  const startBalance = Math.max(100, round2(targetBalance - netFlow));
  let running = startBalance;

  const transactions = events.map((e) => {
    if (e.type === 'credit') running = round2(running + e.amount);
    else                     running = round2(Math.max(0, running - e.amount));

    return {
      user:            userId,
      account:         accountId,
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

  return { transactions, startBalance };
}
