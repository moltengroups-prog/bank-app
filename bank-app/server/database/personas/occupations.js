// Occupation definitions for the Financial Persona System.
// Each occupation drives income, payroll schedule, employer name, and base spending pattern.

export const OCCUPATIONS = [
  // ── Military ───────────────────────────────────────────────────────
  {
    id:       'army',
    label:    'U.S. Army',
    category: 'military',
    ranks:    ['Private', 'Corporal', 'Sergeant', 'Staff Sergeant', 'Sergeant First Class', 'Master Sergeant', 'Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel'],
    incomeByRank: {
      Private:              [22000,  26000],
      Corporal:             [25000,  30000],
      Sergeant:             [28000,  36000],
      'Staff Sergeant':     [32000,  44000],
      'Sergeant First Class':[38000, 54000],
      'Master Sergeant':    [46000,  62000],
      Lieutenant:           [44000,  60000],
      Captain:              [58000,  80000],
      Major:                [72000,  95000],
      'Lieutenant Colonel': [88000, 115000],
      Colonel:              [105000, 140000],
    },
    defaultRank:     'Sergeant',
    employer:        'U.S. Department of Defense',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'bah', // Basic Allowance for Housing
  },
  {
    id:       'navy',
    label:    'U.S. Navy',
    category: 'military',
    ranks:    ['Seaman', 'Petty Officer', 'Chief Petty Officer', 'Ensign', 'Lieutenant', 'Lieutenant Commander', 'Commander', 'Captain'],
    incomeByRank: {
      Seaman:                [22000, 27000],
      'Petty Officer':       [27000, 38000],
      'Chief Petty Officer': [42000, 58000],
      Ensign:                [40000, 52000],
      Lieutenant:            [55000, 75000],
      'Lieutenant Commander':[70000, 92000],
      Commander:             [88000, 118000],
      Captain:               [105000, 145000],
    },
    defaultRank:     'Petty Officer',
    employer:        'U.S. Department of the Navy',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'bah',
  },
  {
    id:       'air_force',
    label:    'U.S. Air Force',
    category: 'military',
    ranks:    ['Airman', 'Senior Airman', 'Staff Sergeant', 'Technical Sergeant', 'Master Sergeant', '2nd Lieutenant', '1st Lieutenant', 'Captain', 'Major', 'Colonel'],
    incomeByRank: {
      Airman:              [22000, 26000],
      'Senior Airman':     [26000, 35000],
      'Staff Sergeant':    [32000, 44000],
      'Technical Sergeant':[40000, 54000],
      'Master Sergeant':   [48000, 65000],
      '2nd Lieutenant':    [40000, 52000],
      '1st Lieutenant':    [50000, 65000],
      Captain:             [60000, 82000],
      Major:               [74000, 98000],
      Colonel:             [108000, 145000],
    },
    defaultRank:     'Staff Sergeant',
    employer:        'U.S. Department of the Air Force',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'bah',
  },
  {
    id:       'police',
    label:    'Police Officer',
    category: 'military',
    ranks:    ['Patrol Officer', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'Deputy Chief', 'Chief'],
    incomeByRank: {
      'Patrol Officer': [42000, 58000],
      Corporal:         [50000, 66000],
      Sergeant:         [58000, 78000],
      Lieutenant:       [70000, 94000],
      Captain:          [82000, 110000],
      'Deputy Chief':   [95000, 130000],
      Chief:            [115000, 165000],
    },
    defaultRank:     'Patrol Officer',
    employer:        'City Police Department',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'rent',
  },

  // ── Professional ──────────────────────────────────────────────────
  {
    id:       'doctor',
    label:    'Physician / Doctor',
    category: 'professional',
    incomeRange: {
      entry:  [120000, 180000],
      mid:    [180000, 280000],
      senior: [280000, 450000],
    },
    employer:        'Regional Medical Center',
    payrollSchedule: 'biweekly',
    patternBase:     'wealthy',
    housingType:     'mortgage',
  },
  {
    id:       'lawyer',
    label:    'Attorney / Lawyer',
    category: 'professional',
    incomeRange: {
      entry:  [75000, 130000],
      mid:    [130000, 250000],
      senior: [250000, 500000],
    },
    employer:        'Hartley & Associates Law Group',
    payrollSchedule: 'monthly',
    patternBase:     'premium',
    housingType:     'mortgage',
  },
  {
    id:       'engineer',
    label:    'Software Engineer',
    category: 'professional',
    incomeRange: {
      entry:  [75000, 110000],
      mid:    [110000, 175000],
      senior: [175000, 300000],
    },
    employer:        'Meridian Technologies Inc.',
    payrollSchedule: 'biweekly',
    patternBase:     'premium',
    housingType:     'rent',
  },
  {
    id:       'pharmacist',
    label:    'Pharmacist',
    category: 'professional',
    incomeRange: {
      entry:  [90000, 115000],
      mid:    [115000, 145000],
      senior: [145000, 180000],
    },
    employer:        'HealthFirst Pharmacy',
    payrollSchedule: 'biweekly',
    patternBase:     'premium',
    housingType:     'mortgage',
  },
  {
    id:       'architect',
    label:    'Architect',
    category: 'professional',
    incomeRange: {
      entry:  [55000, 78000],
      mid:    [78000, 120000],
      senior: [120000, 200000],
    },
    employer:        'Stonebridge Design Group',
    payrollSchedule: 'biweekly',
    patternBase:     'premium',
    housingType:     'mortgage',
  },
  {
    id:       'accountant',
    label:    'CPA / Accountant',
    category: 'professional',
    incomeRange: {
      entry:  [50000, 72000],
      mid:    [72000, 115000],
      senior: [115000, 190000],
    },
    employer:        'Grant & Werner Accounting',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'rent',
  },
  {
    id:       'professor',
    label:    'College Professor',
    category: 'professional',
    incomeRange: {
      entry:  [45000, 65000],
      mid:    [65000, 95000],
      senior: [95000, 150000],
    },
    employer:        'State University',
    payrollSchedule: 'monthly',
    patternBase:     'standard',
    housingType:     'rent',
  },

  // ── Trades ────────────────────────────────────────────────────────
  {
    id:       'construction',
    label:    'Construction Worker',
    category: 'trades',
    incomeRange: {
      entry:  [35000, 48000],
      mid:    [48000, 68000],
      senior: [68000, 95000],
    },
    employer:        'Ironwork Construction Co.',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'rent',
  },
  {
    id:       'farmer',
    label:    'Farmer / Agricultural Worker',
    category: 'trades',
    incomeRange: {
      entry:  [28000, 42000],
      mid:    [42000, 75000],
      senior: [75000, 180000],
    },
    employer:        'Self-Employed / Farm Operations',
    payrollSchedule: 'monthly',
    patternBase:     'standard',
    housingType:     'mortgage',
  },
  {
    id:       'electrician',
    label:    'Electrician',
    category: 'trades',
    incomeRange: {
      entry:  [40000, 55000],
      mid:    [55000, 80000],
      senior: [80000, 115000],
    },
    employer:        'Volt Electric Services',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'rent',
  },
  {
    id:       'truck_driver',
    label:    'Truck Driver (CDL)',
    category: 'trades',
    incomeRange: {
      entry:  [42000, 58000],
      mid:    [58000, 78000],
      senior: [78000, 110000],
    },
    employer:        'Midwest Freight Logistics',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'rent',
  },
  {
    id:       'mechanic',
    label:    'Auto Mechanic',
    category: 'trades',
    incomeRange: {
      entry:  [32000, 46000],
      mid:    [46000, 65000],
      senior: [65000, 90000],
    },
    employer:        'AutoPro Service Center',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'rent',
  },

  // ── Business ─────────────────────────────────────────────────────
  {
    id:       'business_owner',
    label:    'Small Business Owner',
    category: 'business',
    incomeRange: {
      entry:  [40000, 80000],
      mid:    [80000, 175000],
      senior: [175000, 500000],
    },
    employer:        'Self-Employed',
    payrollSchedule: 'monthly',
    patternBase:     'business',
    housingType:     'mortgage',
  },
  {
    id:       'executive',
    label:    'Corporate Executive',
    category: 'business',
    incomeRange: {
      entry:  [100000, 175000],
      mid:    [175000, 350000],
      senior: [350000, 800000],
    },
    employer:        'Apex Global Corp',
    payrollSchedule: 'biweekly',
    patternBase:     'wealthy',
    housingType:     'mortgage',
  },
  {
    id:       'consultant',
    label:    'Business Consultant',
    category: 'business',
    incomeRange: {
      entry:  [60000, 95000],
      mid:    [95000, 180000],
      senior: [180000, 380000],
    },
    employer:        'Nexus Strategy Consulting',
    payrollSchedule: 'monthly',
    patternBase:     'premium',
    housingType:     'rent',
  },

  // ── Entry-level ──────────────────────────────────────────────────
  {
    id:       'retail_worker',
    label:    'Retail Worker',
    category: 'entry',
    incomeRange: {
      entry:  [22000, 30000],
      mid:    [30000, 40000],
      senior: [40000, 55000],
    },
    employer:        'Sunridge Mall Retail',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'rent',
  },
  {
    id:       'student',
    label:    'College Student',
    category: 'entry',
    incomeRange: {
      entry:  [8000, 15000],
      mid:    [15000, 25000],
      senior: [25000, 40000],
    },
    employer:        'Part-Time Employment',
    payrollSchedule: 'biweekly',
    patternBase:     'standard',
    housingType:     'rent',
  },
  {
    id:       'graduate_assistant',
    label:    'Graduate Research Assistant',
    category: 'entry',
    incomeRange: {
      entry:  [18000, 26000],
      mid:    [26000, 38000],
      senior: [38000, 55000],
    },
    employer:        'State University Graduate Program',
    payrollSchedule: 'monthly',
    patternBase:     'standard',
    housingType:     'rent',
  },
];

// Look up an occupation by id — returns undefined if not found
export function getOccupation(id) {
  return OCCUPATIONS.find((o) => o.id === id);
}

// Resolve annual income for an occupation + rank/class
export function resolveIncome(occupation, rankOrClass = null) {
  if (occupation.incomeByRank) {
    const rank = rankOrClass || occupation.defaultRank;
    const range = occupation.incomeByRank[rank] || occupation.incomeByRank[occupation.defaultRank];
    return range;
  }
  const tier = rankOrClass || 'mid';
  const range = occupation.incomeRange?.[tier] || occupation.incomeRange?.mid;
  return range || [40000, 60000];
}
