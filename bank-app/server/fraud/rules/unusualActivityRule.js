// Rule: detect transfers dramatically larger than the user's historical average

import Transaction from '../../models/Transaction.js';

export async function unusualActivityRule({ userId, amount }) {
  const flags = [];
  let score = 0;

  // Sample the user's last 30 completed debit transactions
  const recent = await Transaction.find({
    user:        userId,
    type:        'debit',
    fraudStatus: { $in: ['clean', 'monitoring', 'approved'] },
  })
    .sort({ transactionDate: -1 })
    .limit(30)
    .select('amount');

  if (recent.length < 3) {
    // Not enough history — new user with large transfer is suspicious
    if (amount >= 1000) {
      score = 20;
      flags.push('NEW_USER_LARGE_TRANSFER');
    }
    return { score, flags };
  }

  const avg = recent.reduce((sum, t) => sum + t.amount, 0) / recent.length;
  const ratio = amount / avg;

  if (ratio >= 20) {
    score = 45;
    flags.push('EXTREME_AMOUNT_vs_AVERAGE');   // 20x+ average
  } else if (ratio >= 10) {
    score = 30;
    flags.push('VERY_UNUSUAL_AMOUNT');         // 10-20x average
  } else if (ratio >= 5) {
    score = 15;
    flags.push('UNUSUAL_AMOUNT');              // 5-10x average
  }

  return { score, flags };
}
