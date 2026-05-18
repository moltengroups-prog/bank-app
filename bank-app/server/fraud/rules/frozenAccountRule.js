// Rule: transfers from frozen or closed accounts are immediately blocked

import BankAccount from '../../models/BankAccount.js';

export async function frozenAccountRule({ accountId }) {
  const flags = [];
  let score = 0;
  let hardBlock = false;

  const account = await BankAccount.findById(accountId).select('status');
  if (!account) {
    return { score: 100, flags: ['ACCOUNT_NOT_FOUND'], hardBlock: true };
  }

  if (account.status === 'frozen') {
    score = 100;
    flags.push('FROZEN_ACCOUNT');
    hardBlock = true;
  } else if (account.status === 'closed') {
    score = 100;
    flags.push('CLOSED_ACCOUNT');
    hardBlock = true;
  }

  return { score, flags, hardBlock };
}
