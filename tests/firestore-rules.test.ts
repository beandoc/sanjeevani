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

  test('should allow doctor, nurse, professional, and caregiver roles without blocking profile creation or updates', () => {
    assert.ok(
      rulesContent.includes("request.resource.data.role in ['caregiver', 'professional', 'doctor', 'nurse']")
    );
    assert.ok(
      rulesContent.includes("get(/databases/$(database)/documents/users/$(uid)).data.role in ['professional', 'doctor', 'nurse']")
    );
  });

  test('should confirm kutumbh.com demo credentials configuration for doctor, nurse, and caregiver', async () => {
    const { DEMO_CREDENTIALS, signInOrCreateDemoAccount } = await import('../src/lib/firebase/auth');
    assert.strictEqual(DEMO_CREDENTIALS.doctor.email, 'doctor@kutumbh.com');
    assert.strictEqual(DEMO_CREDENTIALS.doctor.password, 'test1234');
    assert.strictEqual(DEMO_CREDENTIALS.nurse.email, 'nurse@kutumbh.com');
    assert.strictEqual(DEMO_CREDENTIALS.nurse.password, 'test1234');
    assert.strictEqual(DEMO_CREDENTIALS.caregiver.email, 'caregiver@kutumbh.com');
    assert.strictEqual(DEMO_CREDENTIALS.caregiver.password, 'test1234');

    const doctorUser = await signInOrCreateDemoAccount('doctor');
    assert.ok(doctorUser);
    assert.strictEqual(doctorUser.email, 'doctor@kutumbh.com');

    const nurseUser = await signInOrCreateDemoAccount('nurse');
    assert.ok(nurseUser);
    assert.strictEqual(nurseUser.email, 'nurse@kutumbh.com');

    const caregiverUser = await signInOrCreateDemoAccount('caregiver');
    assert.ok(caregiverUser);
    assert.strictEqual(caregiverUser.email, 'caregiver@kutumbh.com');
  });
});
