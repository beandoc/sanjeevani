import { test, describe } from 'vitest';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Firestore Security Rules Compliance Audit', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  test('should exist and define cloud.firestore service version 2', () => {
    assert.strictEqual(fs.existsSync(rulesPath), true);
    assert.ok(rulesContent.includes("rules_version = '2'"));
    assert.ok(rulesContent.includes("service cloud.firestore"));
  });

  test('should enforce strict user ownership checks', () => {
    assert.ok(rulesContent.includes("function isOwner(userId)"));
    assert.ok(rulesContent.includes("request.auth.uid == userId"));
    assert.ok(rulesContent.includes("match /users/{userId}"));
  });

  test('should secure vital logs subcollection', () => {
    assert.ok(rulesContent.includes("match /vitals/{vitalId}"));
    assert.ok(rulesContent.includes("allow read: if isOwner(userId)"));
    assert.ok(rulesContent.includes("request.resource.data.sleep in ['good', 'average', 'poor']"));
  });

  test('should secure moduleProgress subcollection with section-set list limits', () => {
    assert.ok(rulesContent.includes("match /moduleProgress/{moduleId}"));
    assert.ok(rulesContent.includes("request.resource.data.completedSections is list"));
    assert.ok(rulesContent.includes("request.resource.data.completedSections.size() <= 100"));
  });

  test('should secure zaritAssessments with tier validation and score boundaries', () => {
    assert.ok(rulesContent.includes("match /zaritAssessments/{assessmentId}"));
    assert.ok(rulesContent.includes("request.resource.data.tier in ['ZBI22', 'ZBI12', 'ZBI4']"));
    assert.ok(rulesContent.includes("request.resource.data.totalScore >= 0"));
    // The ceiling must be per-tier, not a flat 88 — a flat bound admits a
    // ZBI-4 document claiming a score of 88 (max is 16).
    assert.ok(rulesContent.includes("function zbiMaxScore(tier)"));
    assert.ok(
      rulesContent.includes('request.resource.data.totalScore <= zbiMaxScore(request.resource.data.tier)')
    );
    assert.ok(!rulesContent.includes('request.resource.data.totalScore <= 88'));
    assert.ok(rulesContent.includes('request.resource.data.normalizedPercentage <= 100'));
  });

  test('should secure patientProfile subcollection for owner and granted-clinician read/write', () => {
    assert.ok(rulesContent.includes("match /patientProfile/{profileId}"));
    // A granted clinician (e.g. via the onboarding wizard's doctor-mode patient
    // picker) may read AND write this, unlike zaritAssessments which is
    // caregiver-only for create — patientProfile mirrors functionScores in
    // being clinician-writable, since a doctor may record a fresh Katz
    // assessment during an OPD visit.
    assert.ok(rulesContent.includes('allow read: if isOwner(userId) || hasActiveGrant(userId);'));
    assert.ok(
      rulesContent.includes('allow create, update: if (isOwner(userId) || hasActiveGrant(userId))')
    );
    assert.ok(rulesContent.includes('request.resource.data.katzAdl is map'));
    assert.ok(rulesContent.includes('request.resource.data.lawtonIadl is map'));
    assert.ok(rulesContent.includes('request.resource.data.updatedAt is string'));
  });

  test('should open vitals read/write to a granted clinician, not just the owner', () => {
    assert.ok(rulesContent.includes('match /vitals/{vitalId}'));
    // Previously owner-only, which meant a clinician's dashboard could never
    // legitimately show a roster patient's vitals at all.
    const vitalsBlock = rulesContent.slice(
      rulesContent.indexOf('match /vitals/{vitalId}'),
      rulesContent.indexOf('match /medications/{docId}')
    );
    assert.ok(vitalsBlock.includes('allow read: if isOwner(userId) || hasActiveGrant(userId);'));
    assert.ok(vitalsBlock.includes('allow create: if (isOwner(userId) || hasActiveGrant(userId))'));
  });

  test('should secure daily bedside care logs for owner and granted clinical team access', () => {
    assert.ok(rulesContent.includes('match /dailyCareLogs/{logId}'));
    const logsBlock = rulesContent.slice(
      rulesContent.indexOf('match /dailyCareLogs/{logId}'),
      rulesContent.indexOf('match /medications/{docId}')
    );
    assert.ok(logsBlock.includes('allow read: if isOwner(userId) || hasActiveGrant(userId);'));
    assert.ok(logsBlock.includes('allow create, update: if (isOwner(userId) || hasActiveGrant(userId))'));
    assert.ok(logsBlock.includes("request.resource.data.shift in ['morning', 'day', 'evening', 'night', 'full_day']"));
    assert.ok(logsBlock.includes('request.resource.data.monitoringRows is list'));
    assert.ok(logsBlock.includes('request.resource.data.medications is list'));
  });

  test('should secure medications as a single synced document, clinician-writable', () => {
    assert.ok(rulesContent.includes('match /medications/{docId}'));
    const medsBlock = rulesContent.slice(rulesContent.indexOf('match /medications/{docId}'));
    assert.ok(medsBlock.includes('allow read: if isOwner(userId) || hasActiveGrant(userId);'));
    assert.ok(medsBlock.includes('request.resource.data.items is list'));
    assert.ok(medsBlock.includes('request.resource.data.updatedAt is string'));
  });

  test('should secure dyadInvites so only the issuing clinician creates, and only unclaimed invites are mutable', () => {
    assert.ok(rulesContent.includes('match /dyadInvites/{inviteCode}'));
    const block = rulesContent.slice(rulesContent.indexOf('match /dyadInvites/{inviteCode}'));
    assert.ok(block.includes('isProfessional(request.auth.uid)'));
    assert.ok(block.includes('request.resource.data.clinicianUid == request.auth.uid'));
    assert.ok(block.includes('resource.data.claimedAt == null'));
    // Core identity fields must never change on update, only claim status.
    assert.ok(block.includes('request.resource.data.patientName == resource.data.patientName'));
  });

  test('should secure careCircles multi-caregiver access controls', () => {
    assert.ok(rulesContent.includes("match /careCircles/{circleId}"));
    assert.ok(rulesContent.includes("function isCircleMember(circleData)"));
    assert.ok(rulesContent.includes("request.auth.uid in circleData.memberUids"));
  });

  test('should require an Admin-issued clinician claim and keep browser profile roles immutable', () => {
    // Read via the safe accessor: dot access on an absent claim key raises
    // "Property <key> is undefined on object" and denies the request rather
    // than evaluating to null, which silently locked out every legitimately
    // granted clinician. Covered functionally in rules.emulator.test.ts.
    assert.ok(rulesContent.includes("request.auth.token.get('clinician', false) == true"));
    assert.ok(!/request\.auth\.token\.(clinician|role|email|phone_number)\b/.test(rulesContent));
    assert.ok(rulesContent.includes("request.resource.data.role == 'caregiver'"));
    assert.ok(rulesContent.includes('request.resource.data.role == resource.data.role'));
  });

  test('should not allow a browser to self-assign a clinical role at profile creation', () => {
    // Self-service registration is caregiver-only; clinical roles arrive as
    // Admin SDK custom claims (see /api/admin/claims, scripts/set-claims.ts).
    assert.ok(!rulesContent.includes("request.resource.data.role in ['professional', 'doctor', 'nurse']"));
    assert.ok(rulesContent.includes("(isOwner(userId) && request.resource.data.role == 'caregiver')"));
  });

  test('should enforce Phase 2 rules hardening: no email regex, no demo bypass, scoped cohortSummaries', () => {
    // 1. Email pattern role inference functions must be absent
    assert.ok(!rulesContent.includes('function isDoctorEmail'));
    assert.ok(!rulesContent.includes('function isNurseEmail'));

    // 2. Demo bypass must be absent from hasActiveGrant
    assert.ok(!rulesContent.includes("userId.matches('^demo-.*')"));

    // 3. clinicianGrants read must not have isDyadPlaceholder bypass
    const grantsBlock = rulesContent.slice(
      rulesContent.indexOf('match /clinicianGrants/{clinicianUid}'),
      rulesContent.indexOf('match /{path=**}/clinicianGrants/{grantId}')
    );
    assert.ok(!grantsBlock.includes('|| isDyadPlaceholder(userId)'));

    // 4. cohortSummaries must be scoped to owning clinician and forbid client writes
    const cohortBlock = rulesContent.slice(rulesContent.indexOf('match /cohortSummaries/{dyadId}'));
    assert.ok(cohortBlock.includes('resource.data.clinicianUid == request.auth.uid'));
    assert.ok(cohortBlock.includes('allow write: if false;'));
  });
});

