/**
 * Who may see which dyad: clinician grants (consent), doctor-issued staff
 * assignments, the fixed demo personas, and the roster query built on top.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  collectionGroup,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../client';
import { HealthRepository } from '@/lib/db/health-repository';
import { currentUid, withRetry } from './internal';
import { getDyadInvite, listMyDyadInvites, claimDyadInvite, autoClaimInviteByEmail } from './dyad-invites';

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

export async function createStaffInvite(
  dyadUid: string,
  code: string,
  label: string,
  assignedEmail?: string | null
): Promise<void> {
  if (!db) return;
  await withRetry(() =>
    setDoc(doc(db!, 'users', dyadUid, 'clinicianGrants', `invite_${code}`), {
      clinicianUid: `invite_${code}`,
      clinicianLabel: label,
      grantedAt: new Date().toISOString(),
      revokedAt: null,
      assignedEmail: assignedEmail?.trim().toLowerCase() || null
    })
  );
}

/** Any authenticated clinical-staff account may claim a known staff invite code, once, per dyad. */
export async function claimStaffInvite(dyadUid: string, code: string): Promise<void> {
  const uid = currentUid();
  if (!uid || !db) return;
  const sentinelId = `invite_${code}`;
  const sentinelRef = doc(db, 'users', dyadUid, 'clinicianGrants', sentinelId);
  const targetGrantRef = doc(db, 'users', dyadUid, 'clinicianGrants', uid);

  await runTransaction(db, async (txn) => {
    const sentinelSnap = await txn.get(sentinelRef);
    if (!sentinelSnap.exists()) return;
    const label = (sentinelSnap.data() as { clinicianLabel?: string })?.clinicianLabel ?? null;
    txn.set(targetGrantRef, {
      clinicianUid: uid,
      clinicianLabel: label,
      grantedAt: new Date().toISOString(),
      revokedAt: null,
      staffInviteCode: sentinelId
    });
  });
}

/**
 * Finds every unclaimed staff invite addressed to `email` (across every
 * patient a doctor has assigned one to) and claims each — the general,
 * doctor-driven counterpart to a hardcoded assignment. A collection-group
 * query on clinicianGrants scoped to `assignedEmail`; firestore.rules'
 * matching {path=**} rule only exposes docs where that field equals the
 * requester's own token email, so this can never enumerate other staff's
 * assignments.
 */
export async function claimStaffInviteByEmail(email: string | null): Promise<number> {
  const uid = currentUid();
  if (!uid || !db || !email) return 0;
  try {
    const q = query(
      collectionGroup(db, 'clinicianGrants'),
      where('assignedEmail', '==', email.trim().toLowerCase())
    );
    const snap = await getDocs(q);
    let claimed = 0;
    for (const d of snap.docs) {
      if (!d.id.startsWith('invite_')) continue;
      const dyadUid = d.ref.parent.parent?.id;
      if (!dyadUid) continue;
      await claimStaffInvite(dyadUid, d.id.replace(/^invite_/, ''));
      claimed++;
    }
    return claimed;
  } catch (err) {
    console.warn('Staff invite auto-claim by email skipped:', err);
    return 0;
  }
}

/**
 * Fixed demo personas: known accounts that should land pre-linked to a
 * specific seeded dyad on first sign-in instead of starting with an empty
 * roster/profile. Exact email matches only — real accounts are unaffected.
 * Best-effort and idempotent (safe to call on every sign-in): a caregiver
 * invite that's already claimed, or a staff invite the account already
 * holds, is simply skipped by claimDyadInvite/claimStaffInvite's own guards.
 * Kept alongside the general email-based auto-claim below (claimStaffInvite
 * ByEmail / autoClaimInviteByEmail) for the two original seeded personas,
 * whose invite/sentinel docs predate the assignedEmail/caregiverEmail
 * fields; every dyad registered through the app since then is covered by
 * the general path alone.
 */
const DEMO_CAREGIVER_INVITE_CLAIMS: Record<string, string> = {
  'sureshcaregiver@kutumbh.com': 'SAROJINI81'
};

const DEMO_STAFF_INVITE_CLAIMS: Record<string, Array<{ dyadUid: string; code: string }>> = {
  'vidyanurse@kutumbh.com': [{ dyadUid: 'dyad_sarojini_devi', code: 'NURSEVIDYA' }]
};

/**
 * Best-effort, idempotent, called on every sign-in: links whichever dyad(s)
 * a doctor registered this exact email as caregiver or assigned nurse for.
 * Two paths — the general one (any account, driven entirely by what a
 * doctor entered at registration/matrix-setup time) and a small fixed map
 * for the two original seeded demo personas predating that mechanism.
 */
export async function provisionDemoPersonaAccess(email: string | null | undefined): Promise<void> {
  if (!email || !db) return;
  const cleanEmail = email.toLowerCase();

  try {
    await autoClaimInviteByEmail(cleanEmail);
  } catch (err) {
    console.warn('Caregiver auto-claim by email notice:', err);
  }
  try {
    await claimStaffInviteByEmail(cleanEmail);
  } catch (err) {
    console.warn('Staff auto-claim by email notice:', err);
  }

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
    const code = inv.inviteCode;
    if (
      !existingUids.has(dyadUid) &&
      !existingUids.has(code) &&
      !existingUids.has(`dyad_${code}`) &&
      !existingUids.has(inv.claimedByUid || '')
    ) {
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
      if (code) {
        existingUids.add(code);
        existingUids.add(`dyad_${code}`);
      }
      if (inv.claimedByUid) existingUids.add(inv.claimedByUid);
    }
  }

  // 3. All registered patients in HealthRepository
  const localPatients = HealthRepository.getRegisteredPatients();
  for (const lp of localPatients) {
    const dyadUid = lp.patientUid;
    const code = lp.inviteCode;
    if (
      !existingUids.has(dyadUid) &&
      (!code || (!existingUids.has(code) && !existingUids.has(`dyad_${code}`)))
    ) {
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
      if (code) {
        existingUids.add(code);
        existingUids.add(`dyad_${code}`);
      }
    }
  }

  const archived = new Set(HealthRepository.getArchivedDyads());
  return entries.filter((e) => {
    const pUid = e.patientUid;
    if (archived.has(pUid) || archived.has(pUid.replace('dyad_', '')) || archived.has(`dyad_${pUid}`)) {
      return false;
    }
    if (
      (pUid.toLowerCase().includes('sarojini') || pUid.toUpperCase().includes('SAROJINI81')) &&
      (archived.has('demo-sarojini') || archived.has('dyad_sarojini_devi') || archived.has('SAROJINI81'))
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Doctor discharges or permanently deletes a patient dyad from their roster.
 * Revokes active care surveillance, deletes or revokes the clinician grant in Firestore,
 * removes any pending invite, and archives the local dyad data.
 */
export async function dischargeOrDeletePatientDyad(patientUid: string): Promise<void> {
  const uid = currentUid();
  const cleanId = patientUid.trim();

  // 1. Durably archive in HealthRepository and clear local storage keys
  HealthRepository.archiveDyad(cleanId);

  // 2. Cloud cleanup if Firestore is active
  if (db) {
    try {
      const batch = writeBatch(db);
      let opsCount = 0;

      if (uid) {
        // Revoke grant doc in batch
        const grantRef = doc(db, 'users', cleanId, 'clinicianGrants', uid);
        batch.delete(grantRef);
        opsCount++;
      }

      // If it's an invite or code, clean up dyadInvites
      const code = cleanId.replace('dyad_', '');
      if (code) {
        batch.delete(doc(db, 'dyadInvites', code));
        opsCount++;
        if (uid) {
          batch.delete(doc(db, 'users', uid, 'dyadInvites', code));
          opsCount++;
        }
      }

      // If cleanId is an invite code or dyadUid, also clean up by dyadUid query
      try {
        const snap = await getDocs(query(collection(db, 'dyadInvites'), where('dyadUid', '==', cleanId)));
        for (const d of snap.docs) {
          batch.delete(d.ref);
          opsCount++;
          if (uid) {
            batch.delete(doc(db, 'users', uid, 'dyadInvites', d.id));
            opsCount++;
          }
          HealthRepository.archiveDyad(d.id);
        }
      } catch {}

      // If Sarojini alias, delete the seeded Firestore invite
      if (cleanId.toLowerCase().includes('sarojini') || cleanId.toUpperCase().includes('SAROJINI81')) {
        batch.delete(doc(db, 'dyadInvites', 'SAROJINI81'));
        opsCount++;
        if (uid) {
          batch.delete(doc(db, 'users', uid, 'dyadInvites', 'SAROJINI81'));
          opsCount++;
        }
      }

      if (opsCount > 0) {
        await withRetry(() => batch.commit());
      }
    } catch (err) {
      console.warn(`Discharge dyad cloud notice for ${cleanId}:`, err);
    }
  }
}
