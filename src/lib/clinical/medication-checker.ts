/**
 * Sanjeevani Geriatric Medication Safety & Beers Criteria Engine
 * Evaluates prescription items against the American Geriatrics Society (AGS) Beers Criteria 2023
 * and STOPP/START (Screening Tool of Older Persons' Prescriptions) consensus.
 */

export interface BeersWarning {
  severity: 'high-risk' | 'caution' | 'prescribing-cascade';
  drugClass: string;
  acbScore: number; // Anticholinergic Cognitive Burden (0-3)
  rationale: string;
  recommendation: string;
  alternatives: string;
}

export interface RegimenSafetyEvaluation {
  totalAcbScore: number;
  acbRiskLevel: 'low' | 'moderate' | 'high-risk';
  warnings: string[];
  stoppTriggers: string[];
  summary: string;
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
      alternatives: 'Saline nasal sprays, topical moisturizers, or non-sedating 2nd-gen antihistamines like Fexofenadine, Levocetirizine, or Loratadine under clinical supervision.'
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
      alternatives: 'Sleep hygiene protocols, CBT-I (Cognitive Behavioral Therapy for Insomnia), daytime light exposure routines.'
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
      alternatives: 'Non-pharmacological sleep routine restructuring.'
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
      alternatives: 'Topical NSAID gels (Diclofenac gel), Paracetamol (within 2-3g/day max), guided physiotherapy, hot/cold fermentation.'
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
      alternatives: 'SSRIs (e.g. Sertraline, Escitalopram) or SNRIs (e.g. Duloxetine) with lower anticholinergic profiles.'
    }
  },
  {
    keywords: ['glimepiride', 'glibenclamide', 'glyburide', 'daonil', 'amaryl'],
    acbScore: 0,
    warning: {
      severity: 'caution',
      drugClass: 'Long-Acting Sulfonylureas',
      acbScore: 0,
      rationale: 'Higher risk of severe, prolonged, life-threatening hypoglycemia in older adults due to reduced renal clearance and variable carbohydrate intake.',
      recommendation: 'Avoid Glibenclamide; use shorter-acting agents or DPP-4 inhibitors with lower hypoglycemia incidence.',
      alternatives: 'Gliclazide MR, DPP-4 inhibitors (Teneligliptin, Linagliptin), or adjusted Metformin.'
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
      alternatives: 'Dose titration, leg elevation, or combining/switching with ACE inhibitors/ARBs.'
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
    medications: Array<{ name: string; genericName?: string }>
  ): RegimenSafetyEvaluation {
    let totalAcbScore = 0;
    const warnings: string[] = [];
    const stoppTriggers: string[] = [];

    const namesLower = medications.map((m) => `${m.name} ${m.genericName || ''}`.toLowerCase());

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

    let acbRiskLevel: RegimenSafetyEvaluation['acbRiskLevel'] = 'low';
    if (totalAcbScore >= 3) acbRiskLevel = 'high-risk';
    else if (totalAcbScore >= 1) acbRiskLevel = 'moderate';

    const summary =
      warnings.length > 0
        ? `${warnings.length} safety alert(s) detected across current ${medications.length} medications.`
        : 'All active medications screened against 2023 Beers Criteria & STOPP guidelines without major interaction flags.';

    return {
      totalAcbScore,
      acbRiskLevel,
      warnings,
      stoppTriggers,
      summary
    };
  }
}
