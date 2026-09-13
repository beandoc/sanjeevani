/**
 * Draft generation and issue-time validation for clinician-authored home-care directives.
 *
 * The blueprint dialog used to synthesise morning / transfer / night directives at the moment the
 * clinician pressed "Issue" — text the clinician never saw as individual directives, including a
 * two-person pivot-transfer method with no manual-handling assessment behind it and routine BP
 * logging keyed off bed-bound status alone. Now:
 *
 *   • Drafts are built when the dialog opens and shown as editable forms.
 *   • Every draft must be explicitly accepted (or removed) before issue.
 *   • A draft is only generated when there is a documented indication for it, and the indication
 *     is stated on the draft.
 *   • No patient-specific transfer *method* is ever drafted. When transfers are dependent, the
 *     draft is a manual-handling safety hold that requires the clinician to either record a
 *     PT/OT assessment (and then write the method) or keep it as a referral.
 *   • Guideline names ("NICE", "FDA", "WHO") are not attached to generated text. If a directive is
 *     guideline-derived, the clinician writes that in the indication themselves.
 *
 * Pure module — no React, no Firestore — so the rules can be tested directly.
 */

import type {
  CaregiverAttributes,
  ClinicianAuthoredInstruction,
  PatientDependenceProfile,
  AssistiveDeviceInventory
} from './care-gap-engine';

export const DEFAULT_REVIEW_INTERVAL_DAYS = 30;

export const INSTRUCTION_TIMING_OPTIONS: Array<{ id: ClinicianAuthoredInstruction['timingWindow']; label: string }> = [
  { id: 'morning_rush', label: 'Morning (06:00–09:00)' },
  { id: 'afternoon', label: 'Afternoon (12:00–15:00)' },
  { id: 'evening', label: 'Evening (18:00–21:00)' },
  { id: 'night_watch', label: 'Night (22:00–06:00)' },
  { id: 'as_needed', label: 'As needed / PRN' }
];

export const INSTRUCTION_DOMAIN_OPTIONS: Array<{ id: NonNullable<ClinicianAuthoredInstruction['clinicalDomain']>; label: string }> = [
  { id: 'skin_repositioning', label: 'Skin & repositioning' },
  { id: 'mobility_transfer', label: 'Mobility & transfers' },
  { id: 'vital_monitoring', label: 'Vital-sign monitoring' },
  { id: 'medication_administration', label: 'Medication administration' },
  { id: 'nutrition_hydration', label: 'Nutrition & hydration' },
  { id: 'environmental_safety', label: 'Environmental safety' }
];

export interface DraftContext {
  patient: PatientDependenceProfile;
  caregiver: CaregiverAttributes;
  devices: AssistiveDeviceInventory;
  authorName: string;
  /** Free-text safety notes the clinician typed in the dialog; each becomes an as-needed draft. */
  precautions?: string[];
  now?: Date;
  /** Injected for deterministic ids in tests. */
  idSuffix?: string;
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function hasCondition(patient: PatientDependenceProfile, ...needles: string[]): boolean {
  const list = (patient.primaryConditions || []).map((c) => c.toLowerCase());
  return needles.some((n) => list.some((c) => c.includes(n)));
}

function base(
  ctx: DraftContext,
  key: string,
  fields: Omit<ClinicianAuthoredInstruction, 'id' | 'authoredBy' | 'prescribedBy' | 'reviewedAt' | 'reviewDate' | 'reviewIntervalDays' | 'expiresAt' | 'acceptedByClinician' | 'source'>
): ClinicianAuthoredInstruction {
  const now = ctx.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  return {
    id: `inst_${key}_${ctx.idSuffix ?? now.getTime()}`,
    ...fields,
    authoredBy: ctx.authorName,
    prescribedBy: ctx.authorName,
    reviewedAt: today,
    reviewDate: today,
    reviewIntervalDays: DEFAULT_REVIEW_INTERVAL_DAYS,
    expiresAt: addDays(now, DEFAULT_REVIEW_INTERVAL_DAYS),
    acceptedByClinician: false,
    source: 'draft_generated'
  };
}

/**
 * Builds indication-gated drafts. Returns an empty array for a fully independent patient with no
 * precautions — there is nothing to direct.
 */
export function buildDraftInstructions(ctx: DraftContext): ClinicianAuthoredInstruction[] {
  const { patient, caregiver, devices } = ctx;
  const drafts: ClinicianAuthoredInstruction[] = [];
  const katz = patient.katzAdl;

  // 1. Morning hygiene & skin inspection — only when bathing is dependent or the patient is bed-bound.
  if (patient.isBedBound || !katz.bathing) {
    drafts.push(
      base(ctx, 'morning_skin', {
        timingWindow: 'morning_rush',
        clinicalDomain: 'skin_repositioning',
        title: 'Morning hygiene & skin inspection',
        instruction: patient.isBedBound
          ? 'Assist with sponge bath. Inspect sacrum, hips, heels and elbows for redness that does not fade when pressed. Keep skin dry after washing; avoid rubbing bony areas.'
          : 'Assist with morning personal hygiene. Check skin over pressure points while dressing.',
        indication: patient.isBedBound
          ? 'Bed-bound; pressure-injury risk documented in dependence profile.'
          : 'Katz bathing dependence documented.',
        exceptions: 'Stop and contact the clinic the same day if you see a skin break, blister, or redness that does not fade within 30 minutes.'
      })
    );
  }

  // 2. Manual-handling hold — never a method. Only when transfers are dependent.
  if (!katz.transferring) {
    drafts.push(
      base(ctx, 'transfer_hold', {
        timingWindow: 'as_needed',
        clinicalDomain: 'mobility_transfer',
        title: 'Transfer safety — awaiting PT/OT manual-handling assessment',
        instruction:
          'Do not attempt solo manual lifts. Use only the transfer method demonstrated to this family by a physiotherapist/occupational therapist. Until that assessment is done, keep the patient in bed or chair and call for a second adult before any transfer.',
        indication: 'Katz transfer dependence documented; no individualized manual-handling assessment on file.',
        parameters: devices.transferAids
          ? 'Transfer aids are recorded at home; their use must still be taught by PT/OT before the family relies on them.'
          : 'No transfer aids recorded at home.',
        exceptions: 'If the patient reports dizziness, acute pain, or resists, stop and reseat safely; do not continue.',
        requiresPtOtAssessment: true,
        ptOtAssessmentRecorded: false
      })
    );
  }

  // 3. Night repositioning / safety — indication-specific.
  if (patient.isBedBound) {
    drafts.push(
      base(ctx, 'night_reposition', {
        timingWindow: 'night_watch',
        clinicalDomain: 'skin_repositioning',
        title: 'Overnight repositioning',
        instruction: devices.airWaterMattress
          ? 'Change position at the interval agreed with the clinic (record it here). Check skin at each change. Keep heels off the mattress.'
          : 'Change position at the interval agreed with the clinic (record it here). Use pillows to keep heels off the bed and to separate knees when side-lying.',
        indication: 'Bed-bound overnight; pressure-injury prevention.',
        parameters: devices.airWaterMattress ? 'Alternating-pressure mattress in use.' : 'Standard mattress.',
        exceptions: 'New restlessness or confusion at night needs a clinician review — do not sedate.'
      })
    );
  } else if (patient.fallHistoryLast6Months > 0 || !katz.toileting) {
    drafts.push(
      base(ctx, 'night_safety', {
        timingWindow: 'night_watch',
        clinicalDomain: 'environmental_safety',
        title: 'Overnight fall-safety setup',
        instruction: 'Bed at its lowest height, a dim light left on, and a clear path to the commode or toilet. Keep walking aid and footwear within reach.',
        indication:
          patient.fallHistoryLast6Months > 0
            ? `${patient.fallHistoryLast6Months} fall(s) in the last 6 months documented.`
            : 'Katz toileting dependence documented; overnight toileting trips.',
        exceptions: 'Do not use bed rails as a restraint. If rails are already fitted, ask the clinic to check them.'
      })
    );
  }

  // 4. Vitals — only with a documented cardiovascular/metabolic indication, never from bed-bound status.
  if (hasCondition(patient, 'hypertension', 'heart failure', 'cardiac', 'blood pressure')) {
    drafts.push(
      base(ctx, 'bp_log', {
        timingWindow: 'morning_rush',
        clinicalDomain: 'vital_monitoring',
        title: 'Morning blood-pressure log',
        instruction: 'Measure blood pressure seated, after 5 minutes of rest, before morning medicines. Write the reading in the vitals log.',
        indication: `Documented condition: ${patient.primaryConditions.find((c) => /hypertension|heart|cardiac|blood pressure/i.test(c)) || 'cardiovascular'}.`,
        exceptions: 'Call the clinic the same day if systolic is above the limit written here, or below 90, or if the patient feels faint.'
      })
    );
  }
  if (hasCondition(patient, 'diabetes', 'glyc')) {
    drafts.push(
      base(ctx, 'glucose_log', {
        timingWindow: 'morning_rush',
        clinicalDomain: 'vital_monitoring',
        title: 'Blood-glucose check',
        instruction: 'Check fasting glucose at the frequency written here and record it in the log.',
        indication: 'Documented diabetes.',
        exceptions: 'Treat a reading under 70 mg/dL with sugar immediately and call the clinic.'
      })
    );
  }

  // 5. Medication administration when the patient cannot manage medicines.
  if (!patient.lawtonIadl.medicationManagement) {
    drafts.push(
      base(ctx, 'meds_admin', {
        timingWindow: 'morning_rush',
        clinicalDomain: 'medication_administration',
        title: 'Medicine administration',
        instruction: 'Give medicines from the pill organiser at the times on the medication list. Tick the log after each dose.',
        indication: 'Lawton medication-management dependence documented.',
        exceptions: 'Do not double a missed dose. If a dose is missed by more than 4 hours, call the clinic before giving it.'
      })
    );
  }

  // 6. Caregiver-protective hold when the primary caregiver is at manual-handling risk.
  if ((caregiver.caregiverHealth?.hasBackPain || caregiver.age >= 60) && !katz.transferring) {
    drafts.push(
      base(ctx, 'caregiver_protect', {
        timingWindow: 'as_needed',
        clinicalDomain: 'mobility_transfer',
        title: 'Primary caregiver — no solo lifting',
        instruction: `${caregiver.name || 'The primary caregiver'} must not lift or pivot the patient alone.`,
        indication: caregiver.caregiverHealth?.hasBackPain
          ? 'Primary caregiver reports back pain.'
          : `Primary caregiver aged ${caregiver.age}.`,
        exceptions: 'None — this holds until a PT/OT assessment says otherwise.'
      })
    );
  }

  // 7. Clinician-typed safety notes become as-needed directives that still require acceptance.
  (ctx.precautions || []).forEach((text, idx) => {
    const t = text.trim();
    if (!t) return;
    drafts.push(
      base(ctx, `note_${idx}`, {
        timingWindow: 'as_needed',
        title: `Safety note ${idx + 1}`,
        instruction: t,
        indication: '',
        exceptions: ''
      })
    );
  });

  return drafts;
}

export interface InstructionValidation {
  valid: boolean;
  problems: string[];
}

/** A directive may be issued only when every field a caregiver needs is present and it is accepted. */
export function validateInstructionForIssue(i: ClinicianAuthoredInstruction): InstructionValidation {
  const problems: string[] = [];
  if (!i.timingWindow) problems.push('timing window');
  if (!i.instruction || i.instruction.trim().length < 10) problems.push('exact action (at least 10 characters)');
  if (!i.indication || i.indication.trim().length === 0) problems.push('indication');
  if (!i.exceptions || i.exceptions.trim().length === 0) problems.push('exceptions / when to stop');
  if (!i.authoredBy || i.authoredBy.trim().length === 0) problems.push('author');
  if (!i.reviewDate) problems.push('review date');
  if (!i.reviewIntervalDays || i.reviewIntervalDays <= 0) problems.push('review interval');
  if (!i.expiresAt) problems.push('expiry');
  if (i.requiresPtOtAssessment && !i.ptOtAssessmentRecorded) {
    // A hold is fine as long as it stays a hold; a *method* needs the assessment.
    if (looksLikeTransferMethod(i.instruction)) {
      problems.push('a specific transfer method needs a recorded PT/OT assessment');
    }
  }
  if (!i.acceptedByClinician) problems.push('explicit clinician acceptance');
  return { valid: problems.length === 0, problems };
}

/** Rough detector for text that prescribes a specific handling technique. */
export function looksLikeTransferMethod(text: string): boolean {
  return /\b(pivot|two[- ]person|2[- ]person|gait belt|slide sheet|hoist|sling|log[- ]roll|draw[- ]sheet|lift(ing)? technique)\b/i.test(text || '');
}

export function validateAllForIssue(instructions: ClinicianAuthoredInstruction[]): {
  valid: boolean;
  perInstruction: Record<string, InstructionValidation>;
} {
  const perInstruction: Record<string, InstructionValidation> = {};
  let valid = instructions.length > 0;
  for (const i of instructions) {
    const v = validateInstructionForIssue(i);
    perInstruction[i.id] = v;
    if (!v.valid) valid = false;
  }
  return { valid, perInstruction };
}

/** Marks an instruction accepted, stamping the acceptance time and (if edited) author source. */
export function acceptInstruction(i: ClinicianAuthoredInstruction, now: Date = new Date()): ClinicianAuthoredInstruction {
  return { ...i, acceptedByClinician: true, acceptedAt: now.toISOString() };
}

/** Any content edit invalidates a previous acceptance so the clinician re-reads what they sign. */
export function editInstruction(
  i: ClinicianAuthoredInstruction,
  patch: Partial<ClinicianAuthoredInstruction>
): ClinicianAuthoredInstruction {
  const next = { ...i, ...patch };
  const contentKeys: Array<keyof ClinicianAuthoredInstruction> = [
    'timingWindow', 'clinicalDomain', 'title', 'instruction', 'indication', 'parameters', 'exceptions',
    'reviewIntervalDays', 'expiresAt', 'ptOtAssessmentRecorded'
  ];
  const contentChanged = contentKeys.some((k) => k in patch && patch[k] !== i[k]);
  if (contentChanged) {
    next.acceptedByClinician = false;
    next.acceptedAt = undefined;
    next.source = 'clinician_authored';
  }
  if ('reviewIntervalDays' in patch && typeof patch.reviewIntervalDays === 'number' && patch.reviewIntervalDays > 0) {
    const from = next.reviewDate ? new Date(`${next.reviewDate}T00:00:00Z`) : new Date();
    next.expiresAt = addDays(from, patch.reviewIntervalDays);
  }
  return next;
}

export function newBlankInstruction(authorName: string, now: Date = new Date()): ClinicianAuthoredInstruction {
  const today = now.toISOString().slice(0, 10);
  return {
    id: `inst_custom_${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`,
    timingWindow: 'as_needed',
    title: '',
    instruction: '',
    indication: '',
    exceptions: '',
    authoredBy: authorName,
    prescribedBy: authorName,
    reviewedAt: today,
    reviewDate: today,
    reviewIntervalDays: DEFAULT_REVIEW_INTERVAL_DAYS,
    expiresAt: addDays(now, DEFAULT_REVIEW_INTERVAL_DAYS),
    acceptedByClinician: false,
    source: 'clinician_authored'
  };
}
