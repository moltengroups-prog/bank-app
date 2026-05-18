// Risk level thresholds
export const RISK_THRESHOLDS = {
  LOW:      { min: 0,  max: 29 },
  MEDIUM:   { min: 30, max: 59 },
  HIGH:     { min: 60, max: 79 },
  CRITICAL: { min: 80, max: 100 },
};

export function getRiskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

// What action to take based on risk level
export function getOutcome(level) {
  switch (level) {
    case 'CRITICAL': return 'blocked';
    case 'HIGH':     return 'pending-review';
    case 'MEDIUM':   return 'monitoring';  // complete, but log
    default:         return 'complete';
  }
}

export function clamp(score) {
  return Math.min(100, Math.max(0, Math.round(score)));
}
