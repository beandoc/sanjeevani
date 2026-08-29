/**
 * Sanjeevani Geriatric Medication Safety & Beers Criteria Engine
 * Screens prescription items against a selected high-yield subset of the
 * American Geriatrics Society (AGS) Beers Criteria 2023 and STOPP/START v3.
 * This is decision support only; it is not a complete pharmacist medication
 * review and does not evaluate indication, dose, duration, renal function, or
 * patient-specific goals of care.
 */

import { CLINICAL_PROVENANCE, ClinicalProvenance } from './provenance';

export interface BeersWarning {
  severity: 'high-risk' | 'caution' | 'prescribing-cascade';
  drugClass: string;
  acbScore: number; // Anticholinergic Cognitive Burden (0-3)
  rationale: string;
  recommendation: string;
  alternatives: string;
  provenance: ClinicalProvenance;
}

export interface RegimenSafetyEvaluation {
  totalAcbScore: number;
  acbRiskLevel: 'low' | 'moderate' | 'high-risk';
  warnings: string[];
  reviewGaps: string[];
  stoppTriggers: string[];
  summary: string;
  provenance: ClinicalProvenance;
}

export interface MedicationReviewInput {
  name: string;
  genericName?: string;
  dosage?: string;
  frequency?: string;
  indication?: string;
  startDate?: string;
  duration?: string;
  renalFunctionEgfr?: string;
  riskHistory?: string[];
}

interface BeersDatabaseEntry {
  keywords: string[];
  acbScore: number;
  warning: BeersWarning;
}

const BEERS_DATABASE: BeersDatabaseEntry[] = [
  {
    // Cetirizine REMOVED (2nd generation, non-sedating, not in Beers avoid list)
    keywords: ['chlorpheniramine', 'diphenhydramine', 'hydroxyzine', 'avil', 'benadryl', 'pheniramine', 'promethazine', 'cyproheptadine'],
    acbScore: 3,
    warning: {
      severity: 'high-risk',
      drugClass: 'First-Generation Antihistamines (Strong Anticholinergic)',
      acbScore: 3,
      rationale: 'Highly anticholinergic in older adults; clearance reduced with advanced age. Strongly associated with acute delirium, cognitive decline, urinary retention, severe dry mouth, and falls.',
      recommendation: 'Avoid use for sleep or routine allergy/itching in elderly individuals.',
      alternatives: 'Saline nasal sprays, topical moisturizers, or non-sedating 2nd-gen antihistamines like Fexofenadine, Levocetirizine, or Loratadine under clinical supervision.',
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    }
  },
  {
    keywords: ['alprazolam', 'clonazepam', 'diazepam', 'lorazepam', 'alprax', 'restyl', 'ativan', 'calmpose', 'etizolam'],
    acbScore: 0,
    warning: {
      severity: 'high-risk',
      drugClass: 'Benzodiazepines & Sedatives',
      acbScore: 0,
      rationale: 'Older adults have increased sensitivity to benzodiazepines and slower hepatic clearance. Significant risk of cognitive impairment, daytime sedation, delirium, ataxia, and hip fractures.',
      recommendation: 'Avoid as first-line treatment for insomnia or chronic agitation in seniors.',
      alternatives: 'Sleep hygiene protocols, CBT-I (Cognitive Behavioral Therapy for Insomnia), daytime light exposure routines.',
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    }
  },
  {
    keywords: ['zolpidem', 'zopiclone', 'nitrest', 'zolfresh'],
    acbScore: 0,
    warning: {
      severity: 'high-risk',
      drugClass: 'Non-Benzodiazepine Sedative-Hypnotics (Z-drugs)',
      acbScore: 0,
      rationale: 'Similar adverse effect profile to benzodiazepines in older adults; elevates emergency delirium visits, motor vehicular accidents, and nocturnal fall injuries.',
      recommendation: 'Avoid long-term usage (>2 weeks) in older adults.',
      alternatives: 'Non-pharmacological sleep routine restructuring.',
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    }
  },
  {
    keywords: ['diclofenac', 'ibuprofen', 'naproxen', 'aceclofenac', 'combiflam', 'voveran', 'zerodol', 'brufen', 'piroxicam', 'ketorolac', 'mefenamic'],
    acbScore: 0,
    warning: {
      severity: 'high-risk',
      drugClass: 'Non-Steroidal Anti-Inflammatory Drugs (Oral NSAIDs)',
      acbScore: 0,
      rationale: 'Marked elevation in risk of gastrointestinal bleeding, peptic ulcers, acute kidney injury (AKI), fluid retention, and worsening of pre-existing hypertension or heart failure in seniors.',
      recommendation: 'Avoid chronic scheduled oral NSAID use in elderly patients, especially those with CKD, HTN, or CHF.',
      alternatives: 'Topical NSAID gels (Diclofenac gel), Paracetamol (within 2-3g/day max), guided physiotherapy, hot/cold fermentation.',
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    }
  },
  {
    keywords: ['amitriptyline', 'nortriptyline', 'doxepin', 'tryptomer', 'imipramine'],
    acbScore: 3,
    warning: {
      severity: 'high-risk',
      drugClass: 'Tricyclic Antidepressants (TCAs)',
      acbScore: 3,
      rationale: 'Strong anticholinergic and alpha-adrenergic blocking properties; high risk of orthostatic hypotension, cardiac conduction delay, urinary retention, and sedation in seniors.',
      recommendation: 'Avoid TCAs in older adults with fall risk, glaucoma, or cardiac conduction issues.',
      alternatives: 'SSRIs (e.g. Sertraline, Escitalopram) or SNRIs (e.g. Duloxetine) with lower anticholinergic profiles.',
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    }
  },
  {
    keywords: ['glimepiride', 'glibenclamide', 'glyburide', 'daonil', 'amaryl', 'glipizide', 'gliclazide', 'chlorpropamide'],
    acbScore: 0,
    warning: {
      severity: 'caution',
      drugClass: 'Sulfonylureas',
      acbScore: 0,
      rationale: 'Sulfonylureas increase hypoglycemia risk in older adults; longer-acting agents have higher risk of prolonged hypoglycemia.',
      recommendation: 'Avoid as first- or second-line therapy when safer options are feasible; if used, prefer shorter-acting choices with explicit renal and meal-pattern review.',
      alternatives: 'Individualized diabetes regimen review; options may include adjusted Metformin, DPP-4 inhibitors, SGLT2 inhibitors, or insulin simplification depending on renal function, frailty, and affordability.',
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    }
  },
  {
    keywords: ['amlodipine', 'nifedipine', 'cilnidipine', 'stamlo', 'amlong'],
    acbScore: 0,
    warning: {
      severity: 'prescribing-cascade',
      drugClass: 'Dihydropyridine Calcium Channel Blockers (CCBs)',
      acbScore: 0,
      rationale: 'Classic prescribing cascade trigger: Dihydropyridine CCBs frequently induce bilateral dependent ankle swelling (edema) due to precapillary vasodilation, which is often misdiagnosed as heart failure or renal failure, leading to unnecessary diuretic prescription.',
      recommendation: 'If new ankle swelling occurs after starting/increasing CCB dose, consult physician before accepting a water pill (diuretic).',
      alternatives: 'Dose titration, leg elevation, or combining/switching with ACE inhibitors/ARBs.',
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    }
  },
  {
    keywords: ['haloperidol', 'risperidone', 'olanzapine', 'quetiapine', 'aripiprazole', 'chlorpromazine'],
    acbScore: 0,
    warning: {
      severity: 'high-risk',
      drugClass: 'Antipsychotics in Dementia / Delirium',
      acbScore: 0,
      rationale: 'Antipsychotics can increase stroke, mortality, sedation, falls, and extrapyramidal effects in older adults, especially in dementia.',
      recommendation: 'Avoid routine use for behavioral symptoms unless non-drug approaches fail and the patient poses substantial risk of harm; use the lowest effective dose for the shortest duration with deprescribing review.',
      alternatives: 'Identify triggers such as pain, infection, constipation, urinary retention, dehydration, medication toxicity, sensory deprivation, or environmental distress.',
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    }
  },
  {
    keywords: ['omeprazole', 'pantoprazole', 'esomeprazole', 'rabeprazole', 'lansoprazole'],
    acbScore: 0,
    warning: {
      severity: 'caution',
      drugClass: 'Proton Pump Inhibitors (Long-Term Use)',
      acbScore: 0,
      rationale: 'Long-term scheduled PPI use without a clear indication is associated with infection, fracture, hypomagnesemia, and kidney-related concerns in older adults.',
      recommendation: 'Confirm ongoing indication and duration; consider step-down or deprescribing when clinically appropriate.',
      alternatives: 'Lifestyle measures, time-limited acid suppression, H2 blocker review, or gastroprotection only when indicated.',
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    }
  },
  {
    keywords: ['tramadol', 'morphine', 'oxycodone', 'fentanyl', 'tapentadol', 'codeine'],
    acbScore: 0,
    warning: {
      severity: 'caution',
      drugClass: 'Opioid Analgesics',
      acbScore: 0,
      rationale: 'Opioids increase constipation, sedation, delirium, respiratory depression, and fall risk in older adults; risk is higher with benzodiazepines or other CNS depressants.',
      recommendation: 'Verify indication, dose, bowel regimen, sedation monitoring, and concurrent sedative exposure.',
      alternatives: 'Non-pharmacological pain strategies, topical agents, acetaminophen within safe dose limits, or specialist pain review.',
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    }
  }
];

export class MedicationChecker {
  /**
   * Single-drug Beers Criteria and pharmacological safety check
   */
  static checkBeersCriteria(medicationName: string): BeersWarning | null {
    if (!medicationName) return null;
    const cleanName = medicationName.toLowerCase().trim();

    for (const item of BEERS_DATABASE) {
      for (const keyword of item.keywords) {
        if (cleanName.includes(keyword)) {
          return item.warning;
        }
      }
    }

    return null;
  }

  /**
   * Multi-drug Regimen Evaluation:
   * Computes cumulative Anticholinergic Cognitive Burden (ACB) and screens for STOPP/START interactions.
   */
  static evaluateRegimen(
    medications: MedicationReviewInput[]
  ): RegimenSafetyEvaluation {
    let totalAcbScore = 0;
    const warnings: string[] = [];
    const reviewGaps: string[] = [];
    const stoppTriggers: string[] = [];

    const namesLower = medications.map((m) => `${m.name} ${m.genericName || ''}`.toLowerCase());

    const missingIndication = medications.filter((m) => !m.indication?.trim()).length;
    const missingDose = medications.filter((m) => !m.dosage?.trim()).length;
    const missingDuration = medications.filter((m) => !m.startDate?.trim() && !m.duration?.trim()).length;
    const missingRenalContext = medications.filter((m) => !m.renalFunctionEgfr?.trim()).length;

    if (missingIndication > 0) {
      reviewGaps.push(`${missingIndication} medicine(s) lack a documented indication.`);
    }
    if (missingDose > 0) {
      reviewGaps.push(`${missingDose} medicine(s) lack a documented dose.`);
    }
    if (missingDuration > 0) {
      reviewGaps.push(`${missingDuration} medicine(s) lack start date or intended duration.`);
    }
    if (missingRenalContext > 0) {
      reviewGaps.push('Renal function/eGFR is not documented for every medicine; dose-safety review is incomplete.');
    }

    // 1. Calculate Cumulative ACB (Anticholinergic Cognitive Burden)
    for (const name of namesLower) {
      for (const entry of BEERS_DATABASE) {
        if (entry.acbScore > 0 && entry.keywords.some((k) => name.includes(k))) {
          totalAcbScore += entry.acbScore;
        }
      }
    }

    if (totalAcbScore >= 3) {
      warnings.push(
        `High Cumulative Anticholinergic Burden (ACB Score: ${totalAcbScore}/3+): Regimen significantly increases the risk of acute delirium, memory impairment, and syncopal falls.`
      );
      stoppTriggers.push('STOPP: Reduce cumulative anticholinergic burden (ACB ≥ 3).');
    } else if (totalAcbScore >= 1) {
      warnings.push(
        `Moderate Anticholinergic Burden (ACB Score: ${totalAcbScore}): Monitor for dry mouth, blurred vision, constipation, and mild cognitive slowing.`
      );
    }

    // 2. STOPP Screening: "Triple Whammy" (NSAID + ACEi/ARB + Diuretic)
    const hasNsaid = namesLower.some((n) =>
      ['diclofenac', 'ibuprofen', 'naproxen', 'aceclofenac', 'combiflam', 'voveran', 'zerodol', 'brufen'].some((k) => n.includes(k))
    );
    const hasAceOrArb = namesLower.some((n) =>
      ['telmisartan', 'losartan', 'olmesartan', 'ramipril', 'enalapril', 'valsartan'].some((k) => n.includes(k))
    );
    const hasDiuretic = namesLower.some((n) =>
      ['furosemide', 'lasix', 'torsemide', 'hydrochlorothiazide', 'chlorthalidone', 'dytor', 'aldactone', 'spironolactone'].some((k) => n.includes(k))
    );

    if (hasNsaid && hasAceOrArb && hasDiuretic) {
      warnings.push(
        'CRITICAL STOPP ALERT — "Triple Whammy Interaction": Concomitant NSAID + ACEi/ARB + Diuretic dramatically elevates acute renal failure and severe hyperkalemia risk.'
      );
      stoppTriggers.push('STOPP: Discontinue oral NSAID in patients receiving ACEi/ARB and Diuretics.');
    }

    // 3. STOPP Screening: Dual Sedation / Benzodiazepine + Z-drug
    const hasBenzo = namesLower.some((n) =>
      ['alprazolam', 'clonazepam', 'diazepam', 'lorazepam', 'alprax', 'restyl', 'ativan'].some((k) => n.includes(k))
    );
    const hasZDrug = namesLower.some((n) =>
      ['zolpidem', 'zopiclone', 'nitrest', 'zolfresh'].some((k) => n.includes(k))
    );

    if (hasBenzo && hasZDrug) {
      warnings.push(
        'STOPP ALERT — Dual Sedative Prescribing: Combining Benzodiazepines with Z-drugs creates additive CNS depression and severe fall risk.'
      );
      stoppTriggers.push('STOPP: Duplicate sedative-hypnotic prescribing.');
    }

    // 4. Prescribing Cascade Check (CCB + Diuretic without heart failure)
    const hasCcb = namesLower.some((n) =>
      ['amlodipine', 'nifedipine', 'cilnidipine', 'stamlo'].some((k) => n.includes(k))
    );
    if (hasCcb && hasDiuretic) {
      warnings.push(
        'Prescribing Cascade Alert: Amlodipine/CCB combined with loop diuretic. Verify if diuretic was initiated to treat CCB-induced ankle vasodilation.'
      );
    }

    const hasOpioid = namesLower.some((n) =>
      ['tramadol', 'morphine', 'oxycodone', 'fentanyl', 'tapentadol', 'codeine'].some((k) => n.includes(k))
    );
    if (hasOpioid && hasBenzo) {
      warnings.push(
        'HIGH-RISK BEERS INTERACTION: Opioid plus benzodiazepine creates additive sedation, respiratory depression, delirium, and fall risk.'
      );
      stoppTriggers.push('Beers: Avoid concurrent opioid and benzodiazepine use whenever possible.');
    }

    const hasMultipleCnsDepressants = namesLower.filter((n) =>
      ['alprazolam', 'clonazepam', 'diazepam', 'lorazepam', 'zolpidem', 'zopiclone', 'tramadol', 'morphine', 'oxycodone', 'quetiapine', 'olanzapine', 'gabapentin', 'pregabalin'].some((k) => n.includes(k))
    ).length >= 3;
    if (hasMultipleCnsDepressants) {
      warnings.push(
        'HIGH-RISK CNS POLYPHARMACY: Three or more CNS-active medicines substantially increase falls, delirium, and sedation risk in older adults.'
      );
      stoppTriggers.push('Beers: Avoid concurrent use of three or more CNS-active drugs when feasible.');
    }

    let acbRiskLevel: RegimenSafetyEvaluation['acbRiskLevel'] = 'low';
    if (totalAcbScore >= 3) acbRiskLevel = 'high-risk';
    else if (totalAcbScore >= 1) acbRiskLevel = 'moderate';

    const summary =
      warnings.length > 0
        ? `${warnings.length} high-yield safety alert(s) detected across current ${medications.length} medications. Confirm indication, dose, renal function, duration, and goals of care with the prescriber before making changes.`
        : medications.length > 0
          ? 'No high-yield Beers/STOPP alerts detected in this limited screen. This does not prove the regimen is safe; clinician/pharmacist medication reconciliation is still needed.'
          : 'No medicines entered. Medication-risk screening cannot run until the current regimen is documented.';

    return {
      totalAcbScore,
      acbRiskLevel,
      warnings,
      reviewGaps,
      stoppTriggers,
      summary,
      provenance: CLINICAL_PROVENANCE.beersStoppScreen
    };
  }
}
