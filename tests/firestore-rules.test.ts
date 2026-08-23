import { test, describe } from 'node:test';
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
    assert.ok(rulesContent.includes("request.resource.data.totalScore <= 88"));
  });

  test('should secure careCircles multi-caregiver access controls', () => {
    assert.ok(rulesContent.includes("match /careCircles/{circleId}"));
    assert.ok(rulesContent.includes("function isCircleMember(circleData)"));
    assert.ok(rulesContent.includes("request.auth.uid in circleData.memberUids"));
  });
});
