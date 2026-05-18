// ── Per-user-type behavioral profiles ─────────────────────────────

export const PATTERNS = {
  standard: {
    payroll: {
      schedule:    'biweekly',   // every 14 days
      startDay:    10,           // first paycheck on Jan 10
      amountMin:   2800,
      amountMax:   4200,
      description: (employer) => `Direct Deposit - ${employer}`,
    },
    housing: {
      type:       'rent',
      dayOfMonth: 1,
      amountMin:  1400,
      amountMax:  2200,
      merchant:   'Landlord / Property Mgmt',
      description: 'Monthly Rent Payment',
    },
    checking: { balanceMin: 1200,  balanceMax: 6000  },
    savings:  { balanceMin: 800,   balanceMax: 8000  },
    subscriptions: { count: 3, tier: 'standard' },
    groceries: {
      weeklyTrips: 1,
      amountMin:   55,
      amountMax:   140,
    },
    dining: {
      weeklyTrips: 3,
      amountMin:   9,
      amountMax:   38,
      tier:        'standard',
    },
    shopping: {
      weeklyChance: 0.45,
      amountMin:    18,
      amountMax:    120,
      tier:         'everyday',
    },
    atm: {
      monthlyWithdrawals: 2,
      amountMin: 40,
      amountMax: 200,
    },
    fuel: {
      weeklyChance: 0.55,
      amountMin:    35,
      amountMax:    75,
    },
    utilities: { count: 2 },
    healthcare: {
      monthlyChance: 0.20,
      amountMin:     15,
      amountMax:     80,
    },
    travel: {
      tripsPerYear: 1,
      tier:         'economy',
    },
    zelle: {
      monthlyTransfers: 2,
      amountMin: 20,
      amountMax: 150,
    },
    transferToSavings: {
      monthlyChance: 0.70,
      amountMin: 100,
      amountMax: 400,
    },
  },

  premium: {
    payroll: {
      schedule:    'biweekly',
      startDay:    15,
      amountMin:   7500,
      amountMax:   14000,
      description: (employer) => `Direct Deposit - ${employer}`,
    },
    housing: {
      type:        'rent',
      dayOfMonth:  1,
      amountMin:   3800,
      amountMax:   6500,
      merchant:    'Luxury Property Management',
      description: 'Monthly Rent / Mortgage',
    },
    checking: { balanceMin: 8000,  balanceMax: 35000 },
    savings:  { balanceMin: 15000, balanceMax: 80000 },
    subscriptions: { count: 6, tier: 'premium' },
    groceries: {
      weeklyTrips: 1,
      amountMin:   120,
      amountMax:   280,
    },
    dining: {
      weeklyTrips: 4,
      amountMin:   35,
      amountMax:   150,
      tier:        'premium',
    },
    shopping: {
      weeklyChance: 0.65,
      amountMin:    80,
      amountMax:    600,
      tier:         'premium',
    },
    atm: {
      monthlyWithdrawals: 1,
      amountMin: 100,
      amountMax: 500,
    },
    fuel: {
      weeklyChance: 0.35,
      amountMin:    60,
      amountMax:    120,
    },
    utilities: { count: 3 },
    healthcare: {
      monthlyChance: 0.25,
      amountMin:     30,
      amountMax:     200,
    },
    travel: {
      tripsPerYear: 4,
      tier:         'business',
    },
    zelle: {
      monthlyTransfers: 3,
      amountMin: 50,
      amountMax: 500,
    },
    transferToSavings: {
      monthlyChance: 0.85,
      amountMin: 500,
      amountMax: 2500,
    },
  },

  wealthy: {
    payroll: {
      schedule:    'monthly',
      startDay:    28,
      amountMin:   25000,
      amountMax:   80000,
      description: (employer) => `Wire Credit - ${employer}`,
    },
    housing: {
      type:        'mortgage',
      dayOfMonth:  5,
      amountMin:   8000,
      amountMax:   18000,
      merchant:    'First National Mortgage',
      description: 'Mortgage Payment - Property',
    },
    checking: { balanceMin: 40000,  balanceMax: 150000 },
    savings:  { balanceMin: 120000, balanceMax: 500000 },
    subscriptions: { count: 8, tier: 'wealthy' },
    groceries: {
      weeklyTrips: 1,
      amountMin:   300,
      amountMax:   700,
    },
    dining: {
      weeklyTrips: 5,
      amountMin:   80,
      amountMax:   400,
      tier:        'wealthy',
    },
    shopping: {
      weeklyChance: 0.75,
      amountMin:    300,
      amountMax:    3000,
      tier:         'luxury',
    },
    atm: {
      monthlyWithdrawals: 0,
      amountMin: 0,
      amountMax: 0,
    },
    fuel: {
      weeklyChance: 0.20,
      amountMin:    80,
      amountMax:    200,
    },
    utilities: { count: 4 },
    healthcare: {
      monthlyChance: 0.35,
      amountMin:     100,
      amountMax:     800,
    },
    travel: {
      tripsPerYear: 8,
      tier:         'first',
    },
    zelle: {
      monthlyTransfers: 1,
      amountMin: 500,
      amountMax: 5000,
    },
    wires: {
      monthlyChance: 0.40,
      amountMin: 5000,
      amountMax: 50000,
    },
    transferToSavings: {
      monthlyChance: 0.90,
      amountMin: 5000,
      amountMax: 30000,
    },
  },

  business: {
    payroll: {
      schedule:    'monthly',
      startDay:    15,
      amountMin:   18000,
      amountMax:   45000,
      description: (employer) => `ACH Credit - ${employer} Revenue`,
    },
    housing: {
      type:        'lease',
      dayOfMonth:  1,
      amountMin:   4500,
      amountMax:   12000,
      merchant:    'Commercial Property LLC',
      description: 'Office / Commercial Lease Payment',
    },
    checking: { balanceMin: 25000,  balanceMax: 120000 },
    savings:  { balanceMin: 50000,  balanceMax: 250000 },
    subscriptions: { count: 10, tier: 'business' },
    groceries: {
      weeklyTrips: 0,
      amountMin:   0,
      amountMax:   0,
    },
    dining: {
      weeklyTrips: 4,
      amountMin:   40,
      amountMax:   200,
      tier:        'premium',
    },
    shopping: {
      weeklyChance: 0.50,
      amountMin:    200,
      amountMax:    2000,
      tier:         'premium',
    },
    atm: {
      monthlyWithdrawals: 0,
      amountMin: 0,
      amountMax: 0,
    },
    fuel: {
      weeklyChance: 0.30,
      amountMin:    60,
      amountMax:    150,
    },
    utilities: { count: 4 },
    healthcare: {
      monthlyChance: 0.15,
      amountMin:     50,
      amountMax:     300,
    },
    travel: {
      tripsPerYear: 6,
      tier:         'business',
    },
    zelle: {
      monthlyTransfers: 0,
      amountMin: 0,
      amountMax: 0,
    },
    businessPayments: {
      monthlyVendors: 4,
      amountMin: 800,
      amountMax: 8000,
    },
    wires: {
      monthlyChance: 0.60,
      amountMin: 3000,
      amountMax: 40000,
    },
    transferToSavings: {
      monthlyChance: 0.80,
      amountMin: 3000,
      amountMax: 20000,
    },
  },
};
