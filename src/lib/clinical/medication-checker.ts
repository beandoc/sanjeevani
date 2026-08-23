/**
 * Sanjeevani Geriatric Medication Safety & Beers Criteria Engine
 * Evaluates prescription items against the American Geriatrics Society (AGS) Beers Criteria 2023
 * and STOPP/START geriatric prescribing consensus.
 */

export interface BeersWarning {
  severity: 'high-risk' | 'caution' | 'prescribing-cascade';
  drugClass: string;
  rationale: string;
  recommendation: string;
  alternatives: string;
}

const BEERS_DATABASE: Array<{
  keywords: string[];
  warning: BeersWarning;
}> = [
  {
    keywords: ['chlorpheniramine', 'cetirizine', 'diphenhydramine', 'hydroxyzine', 'avil', 'benadryl', 'pheniramine'],
    warning: {
      severity: 'high-risk',
      drugClass: 'First-Generation Antihistamines (High Anticholinergic Burden)',
      rationale: 'Highly anticholinergic in older adults; clearance reduced with advanced age. Strongly associated with acute delirium, cognitive decline, urinary retention, severe dry mouth, and falls.',
      recommendation: 'Avoid use for sleep or routine itching in elderly individuals.',
      alternatives: 'Saline nasal sprays, topical moisturizers, or non-sedating 2nd-gen antihistamines like Fexofenadine under clinical supervision.'
    }
  },
  {
    keywords: ['alprazolam', 'clonazepam', 'diazepam', 'lorazepam', 'alprax', 'restyl', 'ativan', 'calmpose'],
    warning: {
      severity: 'high-risk',
      drugClass: 'Benzodiazepines & Sedatives',
      rationale: 'Older adults have increased sensitivity to benzodiazepines and slower metabolism. Significant risk of cognitive impairment, daytime sedation, delirium, ataxia, and hip fractures.',
      recommendation: 'Avoid as first-line treatment for insomnia or chronic agitation in seniors.',
      alternatives: 'Sleep hygiene protocols, CBT-I (Cognitive Behavioral Therapy for Insomnia), daytime light exposure routines.'
    }
  },
  {
    keywords: ['zolpidem', 'zopiclone', 'nitrest', 'zolfresh'],
    warning: {
      severity: 'high-risk',
      drugClass: 'Non-Benzodiazepine Sedative-Hypnotics (Z-drugs)',
      rationale: 'Similar adverse effect profile to benzodiazepines in older adults; elevates emergency delirium visits, motor vehicular accidents, and nocturnal fall injuries.',
      recommendation: 'Avoid long-term usage (>2 weeks) in older adults.',
      alternatives: 'Non-pharmacological sleep routine restructuring.'
    }
  },
  {
    keywords: ['diclofenac', 'ibuprofen', 'naproxen', 'aceclofenac', 'combiflam', 'voveran', 'zerodol', 'brufen', 'piroxicam'],
    warning: {
      severity: 'high-risk',
      drugClass: 'Non-Steroidal Anti-Inflammatory Drugs (Oral NSAIDs)',
      rationale: 'Marked elevation in risk of gastrointestinal bleeding, peptic ulcers, acute kidney injury (AKI), fluid retention, and worsening of pre-existing hypertension or heart failure in seniors.',
      recommendation: 'Avoid chronic scheduled oral NSAID use in elderly patients, especially those with CKD, HTN, or CHF.',
      alternatives: 'Topical NSAID gels (Diclofenac gel), Paracetamol (within 2-3g/day max), guided physiotherapy, hot/cold fermentation.'
    }
  },
  {
    keywords: ['amitriptyline', 'nortriptyline', 'doxepin', 'tryptomer'],
    warning: {
      severity: 'high-risk',
      drugClass: 'Tricyclic Antidepressants (TCAs)',
      rationale: 'Strong anticholinergic and alpha-adrenergic blocking properties; high risk of orthostatic hypotension, cardiac arrhythmias, urinary retention, and sedation in seniors.',
      recommendation: 'Avoid TCAs in older adults with fall risk, glaucoma, or cardiac conduction issues.',
      alternatives: 'SSRIs (e.g. Sertraline, Escitalopram) or SNRIs (e.g. Duloxetine) with lower anticholinergic profiles.'
    }
  },
  {
    keywords: ['glimepiride', 'glibenclamide', 'glyburide', 'daonil', 'amaryl'],
    warning: {
      severity: 'caution',
      drugClass: 'Long-Acting Sulfonylureas',
      rationale: 'Higher risk of severe, prolonged, life-threatening hypoglycemia in older adults due to reduced renal clearance and variable carbohydrate intake.',
      recommendation: 'Avoid Glibenclamide; use shorter-acting agents or DPP-4 inhibitors with lower hypoglycemia incidence.',
      alternatives: 'Gliclazide MR, DPP-4 inhibitors (Teneligliptin, Linagliptin), or adjusted Metformin.'
    }
  },
  {
    keywords: ['amlodipine', 'nifedipine', 'cilnidipine', 'stamlo', 'amlong'],
    warning: {
      severity: 'prescribing-cascade',
      drugClass: 'Dihydropyridine Calcium Channel Blockers (CCBs)',
      rationale: 'Classic prescribing cascade trigger: Dihydropyridine CCBs frequently induce bilateral dependent ankle swelling (edema) due to precapillary vasodilation, which is often misdiagnosed as heart failure or renal failure, leading to unnecessary diuretic prescription.',
      recommendation: 'If new ankle swelling occurs after starting/increasing CCB dose, consult physician before accepting a water pill (diuretic).',
      alternatives: 'Dose titration, leg elevation, or combining/switching with ACE inhibitors/ARBs.'
    }
  }
];

export class MedicationChecker {
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
}
