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
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
    await assertSucceeds(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1')));
  });

  it('a clinician with NO grant is DENIED', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID).firestore();
    await assertFails(getDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1')));
  });

  it('a REVOKED grant is DENIED', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), 'users', CAREGIVER_UID, 'clinicianGrants', CLINICIAN_UID),
        { clinicianUid: CLINICIAN_UID, grantedAt: new Date().toISOString(), revokedAt: new Date().toISOString() }
      );
    });
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
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
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
    await assertSucceeds(
      setDoc(doc(clinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-2'), SAMPLE_ASSESSMENT)
    );
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID).firestore();
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
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
    await assertSucceeds(
      setDoc(doc(clinician, 'users', CAREGIVER_UID, 'functionScores', 'fs-1'), SAMPLE_SCORE)
    );
  });

  it('an ungranted clinician CANNOT record a function score', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID).firestore();
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
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
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
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
    await assertFails(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1')));
  });

  it('a clinician can read their own grant doc to check status', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
    await assertSucceeds(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'clinicianGrants', CLINICIAN_UID)));
  });
});

describe('roster collection-group query — clinician sees only their own grants', () => {
  it("a collection-group query for the clinician's own grants returns exactly the consented dyad", async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
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
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID).firestore();
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
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
    await assertFails(
      setDoc(
        doc(clinician, 'users', CAREGIVER_UID, 'zaritAssessments', 'assessment-1'),
        { totalScore: 10 },
        { merge: true }
      )
    );
  });

  it('a granted clinician CANNOT delete a past assessment', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
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
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
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
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
    await assertFails(
      setDoc(
        doc(clinician, 'users', CAREGIVER_UID, 'functionScores', 'fs-seed'),
        { barthelScore: 80 },
        { merge: true }
      )
    );
  });

  it('a granted clinician CANNOT delete a function score', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
    await assertFails(
      deleteDoc(doc(clinician, 'users', CAREGIVER_UID, 'functionScores', 'fs-seed'))
    );
  });
});

describe('reassessmentRequests & reassessmentAlerts — workflow rules', () => {
  it('a granted clinician CAN create a reassessment request for a patient', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
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
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID).firestore();
    await assertFails(
      setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'patientProfile', 'current'), VALID_PROFILE)
    );
  });

  it('an ungranted professional CANNOT write a real caregiver uid\'s caregiverAttributes', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID).firestore();
    await assertFails(
      setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'caregiverAttributes', 'current'), VALID_CAREGIVER_ATTRS)
    );
  });

  it('a granted clinician CAN still write the real caregiver uid\'s patientProfile', async () => {
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
    await assertSucceeds(
      setDoc(doc(clinician, 'users', CAREGIVER_UID, 'patientProfile', 'current'), VALID_PROFILE)
    );
  });

  it('ANY professional (even ungranted) CAN bootstrap a dyad_* placeholder patientProfile pre-claim', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID).firestore();
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
    const clinician = testEnv.authenticatedContext(CLINICIAN_UID).firestore();
    await assertSucceeds(getDoc(doc(clinician, 'users', CAREGIVER_UID, 'careCircle', 'current')));
  });

  it('an ungranted clinician CANNOT read or write the care circle', async () => {
    const otherClinician = testEnv.authenticatedContext(OTHER_CLINICIAN_UID).firestore();
    await assertFails(getDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'careCircle', 'current')));
    await assertFails(setDoc(doc(otherClinician, 'users', CAREGIVER_UID, 'careCircle', 'current'), VALID_CIRCLE));
  });
});

