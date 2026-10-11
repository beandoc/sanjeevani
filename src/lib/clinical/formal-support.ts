/**
 * Single source of truth for the caregiver support team shape.
 *
 * The onboarding wizard and the settings profiler previously each built the
 * `formalSupport` object by hand with different rules, which produced two bugs:
 *
 *   1. Onboarding set `handlesHeavyTransfers` from the *length* of the
 *      selection, so a multi-family rotation — untrained relatives doing their
 *      own lifting — claimed staff were handling transfers and suppressed the
 *      lumbar-injury prescription.
 *   2. The profiler rebuilt the object without preserving `types`, so a
 *      three-member team silently collapsed to one the first time a user
 *      edited anything in Settings.
 *
 * Both UIs now derive the whole object from the selected types via
 * `buildFormalSupport`, and every reader resolves the team via
 * `resolveSupportTypes`.
 */

import type {
  CaregiverAttributes,
  CareTask,
  DiurnalTimeBlock,
  FormalSupportType
} from './care-gap-engine';
import { DIURNAL_BLOCK_HOURS, FORMAL_DAY_BLOCK_SEQUENCE } from './care-gap-constants';

export type FormalSupport = NonNullable<CaregiverAttributes['formalSupport']>;

/** Nominal shift length per support type, used only for display/records. */
const NOMINAL_SHIFT_HOURS: Record<FormalSupportType, number> = {
  trained_nurse_24h: 24,
  trained_nurse_12h: 12,
  paid_attendant_24h: 24,
  paid_attendant_12h: 12,
  medical_assistant: 6,
  multi_family_rotation: 8,
  none: 0
};

/**
 * True only for support types whose staff physically perform the daily
 * bed-to-chair lifts. A visiting medical assistant / physio aide does not, and
 * a family rotation means relatives are still doing the lifting themselves.
 */
export function performsHeavyTransfers(type: FormalSupportType): boolean {
  return type.startsWith('paid_attendant_') || type.startsWith('trained_nurse_');
}

export function performsMedicationOrWoundCare(type: FormalSupportType): boolean {
  return type.startsWith('trained_nurse_') || type === 'medical_assistant';
}

/**
 * Resolve the active support team, tolerating the legacy single-`type` shape
 * and hand-edited storage where `type` and `types` disagree.
 */
export function resolveSupportTypes(
  formalSupport: FormalSupport | null | undefined
): FormalSupportType[] {
  if (!formalSupport) return [];
  const fromArray = (formalSupport.types || []).filter((t) => t && t !== 'none');
  if (fromArray.length > 0) return fromArray;
  if (formalSupport.type && formalSupport.type !== 'none') return [formalSupport.type];
  return [];
}

/** Build the complete, self-consistent `formalSupport` object from a selection. */
export function buildFormalSupport(selected: FormalSupportType[]): FormalSupport {
  const types = selected.filter((t) => t && t !== 'none');
  return {
    type: types.length > 0 ? types[0] : 'none',
    types,
    hoursPerDay: types.reduce((sum, t) => sum + (NOMINAL_SHIFT_HOURS[t] ?? 0), 0),
    handlesHeavyTransfers: types.some(performsHeavyTransfers),
    handlesMedicationWoundCare: types.some(performsMedicationOrWoundCare)
  };
}

/** Toggle one type in a selection; `none` clears the team. */
export function toggleSupportType(
  current: FormalSupportType[],
  type: FormalSupportType
): FormalSupportType[] {
  if (type === 'none') return [];
  return current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
}

export interface FormalSupportOption {
  id: FormalSupportType;
  title: string;
  category: string;
  desc: string;
  isMedical: boolean;
}

/** Shared picker catalogue — medical/nursing options first. */
export const FORMAL_SUPPORT_OPTIONS: FormalSupportOption[] = [
  {
    id: 'trained_nurse_24h',
    title: 'Certified Nurse (24h Live-In)',
    category: 'Medical / Nursing Care',
    desc: 'IV meds, wound care, catheter, vital monitoring',
    isMedical: true
  },
  {
    id: 'trained_nurse_12h',
    title: 'Certified Nurse (12h Shift)',
    category: 'Medical / Nursing Care',
    desc: 'Day or night clinical nursing shift',
    isMedical: true
  },
  {
    id: 'medical_assistant',
    title: 'Medical Assistant / Physio Aide',
    category: 'Clinical & Physio Aide',
    desc: 'Physiotherapy, exercise, vital logging',
    isMedical: true
  },
  {
    id: 'paid_attendant_24h',
    title: 'Paid Attendant (24h Live-In)',
    category: 'Physical Assistance',
    desc: 'Bathing, turning, feeding, continuous aid',
    isMedical: false
  },
  {
    id: 'paid_attendant_12h',
    title: 'Paid Attendant (12h Shift)',
    category: 'Physical Assistance',
    desc: 'Daily hygiene, mobility, and turn support',
    isMedical: false
  },
  {
    id: 'multi_family_rotation',
    title: 'Multi-Family Member Rotation',
    category: 'Family Support Network',
    desc: 'Shared caregiving among siblings & relatives',
    isMedical: false
  },
  {
    id: 'none',
    title: 'None (Solo Family Caregiver)',
    category: 'Solo Family Care',
    desc: 'Sole family carer managing all care responsibilities',
    isMedical: false
  }
];

/* ------------------------------------------------------------------ *
 * FORMAL STAFF COVERAGE — one rule set for the engine and the roster
 * ------------------------------------------------------------------ */

/**
 * What each support type's staff are trained and hired to do. Mirrors the
 * roster's capability map, which is now built from this resolver so the
 * simulator and the roster cannot disagree about who does what.
 */
const TYPE_CAPABILITIES: Record<FormalSupportType, readonly CareTask[]> = {
  trained_nurse_24h: ['heavy_transfers', 'bathing', 'medications', 'feeding', 'night_care'],
  trained_nurse_12h: ['heavy_transfers', 'bathing', 'medications', 'feeding', 'night_care'],
  paid_attendant_24h: ['heavy_transfers', 'bathing', 'feeding', 'night_care', 'logistics_errands'],
  paid_attendant_12h: ['heavy_transfers', 'bathing', 'feeding', 'night_care', 'logistics_errands'],
  medical_assistant: ['medications'],
  // Relatives taking turns are family capacity, credited through the family
  // allocation ledger. Nothing is credited to them here.
  multi_family_rotation: [],
  none: []
};

export interface FormalStaffCoverage {
  /** Hires with a positive scheduled shift. A hire with no hours is not a hire. */
  activeTypes: FormalSupportType[];
  /** Effective shift length per active hire, clamped to that type's own shift. */
  scheduledHoursByType: Partial<Record<FormalSupportType, number>>;
  /** Total scheduled staff hours across the team. */
  totalScheduledHours: number;
  /** Tasks the team is capable of AND the clinician has left in scope. */
  capableTasks: Set<CareTask>;
  /** Blocks the team's shifts are long enough to actually span. */
  coveredBlocks: Set<DiurnalTimeBlock>;
  /**
   * True when one `hoursPerDay` figure had to be spread over more than one
   * hire. The figure is applied per hire, so the team is credited for more
   * hours than the number the clinician typed. Recorded here for the per-hire
   * hours model to consume; see `FORMAL_SUPPORT_HOURS_AMBIGUOUS`.
   */
  hoursAttributionIsAmbiguous: boolean;
}

/**
 * Resolve what a configured support team actually covers.
 *
 * Three rules, all of which the engine previously applied to the staff *label*
 * alone and so granted on no evidence:
 *
 *   1. Hours, not labels. A hire scheduled for zero hours covers nothing. A
 *      "24h live-in" whose hours were cut to 12 is a day shift and has no
 *      claim on the night watch.
 *   2. Scope, not type. The clinician's two explicit scope toggles remove the
 *      tasks they exclude. The engine used to ignore both, so unchecking
 *      "attendant handles heavy transfers / bathing" changed nothing about the
 *      carer's lifting load or her manual-handling tier.
 *   3. Timing. A block is covered only when the shift is long enough to span
 *      it, so a task whose work falls in an uncovered block is not relieved
 *      however well-staffed the rest of the day is.
 */
export function resolveFormalStaffCoverage(
  formalSupport: FormalSupport | null | undefined
): FormalStaffCoverage {
  const selected = resolveSupportTypes(formalSupport);
  const configured = formalSupport?.hoursPerDay;
  const hasConfigured = typeof configured === 'number' && !isNaN(configured);

  const scheduledHoursByType: Partial<Record<FormalSupportType, number>> = {};
  const activeTypes: FormalSupportType[] = [];
  let totalScheduledHours = 0;

  for (const type of selected) {
    const shiftLength = NOMINAL_SHIFT_HOURS[type] ?? 0;
    // Clamped to the type's own shift length: a 12h hire cannot be stretched to
    // 20 by typing a larger number. Spreading one figure across several hires is
    // the ambiguity flagged below, not a licence to multiply it.
    const hours = hasConfigured ? Math.min(shiftLength, Math.max(0, configured)) : shiftLength;
    if (hours <= 0) continue;
    scheduledHoursByType[type] = hours;
    activeTypes.push(type);
    totalScheduledHours += hours;
  }

  const capableTasks = new Set<CareTask>();
  const coveredBlocks = new Set<DiurnalTimeBlock>();

  for (const type of activeTypes) {
    for (const task of TYPE_CAPABILITIES[type]) capableTasks.add(task);

    let remaining = scheduledHoursByType[type] ?? 0;
    for (const block of FORMAL_DAY_BLOCK_SEQUENCE) {
      if (remaining < DIURNAL_BLOCK_HOURS[block]) break;
      coveredBlocks.add(block);
      remaining -= DIURNAL_BLOCK_HOURS[block];
    }
    // The night watch belongs to a round-the-clock hire with the hours to prove
    // it — never to a 24h label whose shift was shortened to a day.
    const isRoundTheClock = (NOMINAL_SHIFT_HOURS[type] ?? 0) >= 24;
    if (isRoundTheClock && remaining >= DIURNAL_BLOCK_HOURS.night_watch) {
      coveredBlocks.add('night_watch');
    }
  }

  // The clinician's explicit scope toggles override the type defaults. The
  // transfers toggle is labelled "heavy transfers / bathing" at every surface
  // that writes it, so it governs both.
  if (formalSupport?.handlesHeavyTransfers === false) {
    capableTasks.delete('heavy_transfers');
    capableTasks.delete('bathing');
  }
  if (formalSupport?.handlesMedicationWoundCare === false) {
    capableTasks.delete('medications');
  }

  return {
    activeTypes,
    scheduledHoursByType,
    totalScheduledHours,
    capableTasks,
    coveredBlocks,
    hoursAttributionIsAmbiguous: hasConfigured && activeTypes.length > 1
  };
}

/**
 * Does the team both cover `task` and cover every block the task's work falls
 * in? Partial timing cover is not relief: a morning-only attendant does not
 * relieve the evening transfer.
 */
export function formalStaffCoversTask(
  coverage: FormalStaffCoverage,
  task: CareTask,
  demandBlocks: readonly DiurnalTimeBlock[]
): boolean {
  if (!coverage.capableTasks.has(task)) return false;
  if (demandBlocks.length === 0) return true;
  return demandBlocks.every((block) => coverage.coveredBlocks.has(block));
}
