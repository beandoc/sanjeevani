import type {
  CareGapEvaluationResult,
  CaregiverAttributes,
  DailyCareLog,
  DailyCareLogMedication,
  DailyCareLogVitalsRow,
  PatientDependenceProfile,
  VitalRecord
} from '@/lib/db/health-repository';
import type { ZaritEvaluationResult } from '@/lib/zarit-scale';

export type ClinicalSignalSeverity = 'info' | 'watch' | 'urgent';
export type ClinicianQueryCategory =
  | 'all'
  | 'respite'
  | 'delirium'
  | 'falls'
  | 'medications'
  | 'hydration'
  | 'vitals'
  | 'missing_logs';

export interface ClinicalSignal {
  id: string;
  category: Exclude<ClinicianQueryCategory, 'all'>;
  severity: ClinicalSignalSeverity;
  title: string;
  detail: string;
  source: 'daily_log' | 'vitals' | 'care_gap' | 'zarit' | 'profile';
  date?: string;
}

export interface FamilyDailyDigest {
  date: string | null;
  headline: string;
  vitalsSummary: string;
  nutritionSummary: string;
  outputSummary: string;
  medicationSummary: string;
  sleepSummary: string;
  remarks?: string;
  signals: ClinicalSignal[];
}

export interface CaregiverActionPlanItem {
  id: string;
  title: string;
  action: string;
  owner: 'primary_caregiver' | 'family' | 'nurse' | 'doctor';
  urgency: 'today' | 'this_week' | 'routine';
  rationale: string;
}

export interface RespitePrescription {
  needed: boolean;
  urgency: 'none' | 'planned' | 'priority' | 'urgent';
  recommendedDaysPerMonth: number;
  recommendedHoursPerWeek: number;
  recommendedSupport: string;
  reasons: string[];
}

export interface CareIntelligenceSummary {
  digest: FamilyDailyDigest;
  signals: ClinicalSignal[];
  actionPlan: CaregiverActionPlanItem[];
  respitePrescription: RespitePrescription;
}

function toNumber(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null;
  const match = String(value).match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseBp(bp?: string): { systolic: number | null; diastolic: number | null } {
  if (!bp) return { systolic: null, diastolic: null };
  const [sys, dia] = bp.split('/').map((part) => toNumber(part));
  return { systolic: sys ?? null, diastolic: dia ?? null };
}

function allRows(logs: DailyCareLog[]): Array<{ log: DailyCareLog; row: DailyCareLogVitalsRow }> {
  return logs.flatMap((log) => log.monitoringRows.map((row) => ({ log, row })));
}

function missingMedicationCount(meds: DailyCareLogMedication[]): number {
  return meds.filter((med) => !med.given).length;
}

function mealText(log: DailyCareLog): string {
  return [log.meals.breakfast, log.meals.lunch, log.meals.eveningSnack, log.meals.dinner].filter(Boolean).join(' | ');
}

function outputText(log: DailyCareLog): string {
  const stool = log.stoolPassed === null ? 'stool not recorded' : log.stoolPassed ? 'stool passed' : 'no stool';
  const urine = [log.urineMorningMl, log.urineEveningMl].filter(Boolean).join(' + ');
  return `${stool}; urine ${urine || 'not recorded'}${log.waterIntakeMl ? `; water ${log.waterIntakeMl} ml` : ''}`;
}

export function analyzeDailyCareLogs(logs: DailyCareLog[], now: Date = new Date()): ClinicalSignal[] {
  const signals: ClinicalSignal[] = [];
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sorted[0];
  const nowMs = now.getTime();

  if (!latest) {
    return [
      {
        id: 'missing_logs_none',
        category: 'missing_logs',
        severity: 'watch',
        title: 'No daily bedside sheet',
        detail: 'No nurse or medical assistant daily update has been saved yet.',
        source: 'daily_log'
      }
    ];
  }

  const latestAgeDays = Math.floor((nowMs - new Date(latest.date).getTime()) / (24 * 60 * 60 * 1000));
  if (latestAgeDays >= 2) {
    signals.push({
      id: `missing_logs_${latest.id}`,
      category: 'missing_logs',
      severity: latestAgeDays >= 3 ? 'urgent' : 'watch',
      title: 'Daily sheet is stale',
      detail: `Last daily update was ${latestAgeDays} days ago.`,
      source: 'daily_log',
      date: latest.date
    });
  }

  for (const { log, row } of allRows(sorted.slice(0, 7))) {
    const { systolic, diastolic } = parseBp(row.bp);
    const sugar = toNumber(row.bloodSugar);
    const spo2 = toNumber(row.spo2);
    const pulse = toNumber(row.pulse);
    const remark = `${row.remarks || ''} ${log.generalRemarks || ''}`.toLowerCase();

    if ((systolic !== null && systolic >= 180) || (diastolic !== null && diastolic >= 110)) {
      signals.push({
        id: `bp_urgent_${log.id}_${row.id}`,
        category: 'vitals',
        severity: 'urgent',
        title: 'Very high blood pressure',
        detail: `${row.timeLabel}: BP ${row.bp}. Repeat, check symptoms, and notify the doctor urgently.`,
        source: 'daily_log',
        date: log.date
      });
    } else if ((systolic !== null && systolic >= 160) || (diastolic !== null && diastolic >= 100)) {
      signals.push({
        id: `bp_watch_${log.id}_${row.id}`,
        category: 'vitals',
        severity: 'watch',
        title: 'High blood pressure trend',
        detail: `${row.timeLabel}: BP ${row.bp}. Review medication timing and repeat readings.`,
        source: 'daily_log',
        date: log.date
      });
    }

    if (spo2 !== null && spo2 < 92) {
      signals.push({
        id: `spo2_${log.id}_${row.id}`,
        category: 'vitals',
        severity: spo2 < 90 ? 'urgent' : 'watch',
        title: 'Low oxygen saturation',
        detail: `${row.timeLabel}: SpO2 ${spo2}%. Check breathing, sensor fit, and escalation protocol.`,
        source: 'daily_log',
        date: log.date
      });
    }

    if (sugar !== null && (sugar < 70 || sugar >= 300)) {
      signals.push({
        id: `sugar_${log.id}_${row.id}`,
        category: 'vitals',
        severity: 'urgent',
        title: 'Unsafe blood sugar reading',
        detail: `${row.timeLabel}: sugar ${sugar} mg/dL. Follow diabetes sick-day or hypoglycemia plan.`,
        source: 'daily_log',
        date: log.date
      });
    }

    if (pulse !== null && (pulse < 50 || pulse > 120)) {
      signals.push({
        id: `pulse_${log.id}_${row.id}`,
        category: 'vitals',
        severity: 'watch',
        title: 'Pulse outside usual range',
        detail: `${row.timeLabel}: pulse ${pulse} bpm. Recheck and correlate with symptoms.`,
        source: 'daily_log',
        date: log.date
      });
    }

    if (/(confus|deliri|drows|sleepy|agitat|hallucinat|not recogn|disorient|sundown)/.test(remark)) {
      signals.push({
        id: `delirium_${log.id}_${row.id}`,
        category: 'delirium',
        severity: 'urgent',
        title: 'Possible delirium or acute behavior change',
        detail: 'Daily notes mention confusion, drowsiness, agitation, or disorientation. Screen for infection, dehydration, pain, constipation, urinary retention, hypoxia, and medication effects.',
        source: 'daily_log',
        date: log.date
      });
    }

    if (/(fall|slip|near fall|unsteady|gidd|dizz|transfer difficult)/.test(remark)) {
      signals.push({
        id: `fall_${log.id}_${row.id}`,
        category: 'falls',
        severity: 'urgent',
        title: 'Fall or unsafe transfer signal',
        detail: 'Daily notes mention fall, near-fall, dizziness, unsteadiness, or transfer difficulty. Review gait aid, orthostatic BP, footwear, lighting, and sedating medicines.',
        source: 'daily_log',
        date: log.date
      });
    }
  }

  for (const log of sorted.slice(0, 7)) {
    const missed = missingMedicationCount(log.medications);
    if (log.medications.length > 0 && missed > 0) {
      signals.push({
        id: `meds_${log.id}`,
        category: 'medications',
        severity: missed >= 2 ? 'watch' : 'info',
        title: 'Medication doses not marked given',
        detail: `${missed} of ${log.medications.length} scheduled doses were not ticked on ${log.date}.`,
        source: 'daily_log',
        date: log.date
      });
    }

    const urineTotal = (toNumber(log.urineMorningMl) || 0) + (toNumber(log.urineEveningMl) || 0);
    const water = toNumber(log.waterIntakeMl);
    if ((urineTotal > 0 && urineTotal < 500) || (water !== null && water < 800) || log.stoolPassed === false) {
      signals.push({
        id: `hydration_${log.id}`,
        category: 'hydration',
        severity: log.stoolPassed === false ? 'watch' : 'info',
        title: 'Hydration, urine, or stool watch',
        detail: outputText(log),
        source: 'daily_log',
        date: log.date
      });
    }
  }

  const unique = new Map<string, ClinicalSignal>();
  signals.forEach((signal) => unique.set(signal.id, signal));
  return Array.from(unique.values()).sort((a, b) => {
    const severityOrder = { urgent: 0, watch: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

export function buildFamilyDailyDigest(logs: DailyCareLog[], now: Date = new Date()): FamilyDailyDigest {
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sorted[0];
  const signals = analyzeDailyCareLogs(logs, now).filter((signal) => signal.date === latest?.date || !signal.date);

  if (!latest) {
    return {
      date: null,
      headline: 'No daily update has been entered yet.',
      vitalsSummary: 'Vitals not available',
      nutritionSummary: 'Meals not available',
      outputSummary: 'Output not available',
      medicationSummary: 'Medication log not available',
      sleepSummary: 'Sleep not available',
      signals
    };
  }

  const vitals = latest.monitoringRows
    .filter((row) => row.bp || row.pulse || row.spo2 || row.bloodSugar)
    .map((row) => [row.bp && `BP ${row.bp}`, row.pulse && `pulse ${row.pulse}`, row.spo2 && `SpO2 ${row.spo2}%`, row.bloodSugar && `sugar ${row.bloodSugar}`].filter(Boolean).join(', '))
    .filter(Boolean);
  const medsGiven = latest.medications.filter((med) => med.given).length;
  const urgentCount = signals.filter((signal) => signal.severity === 'urgent').length;

  return {
    date: latest.date,
    headline: urgentCount > 0 ? `${urgentCount} item${urgentCount === 1 ? '' : 's'} need doctor review from today's sheet.` : 'Daily update saved and visible to the care team.',
    vitalsSummary: vitals.slice(0, 2).join(' | ') || 'Vitals not logged',
    nutritionSummary: mealText(latest) || latest.meals.feedNotes || 'Meals not logged',
    outputSummary: outputText(latest),
    medicationSummary: latest.medications.length > 0 ? `${medsGiven}/${latest.medications.length} doses marked given` : 'Medication checklist not logged',
    sleepSummary: latest.sleep === 'not_recorded' ? 'Sleep not logged' : latest.sleep,
    remarks: latest.generalRemarks || latest.meals.feedNotes,
    signals
  };
}

export function prescribeRespite(
  latestZarit: ZaritEvaluationResult | null | undefined,
  careGap: CareGapEvaluationResult | null | undefined,
  caregiver: CaregiverAttributes | null | undefined,
  patient: PatientDependenceProfile | null | undefined
): RespitePrescription {
  const burden = latestZarit?.normalizedPercentage ?? 0;
  const gap = careGap?.netCareGapHours ?? 0;
  const injury = careGap?.caregiverInjuryRiskCategory;
  const reasons: string[] = [];

  if (burden >= 60 || latestZarit?.severityBand === 'critical_red' || latestZarit?.isCrisisTriggered) {
    reasons.push(`High caregiver burden (${burden}%).`);
  } else if (burden >= 45) {
    reasons.push(`Rising caregiver burden (${burden}%).`);
  }
  if (gap >= 3) reasons.push(`Daily care gap is ${gap} hours.`);
  if (careGap?.caregiverBurnoutRiskLevel === 'critical' || careGap?.caregiverBurnoutRiskLevel === 'high') {
    reasons.push(`Care-gap engine estimates ${careGap.caregiverBurnoutRiskLevel} burnout risk.`);
  }
  if (injury === 'severe' || injury === 'high') reasons.push(`Manual-handling injury risk is ${injury}.`);
  if (caregiver?.formalSupport?.hoursPerDay === 0 || caregiver?.formalSupport?.type === 'none') {
    reasons.push('No formal attendant support is recorded.');
  }
  if (patient?.isBedBound || patient?.cognitiveBehavioralLoad === 'severe_sundowning') {
    reasons.push('Patient dependence creates sustained night or transfer supervision.');
  }

  const needed = reasons.length > 0 && (burden >= 45 || gap >= 2 || careGap?.caregiverBurnoutRiskLevel === 'high' || careGap?.caregiverBurnoutRiskLevel === 'critical');
  const urgent = burden >= 60 || gap >= 4 || careGap?.caregiverBurnoutRiskLevel === 'critical';
  const priority = burden >= 45 || gap >= 2 || careGap?.caregiverBurnoutRiskLevel === 'high';
  const recommendedDaysPerMonth = !needed ? 0 : urgent ? 8 : priority ? 4 : 2;
  const recommendedHoursPerWeek = !needed ? 0 : urgent ? 24 : priority ? 12 : 6;

  return {
    needed,
    urgency: !needed ? 'none' : urgent ? 'urgent' : priority ? 'priority' : 'planned',
    recommendedDaysPerMonth,
    recommendedHoursPerWeek,
    recommendedSupport: urgent
      ? 'Formal respite attendant plus family night rotation this week'
      : priority
        ? 'Planned weekly half-day respite and backup family roster'
        : 'Monthly backup caregiver coverage',
    reasons
  };
}

export function buildCaregiverActionPlan(input: {
  logs?: DailyCareLog[];
  latestZarit?: ZaritEvaluationResult | null;
  careGap?: CareGapEvaluationResult | null;
  caregiver?: CaregiverAttributes | null;
  patient?: PatientDependenceProfile | null;
  vitals?: VitalRecord[];
  now?: Date;
}): CaregiverActionPlanItem[] {
  const signals = analyzeDailyCareLogs(input.logs || [], input.now);
  const respite = prescribeRespite(input.latestZarit, input.careGap, input.caregiver, input.patient);
  const items: CaregiverActionPlanItem[] = [];

  if (respite.needed) {
    items.push({
      id: 'respite_plan',
      title: 'Activate caregiver respite',
      action: `${respite.recommendedSupport}. Target ${respite.recommendedDaysPerMonth} days/month or ${respite.recommendedHoursPerWeek} hours/week.`,
      owner: 'family',
      urgency: respite.urgency === 'urgent' ? 'today' : 'this_week',
      rationale: respite.reasons[0] || 'Caregiver support demand is exceeding safe capacity.'
    });
  }

  if (signals.some((signal) => signal.category === 'delirium')) {
    items.push({
      id: 'delirium_screen',
      title: 'Screen acute confusion',
      action: 'Check temperature, SpO2, hydration, urine symptoms, constipation, pain, new medicines, and sleep disruption. Inform doctor the same day.',
      owner: 'doctor',
      urgency: 'today',
      rationale: 'New or fluctuating confusion in an older person is a medical red flag.'
    });
  }

  if (signals.some((signal) => signal.category === 'falls') || (input.patient?.fallHistoryLast6Months || 0) > 0) {
    items.push({
      id: 'fall_safety',
      title: 'Run fall and transfer safety review',
      action: 'Review footwear, night lighting, walking aid, transfer belt, orthostatic BP, sedating medicines, and bathroom grab bars.',
      owner: 'nurse',
      urgency: 'today',
      rationale: 'A recent fall, near-fall, dizziness, or transfer difficulty predicts repeat injury.'
    });
  }

  if (signals.some((signal) => signal.category === 'medications')) {
    items.push({
      id: 'med_reconciliation',
      title: 'Reconcile missed medicines',
      action: 'Match the bedside medication checklist with the active prescription and mark intentional holds separately from missed doses.',
      owner: 'nurse',
      urgency: 'today',
      rationale: 'Medication omissions and duplicate lists are common causes of avoidable deterioration.'
    });
  }

  if (signals.some((signal) => signal.category === 'hydration')) {
    items.push({
      id: 'hydration_bowel',
      title: 'Tighten hydration and bowel tracking',
      action: 'Record fluid intake, urine output, stool passage, and constipation plan every day until stable.',
      owner: 'primary_caregiver',
      urgency: 'this_week',
      rationale: 'Low intake, reduced urine, and constipation can precipitate delirium, falls, and hospitalization.'
    });
  }

  if (items.length === 0) {
    items.push({
      id: 'maintain_surveillance',
      title: 'Maintain daily surveillance',
      action: 'Continue daily bedside sheet, medication ticks, sleep notes, stool/urine record, and weekly family review.',
      owner: 'family',
      urgency: 'routine',
      rationale: 'Stable dyads still need continuity so changes are visible early.'
    });
  }

  return items;
}

export function buildCareIntelligenceSummary(input: {
  logs?: DailyCareLog[];
  latestZarit?: ZaritEvaluationResult | null;
  careGap?: CareGapEvaluationResult | null;
  caregiver?: CaregiverAttributes | null;
  patient?: PatientDependenceProfile | null;
  vitals?: VitalRecord[];
  now?: Date;
}): CareIntelligenceSummary {
  const logs = input.logs || [];
  const now = input.now || new Date();
  return {
    digest: buildFamilyDailyDigest(logs, now),
    signals: analyzeDailyCareLogs(logs, now),
    actionPlan: buildCaregiverActionPlan({ ...input, logs, now }),
    respitePrescription: prescribeRespite(input.latestZarit, input.careGap, input.caregiver, input.patient)
  };
}

export function matchesClinicianQuery(signals: ClinicalSignal[], query: ClinicianQueryCategory): boolean {
  if (query === 'all') return true;
  return signals.some((signal) => signal.category === query);
}
