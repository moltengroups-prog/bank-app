// Rule: flag large transfer amounts with progressive scoring

export async function amountRule({ amount }) {
  const flags = [];
  let score = 0;

  if (amount >= 25000) {
    score = 50;
    flags.push('VERY_LARGE_AMOUNT');        // +50 → pushes into CRITICAL territory alone
  } else if (amount >= 20000) {
    score = 35;
    flags.push('LARGE_AMOUNT');
  } else if (amount >= 5000) {
    score = 20;
    flags.push('ELEVATED_AMOUNT');
  } else if (amount >= 2500) {
    score = 10;
    flags.push('HIGH_AMOUNT');
  }

  return { score, flags };
}
