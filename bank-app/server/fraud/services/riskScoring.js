import { amountRule }          from '../rules/amountRule.js';
import { velocityRule }        from '../rules/velocityRule.js';
import { frequencyRule }       from '../rules/frequencyRule.js';
import { frozenAccountRule }   from '../rules/frozenAccountRule.js';
import { unusualActivityRule } from '../rules/unusualActivityRule.js';
import { clamp }               from '../utils/riskHelpers.js';

/**
 * Run all fraud rules in parallel and aggregate the results.
 *
 * Returns:
 * {
 *   riskScore:      number (0-100),
 *   fraudFlags:     string[],
 *   triggeredRules: string[],
 *   hardBlock:      boolean,   // immediate block regardless of score
 * }
 */
export async function computeRiskScore({ userId, accountId, amount, now = new Date() }) {
  const context = { userId, accountId, amount, now };

  // All rules run concurrently for performance
  const [frozen, amtResult, velocity, frequency, unusual] = await Promise.all([
    frozenAccountRule(context),
    amountRule(context),
    velocityRule(context),
    frequencyRule(context),
    unusualActivityRule(context),
  ]);

  // Hard block from frozen/closed account — short-circuit
  if (frozen.hardBlock) {
    return {
      riskScore:      100,
      fraudFlags:     frozen.flags,
      triggeredRules: frozen.flags,
      hardBlock:      true,
    };
  }

  // Aggregate scores (additive, capped at 100)
  const totalScore = clamp(
    frozen.score + amtResult.score + velocity.score + frequency.score + unusual.score
  );

  const fraudFlags = [
    ...frozen.flags,
    ...amtResult.flags,
    ...velocity.flags,
    ...frequency.flags,
    ...unusual.flags,
  ];

  return {
    riskScore:      totalScore,
    fraudFlags,
    triggeredRules: fraudFlags,
    hardBlock:      false,
  };
}
