export function calculateWeightLossPercent(currentWeightKg?: number, baselineWeightKg?: number) {
  if (!currentWeightKg || !baselineWeightKg || currentWeightKg <= 0 || baselineWeightKg <= 0) return null;
  return Math.max(0, ((baselineWeightKg - currentWeightKg) / baselineWeightKg) * 100);
}

export function nutritionSafetyFlags(input: { currentWeightKg?: number; baselineWeightKg?: number; dysphagiaRisk?: string; intakePercentLast24h?: number }) {
  const lossPercent = calculateWeightLossPercent(input.currentWeightKg, input.baselineWeightKg);
  const flags: string[] = [];
  if (lossPercent !== null && lossPercent >= 5) flags.push(`Unintentional weight loss ${lossPercent.toFixed(1)}% from documented baseline; clinician nutrition review required.`);
  if (input.dysphagiaRisk === 'possible_risk' || input.dysphagiaRisk === 'clinician_confirmed') flags.push('Swallowing/aspiration risk documented; follow the clinician-led swallowing plan.');
  if (input.intakePercentLast24h !== undefined && input.intakePercentLast24h < 50) flags.push('Less than half of expected intake recorded in 24 hours; review hydration, swallow safety, and nutrition plan.');
  return { lossPercent, flags };
}
