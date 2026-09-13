/**
 * Functional Firestore security-rules tests, run against the actual Firebase
 * Local Emulator Suite (not string-matching the rules file — real
 * allow/deny assertions using @firebase/rules-unit-testing). Requires the
 * emulator to already be running:
 *
 *   JAVA_HOME=/opt/homebrew/opt/openjdk@21 firebase emulators:start --only auth,firestore
 *
 * Then in another terminal:
 *
 *   npx vitest run src/lib/firebase/rules.emulator.test.ts
 *
 * Excluded from the default `npm test` run (see vitest.config.mts) since it
 * needs the emulator as an external dependency, unlike the pure-function
 * unit tests elsewhere in the repo.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, collectionGroup, query, where } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const CAREGIVER_UID = 'caregiver-alice';
const CLINICIAN_UID = 'clinician-dr-bob';
const OTHER_CLINICIAN_UID = 'clinician-dr-carol';
const RANDOM_STRANGER_UID = 'stranger-mallory';

/**
 * Clinical role now comes exclusively from Admin SDK-issued custom claims —
 * the email-pattern inference these fixtures previously relied on has been
 * removed from firestore.rules. A clinician context must therefore carry the
 * same claim shape that /api/admin/claims provisions, or every
 * hasActiveGrant() check correctly evaluates to false.
 */
const CLINICIAN_CLAIMS = { role: 'doctor', clinician: true } as const;

const SAMPLE_ASSESSMENT = {
  tier: 'ZBI22',
  totalScore: 44,
  maxScore: 88,
  normalizedPercentage: 50,
  classification: { en: 'x', hi: 'x', mr: 'x' },
  severityBand: 'amber',
  factors: {},
  domainCapacities: {},
  redFlags: [],
  isCrisisTriggered: false,
  prescriptions: [],
  completedAt: new Date().toISOString()
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'sanjeevani-dev',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // Seed profile docs and a grant, bypassing rules (admin context) so each
  // test starts from a known, realistic state rather than re-deriving it.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', CAREGIVER_UID), { role: 'caregiver', createdAt: new Date() });
    await setDoc(doc(db, 'users', CLINICIAN_UID), { role: 'professional', createdAt: new Date() });
    await setDoc(doc(db, 'users', OTHER_CLINICIAN_UID), { role: 'professional', createdAt: new Date() });
    await setDoc(doc(db, 'users', RANDOM_STRANGER_UID), { role: 'caregiver', createdAt: new Date() });
    await setDoc(doc(db, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1'), SAMPLE_ASSESSMENT);
    await setDoc(doc(db, 'users', CAREGIVER_UID, 'clinicianGrants', CLINICIAN_UID), {
      clinicianUid: CLINICIAN_UID,
      grantedAt: new Date().toISOString(),
      revokedAt: null
    });
  });
});

describe('zaritAssessments — clinician consent gating', () => {
  it('the owning caregiver can always read their own assessment', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(getDoc(doc(caregiver, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1')));
  });

  it('a clinician with an active grant CAN read the assessment', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1')));
  });

  it('a clinician with NO grant is DENIED', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(getDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1')));
  });

  it('a REVOKED grant is DENIED', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), 'users', CAREGIVER_UID, 'clinicianGrants', CLINICIAN_UID),
        { clinicianUid: CLINICIAN_UID, grantedAt: new Date().toISOString(), revokedAt: new Date().toISOString() }
      );
    });
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1')));
  });

  it('a random authenticated non-professional user is DENIED even with a forged grant doc', async () => {
    // RANDOM_STRANGER_UID has role: 'caregiver', not 'professional'. Even if
    // someone forged a grant doc naming them, isProfessional() must block it.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'clinicianGrants', RANDOM_STRANGER_UID), {
        clinicianUid: RANDOM_STRANGER_UID,
        grantedAt: new Date().toISOString(),
        revokedAt: null
      });
    });
    const stranger = testEnv.authenticatedContext(RANDOM_STRANGER_UID).firestore();
    await assertFails(getDoc(doc(stranger, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1')));
  });

  it('an unauthenticated request is DENIED', async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1')));
  });

  it('a clinician with an active grant CAN create an assessment, but a clinician with NO grant is DENIED', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(
      setDoc(doc(clinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-2'), SAMPLE_ASSESSMENT)
    );
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-3'), SAMPLE_ASSESSMENT)
    );
  });
});

describe('functionScores — either owner or granted clinician may record', () => {
  const SAMPLE_SCORE = {
    barthelScore: 70,
    lawtonScore: 6,
    dependencyPercentage: 30,
    band: 'moderate',
    recordedAt: new Date().toISOString()
  };

  it('a granted clinician CAN record a function score for the dyad', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(
      setDoc(doc(clinician, 'users', CAREGIVER_UID, 'functionScores', 'fs-1'), SAMPLE_SCORE)
    );
  });

  it('an ungranted clinician CANNOT record a function score', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'functionScores', 'fs-2'), SAMPLE_SCORE)
    );
  });

  it('rejects an out-of-range barthelScore even from the owning caregiver', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'functionScores', 'fs-3'), {
        ...SAMPLE_SCORE,
        barthelScore: 150
      })
    );
  });
});

describe('clinicianGrants — consent can only originate from the caregiver', () => {
  it('the clinician cannot self-grant access to a dyad', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      setDoc(doc(clinician, 'users', CAREGIVER_UID, 'clinicianGrants', OTHER_CLINICIAN_UID), {
        clinicianUid: OTHER_CLINICIAN_UID,
        grantedAt: new Date().toISOString(),
        revokedAt: null
      })
    );
  });

  it('the caregiver can revoke a grant they issued', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(
      setDoc(
        doc(caregiver, 'users', CAREGIVER_UID, 'clinicianGrants', CLINICIAN_UID),
        { revokedAt: new Date().toISOString() },
        { merge: true }
      )
    );
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1')));
  });

  it('a clinician can read their own grant doc to check status', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'clinicianGrants', CLINICIAN_UID)));
  });
});

describe('roster collection-group query — clinician sees only their own grants', () => {
  it("a collection-group query for the clinician's own grants returns exactly the consented dyad", async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    const q = query(
      collectionGroup(clinician, 'clinicianGrants'),
      where('clinicianUid', '==', CLINICIAN_UID),
      where('revokedAt', '==', null)
    );
    const snap = await assertSucceeds(getDocs(q));
    expect(snap.docs).toHaveLength(1);
    expect(snap.docs[0].ref.parent.parent!.id).toBe(CAREGIVER_UID);
  });

  it("a different clinician's collection-group query returns nothing for this caregiver", async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    const q = query(
      collectionGroup(otherClinician, 'clinicianGrants'),
      where('clinicianUid', '==', OTHER_CLINICIAN_UID),
      where('revokedAt', '==', null)
    );
    const snap = await assertSucceeds(getDocs(q));
    expect(snap.docs).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ *
 * Immutability: audit-trail subcollections must be create-only
 * ------------------------------------------------------------------ */

describe('zaritAssessments — immutability (audit trail)', () => {
  it('the owning caregiver CANNOT update a past assessment', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      setDoc(
        doc(caregiver, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1'),
        { totalScore: 10 },
        { merge: true }
      )
    );
  });

  it('the owning caregiver CANNOT delete a past assessment', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      deleteDoc(doc(caregiver, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1'))
    );
  });

  it('a granted clinician CANNOT update a past assessment', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      setDoc(
        doc(clinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1'),
        { totalScore: 10 },
        { merge: true }
      )
    );
  });

  it('a granted clinician CANNOT delete a past assessment', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      deleteDoc(doc(clinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1'))
    );
  });
});

describe('vitals — immutability (audit trail)', () => {
  const SAMPLE_VITAL = {
    date: new Date().toISOString(),
    sleep: 'good',
    createdAt: new Date().toISOString(),
    bp: '120/80',
    pulse: '72'
  };

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'vitals', 'vital-1'), SAMPLE_VITAL);
    });
  });

  it('the owning caregiver CAN create a new vital reading', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(
      setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'vitals', 'vital-new'), SAMPLE_VITAL)
    );
  });

  it('the owning caregiver CANNOT update an existing vital reading', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      setDoc(
        doc(caregiver, 'users', CAREGIVER_UID, 'vitals', 'vital-1'),
        { bp: '130/85' },
        { merge: true }
      )
    );
  });

  it('the owning caregiver CANNOT delete a vital reading', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      deleteDoc(doc(caregiver, 'users', CAREGIVER_UID, 'vitals', 'vital-1'))
    );
  });

  it('a granted clinician CANNOT update a vital reading', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      setDoc(
        doc(clinician, 'users', CAREGIVER_UID, 'vitals', 'vital-1'),
        { pulse: '80' },
        { merge: true }
      )
    );
  });
});

describe('functionScores — immutability (audit trail)', () => {
  const SAMPLE_SCORE = {
    barthelScore: 70,
    lawtonScore: 6,
    dependencyPercentage: 30,
    band: 'moderate',
    recordedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'functionScores', 'fs-seed'), SAMPLE_SCORE);
    });
  });

  it('the owning caregiver CANNOT update a function score', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      setDoc(
        doc(caregiver, 'users', CAREGIVER_UID, 'functionScores', 'fs-seed'),
        { barthelScore: 80 },
        { merge: true }
      )
    );
  });

  it('the owning caregiver CANNOT delete a function score', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      deleteDoc(doc(caregiver, 'users', CAREGIVER_UID, 'functionScores', 'fs-seed'))
    );
  });

  it('a granted clinician CANNOT update a function score', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      setDoc(
        doc(clinician, 'users', CAREGIVER_UID, 'functionScores', 'fs-seed'),
        { barthelScore: 80 },
        { merge: true }
      )
    );
  });

  it('a granted clinician CANNOT delete a function score', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      deleteDoc(doc(clinician, 'users', CAREGIVER_UID, 'functionScores', 'fs-seed'))
    );
  });
});

describe('reassessmentRequests & reassessmentAlerts — workflow rules', () => {
  it('a granted clinician CAN create a reassessment request for a patient', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(
      setDoc(
        doc(clinician, 'users', CAREGIVER_UID, 'reassessmentRequests', 'current'),
        { requestedAt: new Date().toISOString(), requestedBy: CLINICIAN_UID, status: 'pending' }
      )
    );
  });

  it('an ungranted clinician CANNOT create a reassessment request', async () => {
    const stranger = testEnv.authenticatedContext(RANDOM_STRANGER_UID).firestore();
    await assertFails(
      setDoc(
        doc(stranger, 'users', CAREGIVER_UID, 'reassessmentRequests', 'current'),
        { requestedAt: new Date().toISOString(), requestedBy: RANDOM_STRANGER_UID, status: 'pending' }
      )
    );
  });

  it('the caregiver CAN read their own reassessment request', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(
      getDoc(doc(caregiver, 'users', CAREGIVER_UID, 'reassessmentRequests', 'current'))
    );
  });

  it('caregiver CAN create a reassessment alert for their granted clinician', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(
      setDoc(
        doc(caregiver, 'users', CLINICIAN_UID, 'reassessmentAlerts', 'alert-1'),
        { patientUid: CAREGIVER_UID, patientName: 'Alice', previousScore: 40, newScore: 60 }
      )
    );
  });

  it('a stranger CANNOT read the clinician alerts', async () => {
    const stranger = testEnv.authenticatedContext(RANDOM_STRANGER_UID).firestore();
    await assertFails(
      getDoc(doc(stranger, 'users', CLINICIAN_UID, 'reassessmentAlerts', 'alert-1'))
    );
  });

  it('a user with NO active grant on that clinician CANNOT create a reassessment alert, even claiming their own uid as patientUid', async () => {
    const stranger = testEnv.authenticatedContext(RANDOM_STRANGER_UID).firestore();
    await assertFails(
      setDoc(
        doc(stranger, 'users', CLINICIAN_UID, 'reassessmentAlerts', 'spoofed-alert'),
        { patientUid: RANDOM_STRANGER_UID, patientName: 'Mallory', previousScore: 40, newScore: 60 }
      )
    );
  });

  it('a user CANNOT create a reassessment alert claiming a different patientUid than their own', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      setDoc(
        doc(caregiver, 'users', CLINICIAN_UID, 'reassessmentAlerts', 'spoofed-alert-2'),
        { patientUid: RANDOM_STRANGER_UID, patientName: 'Not Alice', previousScore: 40, newScore: 60 }
      )
    );
  });

  it('a REVOKED grant no longer lets the caregiver create a reassessment alert for that clinician', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'clinicianGrants', CLINICIAN_UID), {
        clinicianUid: CLINICIAN_UID,
        grantedAt: new Date().toISOString(),
        revokedAt: new Date().toISOString()
      });
    });
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      setDoc(
        doc(caregiver, 'users', CLINICIAN_UID, 'reassessmentAlerts', 'alert-after-revoke'),
        { patientUid: CAREGIVER_UID, patientName: 'Alice', previousScore: 40, newScore: 60 }
      )
    );
  });
});

describe('patientProfile / caregiverAttributes — professional bypass scoped to dyad_* placeholders only', () => {
  const VALID_PROFILE = {
    katzAdl: { bathing: true, dressing: true, toileting: true, transferring: true, continence: true, feeding: true },
    lawtonIadl: {
      telephone: true, shopping: true, mealPreparation: true, housekeeping: true,
      laundry: true, transportation: true, medicationManagement: true, finances: true
    },
    updatedAt: new Date().toISOString()
  };
  const VALID_CAREGIVER_ATTRS = { name: 'Primary Caregiver' };

  it('an ungranted professional CANNOT write a real caregiver uid\'s patientProfile', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'patientProfile', 'current'), VALID_PROFILE)
    );
  });

  it('an ungranted professional CANNOT write a real caregiver uid\'s caregiverAttributes', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'caregiverAttributes', 'current'), VALID_CAREGIVER_ATTRS)
    );
  });

  it('a granted clinician CAN still write the real caregiver uid\'s patientProfile', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(
      setDoc(doc(clinician, 'users', CAREGIVER_UID, 'patientProfile', 'current'), VALID_PROFILE)
    );
  });

  it('ANY professional (even ungranted) CAN bootstrap a dyad_* placeholder patientProfile pre-claim', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(
      setDoc(doc(otherClinician, 'users', 'dyad_ABC123', 'patientProfile', 'current'), VALID_PROFILE)
    );
  });

  it('a non-professional caregiver CANNOT write a dyad_* placeholder patientProfile', async () => {
    const stranger = testEnv.authenticatedContext(RANDOM_STRANGER_UID).firestore();
    await assertFails(
      setDoc(doc(stranger, 'users', 'dyad_ABC123', 'patientProfile', 'current'), VALID_PROFILE)
    );
  });

  it('any authenticated user CAN read a dyad_* placeholder patientProfile (invite-claim migration)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'dyad_ABC123', 'patientProfile', 'current'), VALID_PROFILE);
    });
    const stranger = testEnv.authenticatedContext(RANDOM_STRANGER_UID).firestore();
    await assertSucceeds(getDoc(doc(stranger, 'users', 'dyad_ABC123', 'patientProfile', 'current')));
  });

  it('a stranger with no grant CANNOT read a real caregiver uid\'s patientProfile', async () => {
    const stranger = testEnv.authenticatedContext(RANDOM_STRANGER_UID).firestore();
    await assertFails(getDoc(doc(stranger, 'users', CAREGIVER_UID, 'patientProfile', 'current')));
  });
});

describe('careCircle — single current document, same access model as caregiverAttributes', () => {
  const VALID_CIRCLE = { members: [], tasks: [], updatedAt: new Date().toISOString() };

  it('the owning caregiver CAN write their own care circle', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'careCircle', 'current'), VALID_CIRCLE));
  });

  it('a granted clinician CAN read the care circle', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'careCircle', 'current'), VALID_CIRCLE);
    });
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'careCircle', 'current')));
  });

  it('an ungranted clinician CANNOT read or write the care circle', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(getDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'careCircle', 'current')));
    await assertFails(setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'careCircle', 'current'), VALID_CIRCLE));
  });
});

describe('newly cloud-backed collections — emergencyContacts, consent, bedsideRoutineChecklist, dischargeMilestones', () => {
  const VALID_CONTACTS = { contacts: [{ id: 'c1', name: 'Dr. Sharma', relation: 'Physician', phone: '9820012345', isPrimary: true, notifyOnCrisis: true }], updatedAt: new Date().toISOString() };
  const VALID_CONSENT = { hasConsented: true, vitalsTrackingConsent: true, psychometricConsent: true, consentTimestamp: new Date().toISOString(), dpdpNoticeVersion: '2026.1' };
  const VALID_CHECKLIST = { completedTasks: { task1: true }, updatedAt: new Date().toISOString() };
  const VALID_MILESTONES = { completedMilestones: { m1: true }, updatedAt: new Date().toISOString() };

  it('the owning caregiver CAN write and read their own emergency contacts', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'emergencyContacts', 'current'), VALID_CONTACTS));
    await assertSucceeds(getDoc(doc(caregiver, 'users', CAREGIVER_UID, 'emergencyContacts', 'current')));
  });

  it('a granted clinician CAN read but CANNOT write emergency contacts', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'emergencyContacts', 'current'), VALID_CONTACTS);
    });
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'emergencyContacts', 'current')));
    await assertFails(setDoc(doc(clinician, 'users', CAREGIVER_UID, 'emergencyContacts', 'current'), VALID_CONTACTS));
  });

  it('an ungranted clinician CANNOT read emergency contacts', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(getDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'emergencyContacts', 'current')));
  });

  it('the owning caregiver CAN write and read their own consent record', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'consent', 'current'), VALID_CONSENT));
    await assertSucceeds(getDoc(doc(caregiver, 'users', CAREGIVER_UID, 'consent', 'current')));
  });

  it('consent stays owner-only — even a granted clinician CANNOT read or write it', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'consent', 'current'), VALID_CONSENT);
    });
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'consent', 'current')));
    await assertFails(setDoc(doc(clinician, 'users', CAREGIVER_UID, 'consent', 'current'), VALID_CONSENT));
  });

  it('the owning caregiver CAN write the bedside routine checklist, and a granted clinician CAN read/write it too', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'bedsideRoutineChecklist', 'current'), VALID_CHECKLIST));
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'bedsideRoutineChecklist', 'current')));
    await assertSucceeds(setDoc(doc(clinician, 'users', CAREGIVER_UID, 'bedsideRoutineChecklist', 'current'), VALID_CHECKLIST));
  });

  it('an ungranted clinician CANNOT read or write the bedside routine checklist', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(getDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'bedsideRoutineChecklist', 'current')));
    await assertFails(setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'bedsideRoutineChecklist', 'current'), VALID_CHECKLIST));
  });

  it('the owning caregiver CAN write discharge milestones, and a granted clinician CAN read them', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'dischargeMilestones', 'current'), VALID_MILESTONES));
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'dischargeMilestones', 'current')));
  });

  it('an ungranted clinician CANNOT read discharge milestones', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(getDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'dischargeMilestones', 'current')));
  });
});

describe('users/{userId} — merging device-local UI preferences (preferredRole, onboardingCompleted)', () => {
  it('the owner CAN merge preferredRole/onboardingCompleted without touching role or createdAt', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(
      setDoc(
        doc(caregiver, 'users', CAREGIVER_UID),
        { preferredRole: 'nurse', onboardingCompleted: true },
        { merge: true }
      )
    );
  });

  it('a stranger CANNOT merge preferences into another user\'s doc', async () => {
    const stranger = testEnv.authenticatedContext(RANDOM_STRANGER_UID).firestore();
    await assertFails(
      setDoc(
        doc(stranger, 'users', CAREGIVER_UID),
        { preferredRole: 'nurse', onboardingCompleted: true },
        { merge: true }
      )
    );
  });
});

describe('drafts — owner-only, no clinician access', () => {
  const VALID_DRAFT = { data: { step: 2, systolic: '130' }, updatedAt: new Date().toISOString() };

  it('the owner CAN write and read their own draft', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'drafts', 'vitalsDraft'), VALID_DRAFT));
    await assertSucceeds(getDoc(doc(caregiver, 'users', CAREGIVER_UID, 'drafts', 'vitalsDraft')));
  });

  it('the owner CAN delete their own draft', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'drafts', 'vitalsDraft'), VALID_DRAFT);
    });
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(deleteDoc(doc(caregiver, 'users', CAREGIVER_UID, 'drafts', 'vitalsDraft')));
  });

  it('even a granted clinician CANNOT read or write a caregiver\'s draft', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'drafts', 'vitalsDraft'), VALID_DRAFT);
    });
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'drafts', 'vitalsDraft')));
    await assertFails(setDoc(doc(clinician, 'users', CAREGIVER_UID, 'drafts', 'vitalsDraft'), VALID_DRAFT));
  });

  it('a stranger CANNOT read or write another user\'s draft', async () => {
    const stranger = testEnv.authenticatedContext(RANDOM_STRANGER_UID).firestore();
    await assertFails(getDoc(doc(stranger, 'users', CAREGIVER_UID, 'drafts', 'onboardingDraft')));
    await assertFails(setDoc(doc(stranger, 'users', CAREGIVER_UID, 'drafts', 'onboardingDraft'), VALID_DRAFT));
  });
});


describe('clinicalAuthorization — clinician-only write, and post-approval tampering is rejected by the app-level hash check', () => {
  const VALID_AUTH_RECORD = {
    hashVersion: 'sha256-canonical-json-v1',
    blueprintId: 'bp_1',
    planHash: 'a'.repeat(64),
    authorizedAt: new Date().toISOString(),
    authorizedByUid: CLINICIAN_UID,
    authorizedByName: 'Dr. Vivek'
  };

  it('a granted clinician CAN create the clinicalAuthorization record with their own uid as author', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(
      setDoc(doc(clinician, 'users', CAREGIVER_UID, 'clinicalAuthorization', 'current'), VALID_AUTH_RECORD)
    );
  });

  it('a clinician CANNOT write authorizedByUid as someone else\'s uid (forged authorship)', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      setDoc(doc(clinician, 'users', CAREGIVER_UID, 'clinicalAuthorization', 'current'), {
        ...VALID_AUTH_RECORD,
        authorizedByUid: OTHER_CLINICIAN_UID
      })
    );
  });

  it('the owning caregiver CANNOT create or update the clinicalAuthorization record — the P0 forgery path', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'clinicalAuthorization', 'current'), VALID_AUTH_RECORD)
    );
  });

  it('the owning caregiver CAN still read the authorization record (needed to render the "authorized" badge)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'clinicalAuthorization', 'current'), VALID_AUTH_RECORD);
    });
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(getDoc(doc(caregiver, 'users', CAREGIVER_UID, 'clinicalAuthorization', 'current')));
  });

  it('an ungranted clinician CANNOT write the clinicalAuthorization record for a real caregiver uid', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(
      setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'clinicalAuthorization', 'current'), {
        ...VALID_AUTH_RECORD,
        authorizedByUid: OTHER_CLINICIAN_UID
      })
    );
  });

  it(
    'POST-APPROVAL TAMPERING: after a clinician authorizes a plan, the caregiver editing authoredInstructions ' +
      'is still permitted by the rules (caregivers may edit their own blueprint content), but the plan hash on ' +
      'the separate clinicalAuthorization record no longer matches — this is what the app-level ' +
      'verifyClinicalAuthorization() catches and firestore.rules alone cannot',
    async () => {
      const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
      const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();

      // Clinician signs the plan.
      await assertSucceeds(
        setDoc(doc(clinician, 'users', CAREGIVER_UID, 'clinicalAuthorization', 'current'), VALID_AUTH_RECORD)
      );

      // Caregiver saves caregiverAttributes with the SAME clinicalReview object carried forward
      // (rules require this — see caregiverAttributes create/update predicate) while changing
      // authoredInstructions underneath it. This write must succeed at the rules layer...
      const originalReview = { decision: 'issued_by_clinician', reviewedAt: new Date().toISOString(), reviewedBy: 'Dr. Vivek', policyVersion: '1', decisionSupportStatus: 'ready_for_clinician_review' };
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'caregiverAttributes', 'current'), {
          name: 'Primary Caregiver',
          careBlueprint: {
            id: 'bp_1',
            authoredInstructions: [{ id: 'i1', timingWindow: 'morning_rush', instruction: 'Original safe instruction', indication: 'X', authoredBy: 'Dr. Vivek' }],
            clinicalReview: originalReview
          }
        });
      });
      await assertSucceeds(
        setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'caregiverAttributes', 'current'), {
          name: 'Primary Caregiver',
          careBlueprint: {
            id: 'bp_1',
            authoredInstructions: [{ id: 'i1', timingWindow: 'morning_rush', instruction: 'TAMPERED: two-person pivot transfer, no PT/OT assessment', indication: 'X', authoredBy: 'Dr. Vivek' }],
            clinicalReview: originalReview // unchanged — this is exactly what the rules allow through
          }
        })
      );

      // ...which is precisely why authorization must never be trusted from clinicalReview alone:
      // the clinicalAuthorization record's planHash ('a'.repeat(64), fixed above) reflects the
      // ORIGINAL content and will not match a hash recomputed over the tampered instructions.
      // (verifyClinicalAuthorization in src/lib/clinical/clinical-authorization.ts performs that
      // comparison client-side; tests/clinical-authorization.test.ts exercises it directly.)
      let authSnap: Awaited<ReturnType<typeof getDoc>> | undefined;
      let attrsSnap: Awaited<ReturnType<typeof getDoc>> | undefined;
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        authSnap = await getDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'clinicalAuthorization', 'current'));
        attrsSnap = await getDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'caregiverAttributes', 'current'));
      });
      const authData = authSnap?.data() as { planHash?: string } | undefined;
      const attrsData = attrsSnap?.data() as { careBlueprint?: { authoredInstructions?: Array<{ instruction?: string }> } } | undefined;
      expect(authData?.planHash).toBe(VALID_AUTH_RECORD.planHash);
      expect(attrsData?.careBlueprint?.authoredInstructions?.[0]?.instruction).toContain('TAMPERED');
      // The stored planHash was never updated by this caregiver write (rules forbid the caregiver
      // from touching clinicalAuthorization at all), so it is now stale relative to live content —
      // exactly the state verifyClinicalAuthorization() detects as `planStatus: 'stale'`.
    }
  );

  it('the caregiver CANNOT create clinicalReview from nothing (must originate from a clinician write elsewhere)', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'caregiverAttributes', 'current'), {
        name: 'Primary Caregiver',
        careBlueprint: {
          id: 'bp_self',
          clinicalReview: { decision: 'issued_by_clinician', reviewedAt: new Date().toISOString(), reviewedBy: 'Self', policyVersion: '1', decisionSupportStatus: 'ready_for_clinician_review' }
        }
      })
    );
  });
});

describe('exportAuditLog — append-only, owner or granted clinician only', () => {
  const VALID_AUDIT_ENTRY = {
    channel: 'whatsapp_text',
    exportedAt: new Date().toISOString(),
    exportedByUid: CAREGIVER_UID,
    exportedByRole: 'caregiver',
    recipientLabel: 'Family group',
    redacted: true,
    consentGiven: true,
    recipientConfirmed: true,
    contentLength: 500
  };

  it('the owning caregiver CAN write their own export audit entry', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertSucceeds(
      setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'exportAuditLog', 'entry1'), VALID_AUDIT_ENTRY)
    );
  });

  it('a caregiver CANNOT write an audit entry claiming someone else exported it', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'exportAuditLog', 'entry2'), {
        ...VALID_AUDIT_ENTRY,
        exportedByUid: OTHER_CLINICIAN_UID
      })
    );
  });

  it('an audit entry CANNOT be updated or deleted (append-only)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'exportAuditLog', 'entry1'), VALID_AUDIT_ENTRY);
    });
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'exportAuditLog', 'entry1'), { ...VALID_AUDIT_ENTRY, redacted: false }));
    await assertFails(deleteDoc(doc(caregiver, 'users', CAREGIVER_UID, 'exportAuditLog', 'entry1')));
  });

  it('an ungranted clinician CANNOT read or write the export audit log', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertFails(getDocs(collection(otherClinician, 'users', CAREGIVER_UID, 'exportAuditLog')));
    await assertFails(setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'exportAuditLog', 'entry3'), VALID_AUDIT_ENTRY));
  });

  it('a granted clinician CAN read the export audit log', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', CAREGIVER_UID, 'exportAuditLog', 'entry1'), VALID_AUDIT_ENTRY);
    });
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID, CLINICIAN_CLAIMS).firestore();
    await assertSucceeds(getDocs(collection(clinician, 'users', CAREGIVER_UID, 'exportAuditLog')));
  });

  it('a stranger CANNOT write an export audit entry without consentGiven/recipientConfirmed both true', async () => {
    const caregiver = testEnv.authenticatedContext(CAREGIVER_UID).firestore();
    await assertFails(
      setDoc(doc(caregiver, 'users', CAREGIVER_UID, 'exportAuditLog', 'entry4'), { ...VALID_AUDIT_ENTRY, consentGiven: false })
    );
  });
});
