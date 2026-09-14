import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb, hasAdminCredentials } from '@/lib/firebase/admin';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';

export const runtime = 'nodejs';

const CodeLoginPayloadSchema = z.object({
  code: z
    .string()
    .min(4, 'Code must be at least 4 characters.')
    .max(20, 'Code is too long.')
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
  const userAgent = request.headers.get('user-agent') || 'unknown-ua';

  // IP rate limiting to prevent brute-forcing invite codes
  const rateLimit = checkRateLimit(`code-login:${ip}`, { windowMs: 60 * 1000, maxRequests: 20 });
  if (!rateLimit.allowed) {
    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'RATE_LIMIT_EXCEEDED',
      ip,
      userAgent,
      status: 'BLOCKED',
      details: { endpoint: '/api/auth/code-login' }
    });
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  try {
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = CodeLoginPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Please enter a valid invite code.', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const cleanCode = parseResult.data.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode) {
      return NextResponse.json({ error: 'Please enter a valid invite code.' }, { status: 400 });
    }

    if (!hasAdminCredentials()) {
      return NextResponse.json(
        { error: 'Server authentication service is temporarily unavailable. Please try email sign-in.' },
        { status: 503 }
      );
    }

    const db = adminDb();
    const auth = adminAuth();

    const inviteRef = db.doc(`dyadInvites/${cleanCode}`);
    let inviteSnap = await inviteRef.get();

    // Auto-seed initial demo dyad SAROJINI81 if not yet seeded
    if (!inviteSnap.exists && cleanCode === 'SAROJINI81') {
      const demoInvite = {
        inviteCode: 'SAROJINI81',
        dyadUid: 'dyad_sarojini_devi',
        clinicianUid: 'doctor-vivek-uid',
        clinicianLabel: 'Dr. Vivek (Geriatrics)',
        patientName: 'Sarojini Devi',
        patientAge: 81,
        primaryConditions: ['Parkinsons Disease', 'Post-Stroke Hemiparesis', 'Hypertension'],
        caregiverName: 'Suresh Sharma',
        caregiverPhone: '+919876543210',
        caregiverEmail: 'sureshcaregiver@kutumbh.com',
        createdAt: new Date().toISOString(),
        claimedAt: null,
        claimedByUid: null,
        patientProfileDraft: {
          name: 'Sarojini Devi',
          age: 81,
          primaryConditions: ['Parkinsons Disease', 'Post-Stroke Hemiparesis', 'Hypertension'],
          katzAdl: {
            bathing: false,
            dressing: false,
            toileting: false,
            transferring: false,
            continence: true,
            feeding: true
          },
          cognitiveBehavioralLoad: 'mild',
          fallHistoryLast6Months: 2
        }
      };
      await inviteRef.set(demoInvite, { merge: true });
      inviteSnap = await inviteRef.get();
    }

    if (!inviteSnap.exists) {
      return NextResponse.json(
        {
          error: `No registration found for code "${cleanCode}". Please verify the 8-character code from your clinician.`
        },
        { status: 404 }
      );
    }

    const invite = inviteSnap.data() || {};
    const patientName = invite.patientName || 'Patient';
    const caregiverName = invite.caregiverName || 'Family Caregiver';
    const clinicianUid = invite.clinicianUid || 'clinician';
    const clinicianLabel = invite.clinicianLabel || 'Treating Clinician';
    const dyadDocId = invite.dyadUid || `dyad_${cleanCode}`;
    const now = new Date().toISOString();

    let targetUid: string;
    let targetEmail: string;

    // Case 1: Invite was already claimed previously by an existing account
    if (invite.claimedByUid) {
      try {
        const existingUser = await auth.getUser(invite.claimedByUid);
        targetUid = existingUser.uid;
        targetEmail = existingUser.email || `${cleanCode.toLowerCase()}caregiver@kutumbh.com`;
      } catch (userErr: unknown) {
        // If claimed user was pruned, re-create or fall through to fresh email resolution
        targetEmail = invite.caregiverEmail || `${cleanCode.toLowerCase()}caregiver@kutumbh.com`;
        let rec;
        try {
          rec = await auth.getUserByEmail(targetEmail);
        } catch {
          rec = await auth.createUser({
            email: targetEmail,
            password: 'test1234',
            displayName: caregiverName
          });
        }
        targetUid = rec.uid;
        await inviteRef.set({ claimedByUid: targetUid }, { merge: true });
      }
    } else {
      // Case 2: Unclaimed invite — resolve or provision caregiver account
      targetEmail = invite.caregiverEmail || `${cleanCode.toLowerCase()}caregiver@kutumbh.com`;
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(targetEmail);
      } catch (err: unknown) {
        const errCode = (err as { code?: string })?.code;
        if (errCode === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email: targetEmail,
            password: 'test1234',
            displayName: caregiverName
          });
        } else {
          throw err;
        }
      }
      targetUid = userRecord.uid;

      // Assign custom role claim for security rules and token verification
      await auth.setCustomUserClaims(targetUid, { role: 'caregiver', kutumbh: true });

      // Ensure root user document exists in Firestore
      await db.doc(`users/${targetUid}`).set(
        {
          role: 'caregiver',
          email: targetEmail,
          displayName: caregiverName,
          createdAt: now,
          updatedAt: now
        },
        { merge: true }
      );

      // Claim the invite
      await inviteRef.set(
        {
          claimedAt: now,
          claimedByUid: targetUid
        },
        { merge: true }
      );

      // Link clinician grant
      await db.doc(`users/${targetUid}/clinicianGrants/${clinicianUid}`).set(
        {
          clinicianUid,
          clinicianLabel,
          grantedAt: now,
          revokedAt: null
        },
        { merge: true }
      );

      // Migrate patient profile from dyad placeholder draft or doc
      let profileData = invite.patientProfileDraft || {
        name: patientName,
        age: invite.patientAge || 70,
        primaryConditions: invite.primaryConditions || []
      };

      try {
        const dyadProfileSnap = await db.doc(`users/${dyadDocId}/patientProfile/current`).get();
        if (dyadProfileSnap.exists) {
          profileData = dyadProfileSnap.data()!;
        }
      } catch {
        // Fallback to draft
      }

      await db.doc(`users/${targetUid}/patientProfile/current`).set(
        {
          ...profileData,
          updatedAt: now
        },
        { merge: true }
      );

      // Migrate caregiver attributes
      try {
        const dyadAttrsSnap = await db.doc(`users/${dyadDocId}/caregiverAttributes/current`).get();
        const attrsData = dyadAttrsSnap.exists ? dyadAttrsSnap.data() : {};
        await db.doc(`users/${targetUid}/caregiverAttributes/current`).set(
          {
            ...attrsData,
            name: caregiverName,
            updatedAt: now
          },
          { merge: true }
        );
      } catch {
        // Non-blocking
      }

      // Migrate medications if any recorded by doctor
      try {
        const dyadMedsSnap = await db.doc(`users/${dyadDocId}/medications/current`).get();
        if (dyadMedsSnap.exists) {
          await db.doc(`users/${targetUid}/medications/current`).set(dyadMedsSnap.data()!);
        }
      } catch {
        // Non-blocking
      }

      // Migrate subcollections (vitals, assessments)
      for (const sub of ['vitals', 'zaritAssessments', 'functionScores']) {
        try {
          const subSnap = await db.collection(`users/${dyadDocId}/${sub}`).get();
          if (!subSnap.empty) {
            const batch = db.batch();
            subSnap.docs.forEach((d) => {
              batch.set(db.doc(`users/${targetUid}/${sub}/${d.id}`), d.data());
            });
            await batch.commit();
          }
        } catch {
          // Non-blocking
        }
      }
    }

    // Mint a custom Firebase token for client sign-in
    const customToken = await auth.createCustomToken(targetUid, {
      role: 'caregiver',
      kutumbh: true
    });

    logAuditEvent({
      timestamp: now,
      eventType: 'AUTH_SESSION_CREATED',
      actorUid: targetUid,
      actorRole: 'caregiver',
      ip,
      userAgent,
      status: 'SUCCESS',
      details: { method: 'code_login', inviteCode: cleanCode }
    });

    return NextResponse.json({
      ok: true,
      customToken,
      uid: targetUid,
      email: targetEmail,
      patientName,
      caregiverName,
      clinicianLabel
    });
  } catch (err) {
    console.error('Code login error:', err);
    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'AUTH_SESSION_REJECTED',
      ip,
      userAgent,
      status: 'FAILURE',
      details: { method: 'code_login', error: err instanceof Error ? err.message : String(err) }
    });

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Unable to verify invite code. Please try again.'
      },
      { status: 500 }
    );
  }
}
