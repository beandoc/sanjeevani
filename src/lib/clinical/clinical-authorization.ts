/**
 * Clinician authorization binding for the home-care blueprint and emergency logistics.
 *
 * Problem this solves: `careBlueprint.clinicalReview` and `emergencyLogistics.isVerified` live
 * inside `caregiverAttributes/current`, a document the family caregiver can edit. Firestore rules
 * stop a caregiver from *creating* those markers, but once a clinician has set them the caregiver
 * can change the authored instructions, hospital, driver or escalation preference while carrying
 * the untouched review object forward — and every surface would keep rendering the tampered
 * content as "clinician approved".
 *
 * The fix is a separate, clinician-write-only record (`clinicalAuthorization/current`, see
 * firestore.rules) that stores a deterministic SHA-256 over the exact plan content and the exact
 * emergency logistics the clinician signed. Any surface that wants to display "authorized" or
 * enable bedside printing recomputes the hash from the live document and compares. If the family
 * edits protected content the hash no longer matches and the plan drops back to "pending
 * clinician re-review" — nothing is lost, it just stops being presented as signed.
 *
 * Everything here is pure and synchronous so it runs identically in the browser, in Next.js server
 * components, and in the Vitest suite.
 */

import type {
  CaregiverAttributes,
  ClinicalCareBlueprint,
  ClinicianAuthoredInstruction,
  EmergencyLogistics
} from './care-gap-engine';

/** Bumped whenever the set of hashed fields or the canonicalization changes. */
export const CLINICAL_AUTHORIZATION_HASH_VERSION = 'sha256-canonical-json-v1';

export type GoalsOfCareEscalationPreference = NonNullable<EmergencyLogistics['goalsOfCareEscalationPreference']>;

export interface EmergencyVerificationRecord {
  /** SHA-256 over the protected emergency fields at the moment of verification. */
  logisticsHash: string;
  verifiedAt: string;
  verifiedByUid: string;
  verifiedByName: string;
  goalsOfCareEscalationPreference: GoalsOfCareEscalationPreference;
  /** Exact copy of what was verified, so the bedside sheet can render the signed values. */
  snapshot: EmergencyLogisticsProtectedFields;
}

export interface ClinicalAuthorizationRecord {
  hashVersion: typeof CLINICAL_AUTHORIZATION_HASH_VERSION;
  /** Blueprint id this authorization covers. */
  blueprintId: string | null;
  /** SHA-256 over the protected plan content (see `computeBlueprintPlanHash`). */
  planHash: string;
  authorizedAt: string;
  authorizedByUid: string;
  authorizedByName: string;
  policyVersion?: string;
  /** Present once a clinician has verified emergency logistics with the family. */
  emergencyVerification?: EmergencyVerificationRecord;
  /** Persistence-layer stamp. */
  updatedAt?: string;
}

// ---------------------------------------------------------------------------------------------
// Canonical JSON + SHA-256
// ---------------------------------------------------------------------------------------------

/**
 * Deterministic JSON: object keys sorted, `undefined` dropped, no whitespace. Two documents that
 * differ only in key order or in absent-vs-undefined fields hash identically, which is what we
 * want — Firestore round-trips strip `undefined` and do not preserve key order.
 */
export function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => canonicalize(v)).join(',')}]`;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
  }
  return 'null';
}

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function utf8Bytes(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
  // Minimal fallback for very old runtimes.
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c >= 0xd800 && c < 0xdc00 && i + 1 < str.length) {
      const d = str.charCodeAt(++i);
      c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return Uint8Array.from(out);
}

/** Synchronous SHA-256 (FIPS 180-4) returning lowercase hex. Pure JS so it is runtime-agnostic. */
export function sha256Hex(input: string): string {
  const msg = utf8Bytes(input);
  const bitLen = msg.length * 8;
  const padded = new Uint8Array((((msg.length + 9 + 63) >> 6) << 6));
  padded.set(msg);
  padded[msg.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen >>> 0, false);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);
  const w = new Uint32Array(64);

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^ ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^ (w[i - 15] >>> 3);
      const s1 = ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^ ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }
  return Array.from(h, (x) => x.toString(16).padStart(8, '0')).join('');
}

// ---------------------------------------------------------------------------------------------
// Protected content projections
// ---------------------------------------------------------------------------------------------

/**
 * The fields of an authored instruction the clinician is signing. `acceptedAt`/`source` are
 * workflow metadata, not clinical content, so they are excluded — but every field a caregiver
 * would read on the wall sheet is included.
 */
export function projectInstructionForHash(i: ClinicianAuthoredInstruction) {
  return {
    id: i.id,
    timingWindow: i.timingWindow,
    clinicalDomain: i.clinicalDomain ?? null,
    title: i.title ?? null,
    instruction: i.instruction,
    indication: i.indication,
    parameters: i.parameters ?? null,
    exceptions: i.exceptions ?? null,
    authoredBy: i.authoredBy ?? i.prescribedBy ?? null,
    reviewDate: i.reviewDate ?? i.reviewedAt ?? null,
    reviewIntervalDays: i.reviewIntervalDays ?? null,
    expiresAt: i.expiresAt ?? null
  };
}

/**
 * Plan content covered by the signature. Deliberately excludes `status` (the family adopting the
 * plan is not a content change) and `clinicalReview` (that is the marker we are replacing).
 */
export function projectBlueprintForHash(bp: ClinicalCareBlueprint) {
  return {
    id: bp.id,
    prescribedByDoctor: bp.prescribedByDoctor,
    prescribedAt: bp.prescribedAt,
    clinicalSummary: bp.clinicalSummary,
    recommendedSupportType: bp.recommendedSupportType,
    recommendedShiftWindow: bp.recommendedShiftWindow,
    recommendedHoursPerDay: bp.recommendedHoursPerDay,
    clinicalPrecautions: [...(bp.clinicalPrecautions || [])],
    recommendedAssistiveDevices: {
      hospitalBed: bp.recommendedAssistiveDevices?.hospitalBed ?? 'none',
      airWaterMattress: !!bp.recommendedAssistiveDevices?.airWaterMattress,
      wheelchair: !!bp.recommendedAssistiveDevices?.wheelchair,
      suctionApparatus: !!bp.recommendedAssistiveDevices?.suctionApparatus,
      transferAids: !!bp.recommendedAssistiveDevices?.transferAids
    },
    recommendedRespiteDaysPerMonth: bp.recommendedRespiteDaysPerMonth,
    authoredInstructions: (bp.authoredInstructions || []).map(projectInstructionForHash)
  };
}

export function computeBlueprintPlanHash(bp: ClinicalCareBlueprint): string {
  return sha256Hex(canonicalize(projectBlueprintForHash(bp)));
}

export interface EmergencyLogisticsProtectedFields {
  hospitalDistanceKm: number | null;
  travelTimeMinutes: number | null;
  fourWheelerAvailableAtHome: boolean;
  vehicleDetails: string | null;
  designatedEmergencyDriver: string | null;
  preferredHospitalName: string | null;
  ambulanceContact: string | null;
  goalsOfCareEscalationPreference: GoalsOfCareEscalationPreference | null;
}

const norm = (s: string | undefined | null) => {
  const t = (s ?? '').trim();
  return t.length > 0 ? t : null;
};

/** Emergency fields covered by verification. `isVerified`/`verifiedBy`/`verifiedAt` are excluded. */
export function projectEmergencyLogisticsForHash(el: EmergencyLogistics | undefined | null): EmergencyLogisticsProtectedFields {
  return {
    hospitalDistanceKm: typeof el?.hospitalDistanceKm === 'number' && Number.isFinite(el.hospitalDistanceKm) ? el.hospitalDistanceKm : null,
    travelTimeMinutes: typeof el?.travelTimeMinutes === 'number' && Number.isFinite(el.travelTimeMinutes) ? el.travelTimeMinutes : null,
    fourWheelerAvailableAtHome: !!el?.fourWheelerAvailableAtHome,
    vehicleDetails: norm(el?.vehicleDetails),
    designatedEmergencyDriver: norm(el?.designatedEmergencyDriver),
    preferredHospitalName: norm(el?.preferredHospitalName),
    ambulanceContact: norm(el?.ambulanceContact),
    goalsOfCareEscalationPreference: el?.goalsOfCareEscalationPreference ?? null
  };
}

export function computeEmergencyLogisticsHash(el: EmergencyLogistics | undefined | null): string {
  return sha256Hex(canonicalize(projectEmergencyLogisticsForHash(el)));
}

/**
 * What a bedside sheet needs before emergency details can be printed: where to go, who to call,
 * who drives, and what the family and clinician agreed about escalation. Hospital + ambulance
 * alone (the previous gate) leaves the two questions that actually matter at 3 a.m. unanswered.
 */
export function getEmergencyLogisticsCompleteness(el: EmergencyLogistics | undefined | null): {
  complete: boolean;
  missing: string[];
} {
  const p = projectEmergencyLogisticsForHash(el);
  const missing: string[] = [];
  if (!p.preferredHospitalName) missing.push('preferred hospital');
  if (!p.ambulanceContact) missing.push('ambulance / helpline contact');
  if (!p.designatedEmergencyDriver) missing.push('designated emergency driver');
  if (!p.goalsOfCareEscalationPreference || p.goalsOfCareEscalationPreference === 'not_documented') {
    missing.push('goals-of-care escalation preference');
  }
  return { complete: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------------------------
// Record construction
// ---------------------------------------------------------------------------------------------

export interface IssueAuthorizationInput {
  blueprint: ClinicalCareBlueprint;
  clinicianUid: string;
  clinicianName: string;
  policyVersion?: string;
  /** Carried forward untouched if present — plan sign-off does not re-verify emergency details. */
  existingEmergencyVerification?: EmergencyVerificationRecord;
  now?: Date;
}

export function buildPlanAuthorizationRecord(input: IssueAuthorizationInput): ClinicalAuthorizationRecord {
  const at = (input.now ?? new Date()).toISOString();
  return {
    hashVersion: CLINICAL_AUTHORIZATION_HASH_VERSION,
    blueprintId: input.blueprint.id,
    planHash: computeBlueprintPlanHash(input.blueprint),
    authorizedAt: at,
    authorizedByUid: input.clinicianUid,
    authorizedByName: input.clinicianName,
    policyVersion: input.policyVersion,
    emergencyVerification: input.existingEmergencyVerification
  };
}

export interface VerifyEmergencyInput {
  logistics: EmergencyLogistics;
  clinicianUid: string;
  clinicianName: string;
  goalsOfCareEscalationPreference: GoalsOfCareEscalationPreference;
  /** Carried forward untouched — emergency verification does not re-sign the plan. */
  existing?: ClinicalAuthorizationRecord | null;
  now?: Date;
}

/**
 * Merges an emergency verification into the record. When no plan has been signed yet, the plan
 * fields are left explicitly empty (`planHash: ''`, `blueprintId: null`) so a verification never
 * accidentally reads as a plan authorization.
 */
export function buildEmergencyVerificationRecord(input: VerifyEmergencyInput): ClinicalAuthorizationRecord {
  const at = (input.now ?? new Date()).toISOString();
  const logisticsWithPreference: EmergencyLogistics = {
    ...input.logistics,
    goalsOfCareEscalationPreference: input.goalsOfCareEscalationPreference
  };
  const verification: EmergencyVerificationRecord = {
    logisticsHash: computeEmergencyLogisticsHash(logisticsWithPreference),
    verifiedAt: at,
    verifiedByUid: input.clinicianUid,
    verifiedByName: input.clinicianName,
    goalsOfCareEscalationPreference: input.goalsOfCareEscalationPreference,
    snapshot: projectEmergencyLogisticsForHash(logisticsWithPreference)
  };
  const base = input.existing;
  return {
    hashVersion: CLINICAL_AUTHORIZATION_HASH_VERSION,
    blueprintId: base?.blueprintId ?? null,
    planHash: base?.planHash ?? '',
    authorizedAt: base?.authorizedAt ?? at,
    authorizedByUid: base?.authorizedByUid ?? input.clinicianUid,
    authorizedByName: base?.authorizedByName ?? input.clinicianName,
    policyVersion: base?.policyVersion,
    emergencyVerification: verification
  };
}

// ---------------------------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------------------------

export type PlanAuthorizationStatus =
  | 'authorized' // record present and hash matches the live blueprint
  | 'stale' // record present but plan content changed since sign-off
  | 'unauthorized' // blueprint present, no clinician record (or record for a different blueprint)
  | 'no_plan'; // no blueprint on the dyad at all

export type EmergencyVerificationStatus =
  | 'verified' // record present, hash matches, and all required fields present
  | 'stale' // record present but logistics changed since verification
  | 'incomplete' // record present and matches, but required fields are missing
  | 'unverified'; // no verification record

export interface ClinicalAuthorizationVerdict {
  planStatus: PlanAuthorizationStatus;
  emergencyStatus: EmergencyVerificationStatus;
  /** True only for `planStatus === 'authorized'`. */
  planAuthorized: boolean;
  /** True only for `emergencyStatus === 'verified'`. */
  emergencyVerified: boolean;
  /** Both of the above. */
  bedsideSheetAuthorized: boolean;
  /** Live plan hash, useful for diagnostics/UI. */
  livePlanHash: string | null;
  liveEmergencyHash: string;
  reasons: string[];
  authorizedByName?: string;
  authorizedAt?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  missingEmergencyFields: string[];
}

/**
 * The only function a UI should consult before saying "clinician authorized" or enabling the
 * bedside/wall sheet. It never trusts `careBlueprint.clinicalReview` or
 * `emergencyLogistics.isVerified` — those remain as display hints and for legacy readers.
 */
export function verifyClinicalAuthorization(
  record: ClinicalAuthorizationRecord | null | undefined,
  caregiver: CaregiverAttributes | null | undefined
): ClinicalAuthorizationVerdict {
  const reasons: string[] = [];
  const blueprint = caregiver?.careBlueprint;
  const livePlanHash = blueprint ? computeBlueprintPlanHash(blueprint) : null;
  const liveEmergencyHash = computeEmergencyLogisticsHash(caregiver?.emergencyLogistics);
  const completeness = getEmergencyLogisticsCompleteness(caregiver?.emergencyLogistics);

  let planStatus: PlanAuthorizationStatus;
  if (!blueprint) {
    planStatus = 'no_plan';
    reasons.push('No home-care blueprint has been issued for this dyad.');
  } else if (!record || !record.planHash || record.hashVersion !== CLINICAL_AUTHORIZATION_HASH_VERSION) {
    planStatus = 'unauthorized';
    reasons.push('No clinician authorization record exists for this plan.');
  } else if (record.blueprintId && record.blueprintId !== blueprint.id) {
    planStatus = 'unauthorized';
    reasons.push('The clinician authorization on file is for a different blueprint.');
  } else if (record.planHash !== livePlanHash) {
    planStatus = 'stale';
    reasons.push('Plan content (instructions, precautions, staffing or devices) changed after clinician sign-off. Clinician re-review is required.');
  } else {
    planStatus = 'authorized';
  }

  let emergencyStatus: EmergencyVerificationStatus;
  const ev = record?.emergencyVerification;
  if (!ev) {
    emergencyStatus = 'unverified';
    reasons.push('Emergency logistics have not been verified by a clinician.');
  } else if (ev.logisticsHash !== liveEmergencyHash) {
    emergencyStatus = 'stale';
    reasons.push('Emergency logistics (hospital, driver, contact or escalation preference) changed after clinician verification. Re-verification is required.');
  } else if (!completeness.complete) {
    emergencyStatus = 'incomplete';
    reasons.push(`Emergency logistics are missing: ${completeness.missing.join(', ')}.`);
  } else {
    emergencyStatus = 'verified';
  }

  return {
    planStatus,
    emergencyStatus,
    planAuthorized: planStatus === 'authorized',
    emergencyVerified: emergencyStatus === 'verified',
    bedsideSheetAuthorized: planStatus === 'authorized' && emergencyStatus === 'verified',
    livePlanHash,
    liveEmergencyHash,
    reasons,
    authorizedByName: planStatus === 'authorized' ? record?.authorizedByName : undefined,
    authorizedAt: planStatus === 'authorized' ? record?.authorizedAt : undefined,
    verifiedByName: emergencyStatus === 'verified' ? ev?.verifiedByName : undefined,
    verifiedAt: emergencyStatus === 'verified' ? ev?.verifiedAt : undefined,
    missingEmergencyFields: completeness.missing
  };
}

/** Short human label for status chips. */
export function describePlanAuthorization(status: PlanAuthorizationStatus): string {
  switch (status) {
    case 'authorized': return 'Clinician authorized';
    case 'stale': return 'Modified since sign-off — re-review needed';
    case 'unauthorized': return 'Awaiting clinician authorization';
    case 'no_plan': return 'No plan issued';
  }
}

export function describeEmergencyVerification(status: EmergencyVerificationStatus): string {
  switch (status) {
    case 'verified': return 'Verified by clinician';
    case 'stale': return 'Changed since verification — re-verify';
    case 'incomplete': return 'Incomplete — cannot print';
    case 'unverified': return 'Not verified';
  }
}
