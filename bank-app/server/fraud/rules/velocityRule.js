// Rule: detect multiple transfers in a short time window (velocity burst)

import Transaction from '../../models/Transaction.js';

export async function velocityRule({ userId, accountId, now = new Date() }) {
  const flags = [];
  let score = 0;

  const windows = [
    { minutes: 5,  threshold: 3,  scoreAdd: 40, flag: 'VELOCITY_BURST_5MIN' },
    { minutes: 30, threshold: 5,  scoreAdd: 25, flag: 'VELOCITY_HIGH_30MIN' },
    { minutes: 60, threshold: 8,  scoreAdd: 15, flag: 'VELOCITY_ELEVATED_1HR' },
  ];

  for (const { minutes, threshold, scoreAdd, flag } of windows) {
    const since = new Date(now.getTime() - minutes * 60 * 1000);
    const count = await Transaction.countDocuments({
      account:         accountId,
      type:            'debit',
      fraudStatus:     { $nin: ['blocked', 'rejected'] },
      transactionDate: { $gte: since },
    });

    if (count >= threshold) {
      score = Math.max(score, scoreAdd);
      flags.push(flag);
      break; // Shortest window takes priority
    }
  }

  return { score, flags };
}
