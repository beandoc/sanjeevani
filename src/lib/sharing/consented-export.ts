/**
 * Single choke-point for every export of identifiable care-plan content that leaves the app —
 * WhatsApp digests, `.ics` roster files, and any future channel.
 *
 * Before this existed the clinician matrix enforced consent, recipient confirmation and redaction,
 * while the family's own Care Circle page exported the same identifiable content with no check at
 * all. Both surfaces now build their export through `prepareConsentedExport`, which refuses to
 * hand back content unless every gate passes, and record the event through `recordExportAudit`.
 *
 * Pure module: no DOM, no Firestore. The UI layer performs the actual download / window.open and
 * calls the audit sink it was given.
 */

import type { CaregiverAttributes, CareGapEvaluationResult, PatientDependenceProfile } from '@/lib/clinical/care-gap-engine';
import { generateCareRosterIcs, generateWhatsAppCareDigest } from '@/lib/clinical/shift-allocator';

export type ExportChannel = 'whatsapp_text' | 'whatsapp_link' | 'clipboard' | 'ics_calendar';

export interface ExportConsentContext {
  /** The dyad has consented to this content leaving the app via an external channel. */
  consentGiven: boolean;
  /** The person exporting confirmed who the recipient is (a group, a person, a calendar). */
  recipientConfirmed: boolean;
  /** Free-text label of the recipient, e.g. "Family WhatsApp group" — stored in the audit log. */
  recipientLabel?: string;
  /** Replace names with initials. */
  redactIdentifiers: boolean;
}

export interface ExportGateResult {
  allowed: boolean;
  /** Human-readable reason when `allowed` is false. */
  reason?: string;
  /** Which gate failed, for UI highlighting. */
  failedGate?: 'no_profile' | 'data_incomplete' | 'consent' | 'recipient';
}

/**
 * Every export must pass all four gates: a real dyad profile, sufficient clinical data, explicit
 * consent, and a confirmed recipient. Redaction is a choice, not a gate — but the audit log
 * records whether it was used.
 */
export function evaluateExportGate(
  ctx: ExportConsentContext,
  evaluation: CareGapEvaluationResult | null | undefined
): ExportGateResult {
  if (!evaluation) {
    return {
      allowed: false,
      failedGate: 'no_profile',
      reason: 'Complete the patient and caregiver profile before sharing — demo defaults must never be sent as a real plan.'
    };
  }
  if (evaluation.dataQuality.completeness === 'insufficient') {
    return {
      allowed: false,
      failedGate: 'data_incomplete',
      reason: `Required clinical inputs are incomplete (${evaluation.dataQuality.missingFields.join(', ')}).`
    };
  }
  if (!ctx.consentGiven) {
    return { allowed: false, failedGate: 'consent', reason: 'Confirm the dyad has consented to external sharing.' };
  }
  if (!ctx.recipientConfirmed) {
    return { allowed: false, failedGate: 'recipient', reason: 'Confirm who will receive this content.' };
  }
  return { allowed: true };
}

export interface PreparedExport {
  channel: ExportChannel;
  content: string;
  redacted: boolean;
  /** Suggested file name for downloads. */
  fileName?: string;
  mimeType?: string;
}

export interface PrepareExportInput {
  channel: ExportChannel;
  ctx: ExportConsentContext;
  caregiver: CaregiverAttributes;
  patient: PatientDependenceProfile;
  evaluation: CareGapEvaluationResult | null | undefined;
  /**
   * Verdict from `verifyClinicalAuthorization`. Omit and the export is labelled as a draft
   * pending clinician authorization — the caregiver-editable review flags are never consulted.
   */
  authorization?: { planAuthorized: boolean; emergencyVerified: boolean };
  /** Used only for the `.ics` file name. */
  dyadKey?: string;
  now?: Date;
}

/**
 * Builds the export content, or throws with the gate reason. Throwing (rather than returning
 * null) is deliberate: a caller that forgets to check the gate cannot accidentally proceed with
 * empty content.
 */
export function prepareConsentedExport(input: PrepareExportInput): PreparedExport {
  const gate = evaluateExportGate(input.ctx, input.evaluation);
  if (!gate.allowed || !input.evaluation) {
    throw new ExportBlockedError(gate.reason || 'Export blocked.', gate.failedGate);
  }
  const redacted = input.ctx.redactIdentifiers;
  const stamp = (input.now ?? new Date()).toISOString().slice(0, 10);

  if (input.channel === 'ics_calendar') {
    const ics = generateCareRosterIcs(
      input.caregiver,
      input.patient,
      input.evaluation,
      { redacted, authorization: input.authorization },
      input.now
    );
    return {
      channel: input.channel,
      content: ics,
      redacted,
      fileName: `sanjeevani-care-roster-${input.dyadKey || stamp}.ics`,
      mimeType: 'text/calendar;charset=utf-8'
    };
  }

  const text = generateWhatsAppCareDigest(input.caregiver, input.patient, input.evaluation, {
    redacted,
    authorization: input.authorization
  });
  return { channel: input.channel, content: text, redacted };
}

export class ExportBlockedError extends Error {
  failedGate?: ExportGateResult['failedGate'];
  constructor(message: string, failedGate?: ExportGateResult['failedGate']) {
    super(message);
    this.name = 'ExportBlockedError';
    this.failedGate = failedGate;
  }
}

/** One line in the export audit trail. Never contains the exported content itself. */
export interface ExportAuditEntry {
  id: string;
  channel: ExportChannel;
  exportedAt: string;
  /** Firebase uid of the person who exported, when signed in. */
  exportedByUid: string | null;
  exportedByRole: 'caregiver' | 'clinician' | 'unknown';
  recipientLabel: string | null;
  redacted: boolean;
  consentGiven: true;
  recipientConfirmed: true;
  /** Length of the exported content, as a coarse integrity marker. */
  contentLength: number;
}

export function buildExportAuditEntry(
  prepared: PreparedExport,
  ctx: ExportConsentContext,
  actor: { uid: string | null; role: ExportAuditEntry['exportedByRole'] },
  now: Date = new Date()
): ExportAuditEntry {
  return {
    id: `exp_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    channel: prepared.channel,
    exportedAt: now.toISOString(),
    exportedByUid: actor.uid,
    exportedByRole: actor.role,
    recipientLabel: ctx.recipientLabel?.trim() || null,
    redacted: prepared.redacted,
    consentGiven: true,
    recipientConfirmed: true,
    contentLength: prepared.content.length
  };
}

/** WhatsApp deep link for prepared text. Kept here so both surfaces use the same endpoint. */
export function whatsAppShareUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}
