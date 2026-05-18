export function formatAmount(tx) {
  const sign = tx.type === 'debit' ? '-' : '+';
  return `${sign}$${tx.amount.toFixed(2)}`;
}

export function formatBalance(n) {
  if (n == null) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function txStatusLabel(tx) {
  if (tx.status === 'pending') return 'Processing';
  return formatDate(tx.transactionDate);
}

// Shape expected by TransactionDetailsPage via route state
export function toDetailPayload(tx) {
  return {
    description:     tx.description,
    amount:          formatAmount(tx),
    balance:         formatBalance(tx.balanceAfter),
    transactionDate: formatDate(tx.transactionDate),
    type:            capitalize(tx.type),
    onlinePurchase:  'N/A',
    merchant:        tx.merchant || tx.description,
    category:        capitalize(tx.category),
    status:          capitalize(tx.status),
  };
}

// Shape expected by ActivityDetailsPage bottom sheet
export function toActivityDetailPayload(tx) {
  const isDebit      = tx.type === 'debit';
  const accountLabel = tx.account
    ? `${tx.account.accountName} ${tx.account.maskedNumber}`
    : '—';
  const counterparty = tx.merchant || tx.description;

  return {
    name:               tx.description,
    status:             capitalize(tx.status),
    to:                 isDebit ? counterparty : accountLabel,
    from:               isDebit ? accountLabel : counterparty,
    amount:             formatAmount(tx),
    date:               formatDate(tx.transactionDate),
    confirmationNumber: tx.referenceNumber,
  };
}
