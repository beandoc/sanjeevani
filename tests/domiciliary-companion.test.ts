import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BED_SIDE_TASKS } from '../src/components/domiciliary/daily-bedside-routine';
import { EMERGENCY_ACTION_CARDS } from '../src/components/domiciliary/bedside-emergency-cards';
import { DISCHARGE_PHASES } from '../src/components/domiciliary/discharge-onboarding-pathway';

describe('Domiciliary Bedside Companion Protocols', () => {
  it('should have complete chronological tasks covering 24-hour cycle', () => {
    assert.ok(BED_SIDE_TASKS.length >= 6, 'Should have at least 6 core daily tasks');

    const hasOralDenture = BED_SIDE_TASKS.some((t) => t.id === 'morning_oral_denture');
    assert.strictEqual(hasOralDenture, true, 'Must include morning oral and denture care');

    const hasQ2H = BED_SIDE_TASKS.some((t) => t.isQ2H);
    assert.strictEqual(hasQ2H, true, 'Must include Q2H turning protocol');

    const hasDysphagia = BED_SIDE_TASKS.some((t) => t.id === 'lunch_dysphagia_feeding');
    assert.strictEqual(hasDysphagia, true, 'Must include dysphagia feeding protocol');
  });

  it('should enforce critical safety warnings in all flash guides', () => {
    BED_SIDE_TASKS.forEach((t) => {
      assert.ok(t.detailedClinicalGuide.criticalSafetyTip.length > 10, `${t.id} must have a critical clinical safety tip`);
      assert.ok(t.detailedClinicalGuide.steps.length >= 3, `${t.id} must have at least 3 clinical steps`);
    });
  });

  it('should contain actionable emergency JIT cards for choking, delirium, back strain, and bleeding', () => {
    const categories = EMERGENCY_ACTION_CARDS.map((c) => c.category);
    assert.ok(categories.includes('choking'), 'Must include choking emergency protocol');
    assert.ok(categories.includes('delirium'), 'Must include delirium/sundowning emergency protocol');
    assert.ok(categories.includes('back_strain'), 'Must include caregiver back spasm emergency protocol');
    assert.ok(categories.includes('skin_tear'), 'Must include skin tear/anticoagulation emergency protocol');

    EMERGENCY_ACTION_CARDS.forEach((c) => {
      assert.ok(c.steps.length >= 3, `${c.id} must have at least 3 emergency steps`);
      assert.ok(c.doNotDo.length >= 1, `${c.id} must explicitly state dangerous actions to avoid`);
    });
  });

  it('should structure 14-day discharge pathway into 4 progressive clinical phases', () => {
    assert.strictEqual(DISCHARGE_PHASES.length, 4, 'Must have 4 phases');
    assert.strictEqual(DISCHARGE_PHASES[0].phaseId, 1);
    assert.strictEqual(DISCHARGE_PHASES[3].phaseId, 4);

    const totalMilestones = DISCHARGE_PHASES.reduce((acc, p) => acc + p.milestones.length, 0);
    assert.ok(totalMilestones >= 10, 'Should have at least 10 actionable milestones across 14 days');
  });
});
