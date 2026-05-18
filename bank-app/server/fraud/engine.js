import { computeRiskScore }        from './services/riskScoring.js';
import { getRiskLevel, getOutcome } from './utils/riskHelpers.js';

/**
 * Main fraud evaluation entry point.
 *
 * Call before executing any transfer.
 *
 * Returns:
 * {
 *   riskScore:      number,
 *   riskLevel:      'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
 *   outcome:        'complete' | 'monitoring' | 'pending-review' | 'blocked',
 *   fraudFlags:     string[],
 *   triggeredRules: string[],
 *   requiresReview: boolean,
 *   hardBlock:      boolean,
 * }
 */
export async function evaluateTransfer({ userId, accountId, amount }) {
  const { riskScore, fraudFlags, triggeredRules, hardBlock } =
    await computeRiskScore({ userId, accountId, amount });

  const riskLevel = hardBlock ? 'CRITICAL' : getRiskLevel(riskScore);
  const outcome   = hardBlock ? 'blocked'  : getOutcome(riskLevel);

  return {
    riskScore,
    riskLevel,
    outcome,
    fraudFlags,
    triggeredRules,
    requiresReview: outcome === 'pending-review',
    hardBlock,
  };
}
