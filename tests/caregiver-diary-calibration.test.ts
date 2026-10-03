import { describe, it, expect, beforeEach } from 'vitest';
import {
  HealthRepository,
  recordCaregiverDiaryEntry,
  getCaregiverDiaryEntries,
  getCaregiverDiaryCalibrationSummary,
  deleteCaregiverDiaryEntry,
  clearCaregiverDiaryEntries,
  getCurrentDiurnalPrompt,
  DURATION_BRACKET_MINUTES
} from '../src/lib/db/health-repository';
import { estimateCareDemand } from '../src/lib/clinical/care-demand-model';

describe('Caregiver 1-Tap Diary Feedback & Calibration Loop', () => {
  const patientUid = 'patient-calibration-test-123';

  beforeEach(() => {
    clearCaregiverDiaryEntries(patientUid);
    clearCaregiverDiaryEntries();
  });

  it('records 1-tap diary entries and correctly resolves duration bracket minutes', () => {
    const entry1 = recordCaregiverDiaryEntry({
      patientUid,
      timeBlock: 'morning_rush',
      taskCategory: 'bathing_hygiene',
      durationBracket: '15_to_30m',
      durationMinutes: DURATION_BRACKET_MINUTES['15_to_30m'],
      staffCount: 1,
      physicalStrain: 'mild'
    });

    expect(entry1.id).toBeDefined();
    expect(entry1.durationMinutes).toBe(22.5);
    expect(entry1.staffCount).toBe(1);

    const logs = getCaregiverDiaryEntries(patientUid);
    expect(logs.length).toBe(1);
    expect(logs[0].id).toBe(entry1.id);
  });

  it('computes accurate empirical calibration summary across multiple task categories', () => {
    // Log 3 morning sponge entries
    recordCaregiverDiaryEntry({
      patientUid,
      timeBlock: 'morning_rush',
      taskCategory: 'bathing_hygiene',
      durationBracket: '15_to_30m',
      durationMinutes: 25,
      staffCount: 1,
      physicalStrain: 'mild'
    });
    recordCaregiverDiaryEntry({
      patientUid,
      timeBlock: 'morning_rush',
      taskCategory: 'bathing_hygiene',
      durationBracket: '30_to_60m',
      durationMinutes: 35,
      staffCount: 1,
      physicalStrain: 'moderate'
    });
    recordCaregiverDiaryEntry({
      patientUid,
      timeBlock: 'morning_rush',
      taskCategory: 'bathing_hygiene',
      durationBracket: '30_to_60m',
      durationMinutes: 45,
      staffCount: 2,
      physicalStrain: 'heavy_strain'
    });

    // Log 2 transfer entries
    recordCaregiverDiaryEntry({
      patientUid,
      timeBlock: 'morning_rush',
      taskCategory: 'transfers_mobility',
      durationBracket: 'under_15m',
      durationMinutes: 10,
      staffCount: 2,
      physicalStrain: 'moderate'
    });
    recordCaregiverDiaryEntry({
      patientUid,
      timeBlock: 'morning_rush',
      taskCategory: 'transfers_mobility',
      durationBracket: '15_to_30m',
      durationMinutes: 20,
      staffCount: 2,
      physicalStrain: 'heavy_strain'
    });

    const summary = getCaregiverDiaryCalibrationSummary(patientUid);
    expect(summary.totalEntries).toBe(5);

    const bathMetric = summary.metricsByTask['bathing_hygiene__morning_rush'];
    expect(bathMetric).toBeDefined();
    expect(bathMetric.sampleCount).toBe(3);
    expect(bathMetric.meanMinutes).toBe(35); // (25 + 35 + 45)/3
    expect(bathMetric.minMinutes).toBe(25);
    expect(bathMetric.maxMinutes).toBe(45);
    expect(bathMetric.twoPersonFrequencyPercent).toBe(33); // 1 out of 3

    const transferMetric = summary.metricsByTask['transfers_mobility__morning_rush'];
    expect(transferMetric).toBeDefined();
    expect(transferMetric.sampleCount).toBe(2);
    expect(transferMetric.meanMinutes).toBe(15); // (10 + 20)/2
    expect(transferMetric.twoPersonFrequencyPercent).toBe(100);
  });

  it('incorporates empirical caregiver diary observations directly into care demand estimation', () => {
    // Create empirical diary summary with 3 observed sponge bath logs
    const diaryCalibration = {
      patientUid,
      totalEntries: 3,
      metricsByTask: {
        'bathing_hygiene__morning_rush': {
          taskCategory: 'bathing_hygiene' as const,
          timeBlock: 'morning_rush' as const,
          sampleCount: 3,
          meanMinutes: 40, // higher than consensus default 25m
          minMinutes: 30,
          maxMinutes: 50,
          twoPersonFrequencyPercent: 0,
          lastLoggedAt: new Date().toISOString()
        }
      },
      averageDailyHandsOnMinutes: 40,
      empiricalDirectCareHours: 0.7
    };

    const uncalibratedResult = estimateCareDemand({
      barthelResponses: {
        bi_bathing: 0, // dependent
        bi_grooming: 5,
        bi_dressing: 10,
        bi_feeding: 10,
        bi_toilet: 10,
        bi_transfer: 15,
        bi_mobility: 15,
        bi_stairs: 10,
        bi_bowels: 10,
        bi_bladder: 10
      }
    });

    const calibratedResult = estimateCareDemand({
      barthelResponses: {
        bi_bathing: 0, // dependent
        bi_grooming: 5,
        bi_dressing: 10,
        bi_feeding: 10,
        bi_toilet: 10,
        bi_transfer: 15,
        bi_mobility: 15,
        bi_stairs: 10,
        bi_bowels: 10,
        bi_bladder: 10
      },
      diaryCalibration
    });

    const bathDriverUncal = uncalibratedResult.drivers.find((d) => d.itemId === 'bi_bathing');
    const bathDriverCal = calibratedResult.drivers.find((d) => d.itemId === 'bi_bathing');

    expect(bathDriverUncal?.minutesPerEpisode).toBe(25); // consensus default
    expect(bathDriverUncal?.calibrated).toBe(false);

    expect(bathDriverCal?.minutesPerEpisode).toBe(40); // empirical measured diary mean
    expect(bathDriverCal?.calibrated).toBe(true);
    expect(bathDriverCal?.calibrationEpisodeCount).toBe(3);

    // Calibrated band notes the real-world observation in band basis
    const hasDiaryNote = calibratedResult.bandBasis.some((b) => b.includes('caregiver diary observation'));
    expect(hasDiaryNote).toBe(true);
  });

  it('supports deleting individual entries and resetting storage cleanly', () => {
    const entry = recordCaregiverDiaryEntry({
      patientUid,
      timeBlock: 'evening',
      taskCategory: 'medications',
      durationBracket: 'under_15m',
      durationMinutes: 10,
      staffCount: 1,
      physicalStrain: 'mild'
    });

    expect(getCaregiverDiaryEntries(patientUid).length).toBe(1);
    const deleted = deleteCaregiverDiaryEntry(entry.id, patientUid);
    expect(deleted).toBe(true);
    expect(getCaregiverDiaryEntries(patientUid).length).toBe(0);
  });

  it('provides sensible contextual diurnal prompts based on local time', () => {
    const prompt = getCurrentDiurnalPrompt();
    expect(prompt.timeBlock).toBeDefined();
    expect(prompt.suggestedTasks.length).toBeGreaterThan(0);
    expect(prompt.title).toBeDefined();
    expect(prompt.question).toBeDefined();
  });
});
