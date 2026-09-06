/** Validated-instrument arithmetic only. Interpretation and escalation remain clinician-reviewed. */
export function calculateFourAt(input: { alertness: 0 | 4; amt4Errors: number; monthsBackwards: 0 | 1 | 2; acuteChange: boolean }) {
  const orientation = input.amt4Errors === 0 ? 0 : input.amt4Errors === 1 ? 1 : 2;
  const score = input.alertness + orientation + input.monthsBackwards + (input.acuteChange ? 4 : 0);
  return { score, needsClinicalReview: score >= 1, urgent: input.acuteChange || score >= 4 };
}

export function calculateBraden(parts: [number, number, number, number, number, number]) {
  const score = parts.reduce((sum, part) => sum + part, 0);
  return { score, band: score <= 9 ? 'very_high' : score <= 12 ? 'high' : score <= 14 ? 'moderate' : score <= 18 ? 'mild' : 'minimal' } as const;
}

export function calculatePainad(parts: [number, number, number, number, number]) {
  const score = parts.reduce((sum, part) => sum + part, 0);
  return { score, needsReview: score >= 2 };
}
