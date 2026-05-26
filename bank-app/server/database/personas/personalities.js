// Personality modifier definitions for the Financial Persona System.
// Each modifier applies multipliers to spending categories and savings behavior.

export const PERSONALITIES = [
  {
    id:          'aggressive_saver',
    label:       'Aggressive Saver',
    description: 'Cuts discretionary spending to the bone; maximizes savings transfers and avoids debt.',
    modifiers: {
      groceries:   0.8,
      dining:      0.4,
      shopping:    0.3,
      travel:      0.2,
      healthcare:  1.0,
      atm:         0.5,
      fuel:        0.9,
      subscriptions: 0.5,
      savingsRate: 2.5,
      wireChance:  0.2,
    },
  },
  {
    id:          'luxury_spender',
    label:       'Luxury Spender',
    description: 'High-end dining, designer shopping, first-class travel. Savings are secondary to lifestyle.',
    modifiers: {
      groceries:   1.4,
      dining:      2.5,
      shopping:    2.8,
      travel:      3.0,
      healthcare:  1.2,
      atm:         1.5,
      fuel:        1.0,
      subscriptions: 1.8,
      savingsRate: 0.4,
      wireChance:  1.5,
    },
  },
  {
    id:          'disciplined_budgeter',
    label:       'Disciplined Budgeter',
    description: 'Tracks every dollar. Steady savings, consistent bills, minimal impulse purchases.',
    modifiers: {
      groceries:   1.0,
      dining:      0.7,
      shopping:    0.6,
      travel:      0.8,
      healthcare:  1.0,
      atm:         0.7,
      fuel:        1.0,
      subscriptions: 0.8,
      savingsRate: 1.6,
      wireChance:  0.5,
    },
  },
  {
    id:          'traveler',
    label:       'Frequent Traveler',
    description: 'Books flights and hotels constantly. Travel spend is disproportionately high relative to income.',
    modifiers: {
      groceries:   0.8,
      dining:      1.6,
      shopping:    1.2,
      travel:      4.0,
      healthcare:  0.8,
      atm:         1.3,
      fuel:        0.8,
      subscriptions: 1.2,
      savingsRate: 0.7,
      wireChance:  1.2,
    },
  },
  {
    id:          'investor',
    label:       'Active Investor',
    description: 'Routes surplus cash to investments and wires. Frugal day-to-day, large periodic transfers.',
    modifiers: {
      groceries:   0.9,
      dining:      0.8,
      shopping:    0.7,
      travel:      1.0,
      healthcare:  1.0,
      atm:         0.5,
      fuel:        0.9,
      subscriptions: 0.9,
      savingsRate: 2.0,
      wireChance:  3.0,
    },
  },
  {
    id:          'family_oriented',
    label:       'Family-Oriented',
    description: 'High grocery and healthcare spend. Stable housing payments, little luxury, strong savings habits.',
    modifiers: {
      groceries:   1.8,
      dining:      1.0,
      shopping:    1.4,
      travel:      0.6,
      healthcare:  1.8,
      atm:         1.0,
      fuel:        1.3,
      subscriptions: 1.3,
      savingsRate: 1.3,
      wireChance:  0.4,
    },
  },
];

export function getPersonality(id) {
  return PERSONALITIES.find((p) => p.id === id);
}

// Neutral modifiers — used when no personality is selected
export const NEUTRAL_MODIFIERS = {
  groceries:     1.0,
  dining:        1.0,
  shopping:      1.0,
  travel:        1.0,
  healthcare:    1.0,
  atm:           1.0,
  fuel:          1.0,
  subscriptions: 1.0,
  savingsRate:   1.0,
  wireChance:    1.0,
};
