/**
 * Who may see which dyad: clinician grants (consent), doctor-issued staff
 * assignments, the fixed demo personas, and the roster query built on top.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../client';
import { HealthRepository } from '@/lib/db/health-repository';
import { currentUid, withRetry } from './internal';
import { getDyadInvite, listMyDyadInvites, claimDyadInvite } from './dyad-invites';

/* ------------------------------------------------------------------ *
 * Staff assignment — a doctor delegating a specific dyad to another
 * clinical-staff account (currently: a nurse), scoped to exactly that
 * patient rather than the doctor's full roster.
 *
 * Stored as a sentinel `clinicianGrants` doc (id `invite_{code}`, which can
 * never collide with a real Firebase Auth uid) so no new collection or
 * firestore.rules match block is needed — same unguessable-code trust model
 * as a caregiver's `dyadInvites` code. Claiming it creates the claimant's
 * own real grant doc alongside the sentinel; firestore.rules verifies that
 * sentinel exists before allowing a non-doctor professional to self-grant.
 * ------------------------------------------------------------------ */

export async function createStaffInvite(dyadUid: string, code: string, label: string): Promise<void> {
  if (!db) return;
  await withRetry(() =>
    setDoc(doc(db!, 'users', dyadUid, 'clinicianGrants', `invite_${code}`), {
      clinicianUid: `invite_${code}`,
      clinicianLabel: label,
      grantedAt: new Date().toISOString(),
      revokedAt: null
    })
  );
}

/** Any authenticated clinical-staff account may claim a known staff invite code, once, per dyad. */
export async function claimStaffInvite(dyadUid: string, code: string): Promise<void> {
  const uid = currentUid();
  if (!uid || !db) return;
  const sentinelId = `invite_${code}`;
  const sentinelSnap = await getDoc(doc(db, 'users', dyadUid, 'clinicianGrants', sentinelId));
  if (!sentinelSnap.exists()) return;
  const label = (sentinelSnap.data() as { clinicianLabel?: string })?.clinicianLabel ?? null;
  await withRetry(() =>
    setDoc(doc(db!, 'users', dyadUid, 'clinicianGrants', uid), {
      clinicianUid: uid,
      clinicianLabel: label,
      grantedAt: new Date().toISOString(),
      revokedAt: null,
      staffInviteCode: sentinelId
    })
  );
}

/**
 * Fixed demo personas: known accounts that should land pre-linked to a
 * specific seeded dyad on first sign-in instead of starting with an empty
 * roster/profile. Exact email matches only — real accounts are unaffected.
 * Best-effort and idempotent (safe to call on every sign-in): a caregiver
 * invite that's already claimed, or a staff invite the account already
 * holds, is simply skipped by claimDyadInvite/claimStaffInvite's own guards.
 */
const DEMO_CAREGIVER_INVITE_CLAIMS: Record<string, string> = {
  'sureshcaregiver@kutumbh.com': 'SAROJINI81'
};

const DEMO_STAFF_INVITE_CLAIMS: Record<string, Array<{ dyadUid: string; code: string }>> = {
  'vidyanurse@kutumbh.com': [{ dyadUid: 'dyad_sarojini_devi', code: 'NURSEVIDYA' }]
};

export async function provisionDemoPersonaAccess(email: string | null | undefined): Promise<void> {
  if (!email || !db) return;
  const cleanEmail = email.toLowerCase();

  const inviteCode = DEMO_CAREGIVER_INVITE_CLAIMS[cleanEmail];
  if (inviteCode) {
    try {
      const invite = await getDyadInvite(inviteCode);
      if (invite && !invite.claimedAt) {
        await claimDyadInvite(inviteCode);
      }
    } catch (err) {
      console.warn('Demo caregiver auto-claim notice:', err);
    }
  }

  const staffAssignments = DEMO_STAFF_INVITE_CLAIMS[cleanEmail];
  if (staffAssignments) {
    for (const { dyadUid, code } of staffAssignments) {
      try {
        await claimStaffInvite(dyadUid, code);
      } catch (err) {
        console.warn('Demo staff assignment claim notice:', err);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Consent: caregiver grants/revokes a clinician's access
 * ------------------------------------------------------------------ */

export interface ClinicianGrant {
  clinicianUid: string;
  clinicianLabel?: string;
  grantedAt: string;
  revokedAt: string | null;
}

/** Caregiver grants a clinician (by their uid, from a shared clinic code) access to this dyad. */
export async function grantClinicianAccess(clinicianUid: string, clinicianLabel?: string): Promise<void> {
  const uid = currentUid();
  if (!uid || !db) throw new Error('Must be signed in to grant access.');
  const ref = doc(db, 'users', uid, 'clinicianGrants', clinicianUid);
  await withRetry(() =>
    setDoc(ref, {
      clinicianUid,
      clinicianLabel: clinicianLabel ?? null,
      grantedAt: new Date().toISOString(),
      revokedAt: null
    })
  );
}

/** Caregiver revokes a previously granted clinician's access. */
export async function revokeClinicianAccess(clinicianUid: string): Promise<void> {
  const uid = currentUid();
  if (!uid || !db) throw new Error('Must be signed in to revoke access.');
  const ref = doc(db, 'users', uid, 'clinicianGrants', clinicianUid);
  await withRetry(() => setDoc(ref, { revokedAt: new Date().toISOString() }, { merge: true }));
}

/** What the signed-in caregiver has shared, for display in their own consent settings. */
export async function listMyGrants(): Promise<ClinicianGrant[]> {
  const uid = currentUid();
  if (!uid || !db) return [];
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'clinicianGrants'));
    return snap.docs.map((d) => d.data() as ClinicianGrant);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Clinician side: roster + one dyad's data
 * ------------------------------------------------------------------ */

export interface RosterEntry {
  patientUid: string;
  grant: ClinicianGrant;
}

/**
 * All active (non-revoked) dyads the signed-in clinician has been granted.
 * A collection-group query across every caregiver's clinicianGrants
 * subcollection — Firestore evaluates the security rule per matched
 * document, so this only ever returns grants this clinician is actually
 * authorized to see (see firestore.rules `hasActiveGrant`).
 */
export async function listMyRoster(): Promise<RosterEntry[]> {
  const uid = currentUid() || 'doctor-vivek-uid';
  const entries: RosterEntry[] = [];
  const existingUids = new Set<string>();

  // 1. Cloud collection-group grants if Firestore is connected
  if (db && uid) {
    try {
      const q = query(
        collectionGroup(db, 'clinicianGrants'),
        where('clinicianUid', '==', uid),
        where('revokedAt', '==', null)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const pUid = d.ref.parent.parent!.id;
        entries.push({
          patientUid: pUid,
          grant: d.data() as ClinicianGrant
        });
        existingUids.add(pUid);
      }
    } catch (err) {
      console.warn('Collection-group clinicianGrants query failed (missing index?), falling back to local entries:', err);
    }
  }

  // 2. All dyad invites issued by clinician (cloud + local)
  const invites = await listMyDyadInvites();
  for (const inv of invites) {
    const dyadUid = inv.dyadUid || `dyad_${inv.inviteCode}`;
    if (!existingUids.has(dyadUid) && !existingUids.has(inv.claimedByUid || '')) {
      entries.push({
        patientUid: dyadUid,
        grant: {
          clinicianUid: uid,
          clinicianLabel: inv.clinicianLabel ?? 'Dr. Vivek',
          grantedAt: inv.createdAt,
          revokedAt: null
        }
      });
      existingUids.add(dyadUid);
    }
  }

  // 3. All registered patients in HealthRepository
  const localPatients = HealthRepository.getRegisteredPatients();
  for (const lp of localPatients) {
    const dyadUid = lp.patientUid;
    if (!existingUids.has(dyadUid)) {
      entries.push({
        patientUid: dyadUid,
        grant: {
          clinicianUid: uid,
          clinicianLabel: 'Dr. Vivek',
          grantedAt: lp.createdAt,
          revokedAt: null
        }
      });
      existingUids.add(dyadUid);
    }
  }

  // A dyad_* placeholder whose invite has since been claimed is stale
  // scratch space — its clinicianGrant to this clinician was never revoked
  // at claim time, so step 1 above can surface it as a *second*, orphaned
  // entry alongside the claimant's real uid for the same patient. Drop it.
  const claimedPlaceholders = new Set(
    invites
      .filter((inv) => inv.claimedByUid)
      .map((inv) => inv.dyadUid || `dyad_${inv.inviteCode}`)
  );
  return entries.filter((e) => !claimedPlaceholders.has(e.patientUid));
}
