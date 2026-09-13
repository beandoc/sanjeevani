import { describe, test, expect } from 'vitest';
import type { CaregiverAttributes, PatientDependenceProfile } from '@/lib/clinical/care-gap-engine';
import { DEFAULT_ASSISTIVE_DEVICES, DEFAULT_CAREGIVER_ATTRIBUTES, DEFAULT_PATIENT_PROFILE } from '@/lib/clinical/care-gap-engine';
import {
  buildDraftInstructions,
  editInstruction,
  looksLikeTransferMethod,
  validateAllForIssue,
  validateInstructionForIssue
} from '@/lib/clinical/blueprint-instruction-drafts';

const independentPatient: PatientDependenceProfile = {
  ...DEFAULT_PATIENT_PROFILE,
  primaryConditions: [],
  katzAdl: { bathing: true, dressing: true, toileting: true, transferring: true, continence: true, feeding: true },
  lawtonIadl: {
    telephone: true, shopping: true, mealPreparation: true, housekeeping: true,
    laundry: true, transportation: true, medicationManagement: true, finances: true
  },
  cognitiveBehavioralLoad: 'none',
  fallHistoryLast6Months: 0,
  isBedBound: false
};

const dependentPatient: PatientDependenceProfile = {
  ...DEFAULT_PATIENT_PROFILE,
  primaryConditions: ['Hypertension', 'Type 2 Diabetes'],
  katzAdl: { bathing: false, dressing: false, toileting: false, transferring: false, continence: true, feeding: true },
  lawtonIadl: {
    telephone: true, shopping: false, mealPreparation: false, housekeeping: false,
    laundry: false, transportation: false, medicationManagement: false, finances: false
  },
  cognitiveBehavioralLoad: 'none',
  fallHistoryLast6Months: 1,
  isBedBound: true
};

const caregiver: CaregiverAttributes = { ...DEFAULT_CAREGIVER_ATTRIBUTES, name: 'Pooja' };

describe('buildDraftInstructions', () => {
  test('produces no drafts for a fully independent patient with no precautions', () => {
    const drafts = buildDraftInstructions({
      patient: independentPatient,
      caregiver,
      devices: DEFAULT_ASSISTIVE_DEVICES,
      authorName: 'Dr. Vivek'
    });
    expect(drafts.length).toBe(0);
  });

  test('never drafts a specific transfer method — only a PT/OT assessment hold', () => {
    const drafts = buildDraftInstructions({
      patient: dependentPatient,
      caregiver,
      devices: DEFAULT_ASSISTIVE_DEVICES,
      authorName: 'Dr. Vivek'
    });
    const transferDraft = drafts.find((d) => d.clinicalDomain === 'mobility_transfer' && d.requiresPtOtAssessment);
    expect(transferDraft).toBeDefined();
    expect(looksLikeTransferMethod(transferDraft!.instruction)).toBe(false);
    expect(transferDraft!.ptOtAssessmentRecorded).toBe(false);
  });

  test('does NOT draft blood-pressure logging from bed-bound status alone — only with a documented cardiovascular condition', () => {
    const bedBoundNoCardiac: PatientDependenceProfile = { ...dependentPatient, primaryConditions: ['Osteoarthritis'] };
    const draftsNoCardiac = buildDraftInstructions({
      patient: bedBoundNoCardiac,
      caregiver,
      devices: DEFAULT_ASSISTIVE_DEVICES,
      authorName: 'Dr. Vivek'
    });
    expect(draftsNoCardiac.some((d) => d.title?.toLowerCase().includes('blood-pressure') || d.title?.toLowerCase().includes('blood pressure'))).toBe(false);

    const bedBoundWithHtn: PatientDependenceProfile = { ...dependentPatient, primaryConditions: ['Hypertension'] };
    const draftsWithHtn = buildDraftInstructions({
      patient: bedBoundWithHtn,
      caregiver,
      devices: DEFAULT_ASSISTIVE_DEVICES,
      authorName: 'Dr. Vivek'
    });
    expect(draftsWithHtn.some((d) => d.title?.toLowerCase().includes('blood-pressure') || d.title?.toLowerCase().includes('blood pressure'))).toBe(true);
  });

  test('does NOT generate supervision when transferring is independent', () => {
    const independentTransfer: PatientDependenceProfile = { ...dependentPatient, katzAdl: { ...dependentPatient.katzAdl, transferring: true } };
    const drafts = buildDraftInstructions({
      patient: independentTransfer,
      caregiver,
      devices: DEFAULT_ASSISTIVE_DEVICES,
      authorName: 'Dr. Vivek'
    });
    expect(drafts.some((d) => d.clinicalDomain === 'mobility_transfer')).toBe(false);
  });

  test('every draft starts unaccepted and marked as an engine draft', () => {
    const drafts = buildDraftInstructions({
      patient: dependentPatient,
      caregiver,
      devices: DEFAULT_ASSISTIVE_DEVICES,
      authorName: 'Dr. Vivek'
    });
    expect(drafts.length).toBeGreaterThan(0);
    for (const d of drafts) {
      expect(d.acceptedByClinician).toBe(false);
      expect(d.source).toBe('draft_generated');
      expect(d.indication).toBeTruthy();
    }
  });

  test('carries no guideline-attribution strings (NICE/FDA/WHO) in generated text', () => {
    const drafts = buildDraftInstructions({
      patient: dependentPatient,
      caregiver,
      devices: DEFAULT_ASSISTIVE_DEVICES,
      authorName: 'Dr. Vivek'
    });
    const allText = drafts.map((d) => `${d.title} ${d.instruction} ${d.indication} ${d.exceptions}`).join(' ');
    expect(allText).not.toMatch(/NICE|FDA|WHO ICOPE|aligned/i);
  });
});

describe('validateInstructionForIssue', () => {
  test('a freshly built draft is not issuable until accepted, even with all fields present', () => {
    const [draft] = buildDraftInstructions({
      patient: dependentPatient,
      caregiver,
      devices: DEFAULT_ASSISTIVE_DEVICES,
      authorName: 'Dr. Vivek'
    });
    const v = validateInstructionForIssue(draft);
    expect(v.valid).toBe(false);
    expect(v.problems).toContain('explicit clinician acceptance');
  });

  test('a transfer-method hold that is edited into a specific technique requires PT/OT assessment to be recorded', () => {
    const [draft] = buildDraftInstructions({
      patient: dependentPatient,
      caregiver,
      devices: DEFAULT_ASSISTIVE_DEVICES,
      authorName: 'Dr. Vivek'
    }).filter((d) => d.requiresPtOtAssessment);
    const edited = editInstruction(draft, { instruction: 'Two-person pivot transfer using gait belt to armchair.' });
    const accepted = { ...edited, acceptedByClinician: true };
    const v = validateInstructionForIssue(accepted);
    expect(v.valid).toBe(false);
    expect(v.problems.some((p) => p.includes('PT/OT'))).toBe(true);

    const withAssessment = { ...accepted, ptOtAssessmentRecorded: true };
    expect(validateInstructionForIssue(withAssessment).valid).toBe(true);
  });

  test('a fully-formed, accepted directive is valid', () => {
    const v = validateInstructionForIssue({
      id: 'i1',
      timingWindow: 'morning_rush',
      title: 'Morning hygiene',
      instruction: 'Sponge bath and skin inspection over pressure points.',
      indication: 'Bed-bound',
      exceptions: 'Stop if skin breaks',
      authoredBy: 'Dr. Vivek',
      reviewDate: '2026-09-01',
      reviewIntervalDays: 30,
      expiresAt: '2026-10-01',
      acceptedByClinician: true
    });
    expect(v.valid).toBe(true);
  });
});

describe('editInstruction', () => {
  test('editing content clears a prior acceptance', () => {
    const accepted = {
      id: 'i1',
      timingWindow: 'morning_rush' as const,
      instruction: 'Original text',
      indication: 'X',
      authoredBy: 'Dr. Vivek',
      acceptedByClinician: true,
      acceptedAt: '2026-09-01T00:00:00.000Z'
    };
    const edited = editInstruction(accepted, { instruction: 'Changed text' });
    expect(edited.acceptedByClinician).toBe(false);
    expect(edited.acceptedAt).toBeUndefined();
  });

  test('editing an unrelated non-content field (e.g. nothing changed) keeps acceptance', () => {
    const accepted = {
      id: 'i1',
      timingWindow: 'morning_rush' as const,
      instruction: 'Text',
      indication: 'X',
      authoredBy: 'Dr. Vivek',
      acceptedByClinician: true
    };
    const edited = editInstruction(accepted, { instruction: 'Text' });
    expect(edited.acceptedByClinician).toBe(true);
  });
});

describe('validateAllForIssue', () => {
  test('is invalid when there are zero instructions', () => {
    expect(validateAllForIssue([]).valid).toBe(false);
  });

  test('is invalid if any single instruction is invalid', () => {
    const good = {
      id: 'i1', timingWindow: 'morning_rush' as const, instruction: 'Do the thing carefully.', indication: 'X',
      exceptions: 'Y', authoredBy: 'Dr. V', reviewDate: '2026-09-01', reviewIntervalDays: 30, expiresAt: '2026-10-01',
      acceptedByClinician: true
    };
    const bad = { ...good, id: 'i2', acceptedByClinician: false };
    const result = validateAllForIssue([good, bad]);
    expect(result.valid).toBe(false);
    expect(result.perInstruction['i1'].valid).toBe(true);
    expect(result.perInstruction['i2'].valid).toBe(false);
  });
});
