import { describe, it, expect } from 'vitest';
import { patientEducationGuides, SupportedLanguage } from '@/lib/clinical/patient-education-data';
import { literatureReviewData } from '@/lib/clinical/literature-review-data';

describe('Multilingual Patient Education and Literature Review Dataset', () => {
  const languages: SupportedLanguage[] = ['en', 'hi', 'mr'];

  it('should load all 8 patient education guides with complete sections across English, Hindi, and Marathi', () => {
    expect(patientEducationGuides.length).toBeGreaterThanOrEqual(8);

    patientEducationGuides.forEach((guide) => {
      expect(guide.id).toBeTruthy();
      expect(guide.category).toBeTruthy();
      expect(guide.readingTimeMinutes).toBeGreaterThan(0);

      languages.forEach((lang) => {
        const langData = guide[lang];
        expect(langData, `Missing language data for ${lang} in guide ${guide.id}`).toBeDefined();
        expect(langData.title, `Missing title in ${lang} for ${guide.id}`).toBeTruthy();
        expect(langData.subtitle, `Missing subtitle in ${lang} for ${guide.id}`).toBeTruthy();
        expect(langData.overview, `Missing overview in ${lang} for ${guide.id}`).toBeTruthy();
        expect(langData.whyItMatters, `Missing whyItMatters in ${lang} for ${guide.id}`).toBeTruthy();
        expect(langData.actionableSteps.length, `Missing actionable steps in ${lang} for ${guide.id}`).toBeGreaterThan(0);
        expect(langData.dietaryAndLifestyle.recommendations.length, `Missing dietary recommendations in ${lang} for ${guide.id}`).toBeGreaterThan(0);
        expect(langData.dietaryAndLifestyle.whatToAvoid.length, `Missing dietary whatToAvoid in ${lang} for ${guide.id}`).toBeGreaterThan(0);
        expect(langData.medicationPearls.length, `Missing medicationPearls in ${lang} for ${guide.id}`).toBeGreaterThan(0);
        expect(langData.redFlagEmergencySigns.length, `Missing redFlagEmergencySigns in ${lang} for ${guide.id}`).toBeGreaterThan(0);
        expect(langData.dailyChecklist.length, `Missing dailyChecklist in ${lang} for ${guide.id}`).toBeGreaterThan(0);
        expect(langData.evidenceSource, `Missing evidenceSource in ${lang} for ${guide.id}`).toBeTruthy();
      });
    });
  });

  it('should load all literature review entries with valid evidence levels and citations', () => {
    expect(literatureReviewData.length).toBeGreaterThanOrEqual(6);

    literatureReviewData.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.guideline).toBeTruthy();
      expect(item.organization).toBeTruthy();
      expect(item.evidenceLevel).toMatch(/^Level (A|B|C)/);
      expect(item.keyFindings.length).toBeGreaterThan(0);
      expect(item.caregiverImplications.length).toBeGreaterThan(0);
      expect(item.clinicalRecommendations.length).toBeGreaterThan(0);
      expect(item.referenceUrl).toMatch(/^https?:\/\//);
      expect(item.doiOrCitation).toBeTruthy();
    });
  });
});
