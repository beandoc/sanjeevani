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

import type { CaregiverAttributes, FormalSupportType } from './care-gap-engine';

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
