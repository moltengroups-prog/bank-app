// Rule: flag unusual daily transfer frequency for a user

import Transaction from '../../models/Transaction.js';

export async function frequencyRule({ userId, now = new Date() }) {
  const flags = [];
  let score = 0;

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const todayCount = await Transaction.countDocuments({
    user:            userId,
    type:            'debit',
    fraudStatus:     { $nin: ['blocked', 'rejected'] },
    transactionDate: { $gte: startOfDay },
  });

  if (todayCount >= 15) {
    score = 30;
    flags.push('VERY_HIGH_DAILY_FREQUENCY');
  } else if (todayCount >= 8) {
    score = 15;
    flags.push('HIGH_DAILY_FREQUENCY');
  } else if (todayCount >= 5) {
    score = 5;
    flags.push('ELEVATED_DAILY_FREQUENCY');
  }

  return { score, flags };
}
