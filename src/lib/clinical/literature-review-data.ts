export interface LiteratureReviewItem {
  id: string;
  guideline: string;
  organization: string;
  year: string;
  evidenceLevel: 'Level A (High Quality RCTs / Meta-analyses)' | 'Level B (Well-designed Cohort / Clinical Trials)' | 'Level C (Expert Consensus / Clinical Guidelines)';
  category: 'Intrinsic Capacity' | 'Pharmacology & Safety' | 'Mobility & Falls' | 'Cognitive & Mental Health' | 'Chronic Disease' | 'Wound & Bedside Care';
  keyFindings: string[];
  caregiverImplications: string[];
  clinicalRecommendations: string[];
  referenceUrl: string;
  doiOrCitation: string;
}

export const literatureReviewData: LiteratureReviewItem[] = [
  {
    id: 'who-icope-2023',
    guideline: 'WHO Integrated Care for Older People (ICOPE) Guidelines',
    organization: 'World Health Organization (WHO)',
    year: '2023 / 2019',
    evidenceLevel: 'Level A (High Quality RCTs / Meta-analyses)',
    category: 'Intrinsic Capacity',
    keyFindings: [
      'Declines in intrinsic capacity (cognition, locomotion, vitality/nutrition, vision, hearing, and psychological capacity) are the strongest predictors of loss of independence in older age.',
      'Community-level screening and early multi-domain lifestyle interventions significantly delay disability and reduce hospitalization rates by 22-30% in community-dwelling seniors.',
      'Person-centered, personalized goal setting outperforms disease-isolated siloed treatments for multimorbid elders.'
    ],
    caregiverImplications: [
      'Focus on what the older adult CAN do rather than just limitations (preserving autonomy in dressing, bathing, and eating).',
      'Regular 6-month checks of vision, hearing, and balance prevent secondary cognitive decline and isolation.',
      'Caregiver emotional well-being is recognized as a vital component of the patient care ecosystem.'
    ],
    clinicalRecommendations: [
      'Conduct screening across all 6 intrinsic capacity domains at every primary care contact.',
      'Prioritize strength and balance training alongside protein-energy nutritional supplementation for individuals at risk of vitality loss.',
      'Establish community referral pathways linking primary health centers with family caregivers.'
    ],
    referenceUrl: 'https://www.who.int/publications/i/item/9789241550109',
    doiOrCitation: 'WHO Guidelines on Community-Level Interventions to Manage Declines in Intrinsic Capacity, Geneva: WHO (2019, updated 2023).'
  },
  {
    id: 'ags-beers-2023',
    guideline: 'AGS Beers Criteria® for Potentially Inappropriate Medication Use in Older Adults',
    organization: 'American Geriatrics Society (AGS)',
    year: '2023 Update',
    evidenceLevel: 'Level A (High Quality RCTs / Meta-analyses)',
    category: 'Pharmacology & Safety',
    keyFindings: [
      'Over 20% of acute geriatric hospital admissions are attributable to preventable Adverse Drug Events (ADEs) and drug-drug interactions.',
      'First-generation antihistamines, long-acting benzodiazepines, high-dose NSAIDs, and long-acting sulfonylureas (e.g., glibenclamide) confer severe risks of cognitive worsening, falls, GI hemorrhage, and prolonged hypoglycemia.',
      'Prescribing cascades frequently occur when drug side effects (e.g., peripheral edema from CCBs) are misdiagnosed as new conditions and treated with additional medications (e.g., loop diuretics).'
    ],
    caregiverImplications: [
      'Never give over-the-counter sleep aids, cough syrups with promethazine/diphenhydramine, or routine pain balms/NSAIDs without doctor approval.',
      'Always bring a complete "brown bag" of all tablets, syrups, and supplements to every clinical appointment.',
      'If an elder suddenly experiences new confusion, dizziness, or weakness, immediately review recent medication changes with their doctor.'
    ],
    clinicalRecommendations: [
      'Perform medication reconciliation and Beers Criteria screening at every clinical transition or acute deterioration.',
      'Gradually taper and deprescribe high-risk sedatives, anticholinergics, and unnecessary proton pump inhibitors (PPIs).',
      'Adjust dosage regimens based on estimated glomerular filtration rate (eGFR) and frailty score.'
    ],
    referenceUrl: 'https://geriatricscareonline.org/toc/american-geriatrics-society-updated-beers-criteria-for-potentially-inappropriate-medication-use-in-older-adults/CL001',
    doiOrCitation: '2023 American Geriatrics Society Beers Criteria® Update Expert Panel. J Am Geriatr Soc. 2023;71(7):2052-2081.'
  },
  {
    id: 'cdc-steadi-world-falls',
    guideline: 'World Guidelines for Falls Prevention & CDC STEADI Protocol',
    organization: 'World Falls Guidelines Taskforce / CDC',
    year: '2022',
    evidenceLevel: 'Level A (High Quality RCTs / Meta-analyses)',
    category: 'Mobility & Falls',
    keyFindings: [
      'One in three adults aged 65+ falls each year, with 20-30% suffering moderate to severe injuries (hip fractures, subdural hematomas).',
      'Multifactorial fall risk assessment combined with targeted environmental home modifications and progressive balance training reduces fall rates by 34%.',
      'Orthostatic hypotension (systolic drop >= 20 mmHg or diastolic drop >= 10 mmHg within 3 min of standing) is an underdiagnosed leading trigger for syncope and falls.'
    ],
    caregiverImplications: [
      'Install bathroom grab bars and bright night lighting; eliminate loose throw rugs, wet floor tiles, and trailing electrical cords.',
      'Encourage the 30-second sit-to-stand pause: have the elder sit on the bed edge for 30-60 seconds before standing up.',
      'Encourage appropriate supportive footwear with non-skid rubber soles both indoors and outdoors.'
    ],
    clinicalRecommendations: [
      'Administer the 3-question screening (Fallen in past year? Feel unsteady? Worry about falling?) and functional mobility tests (Timed Up & Go, 30s Chair Stand).',
      'Review and reduce psychotropic, antihypertensive, and sedative medications associated with fall risk.',
      'Recommend tailored multicomponent physical exercise focusing on balance, gait, and progressive resistance training (e.g., Otago Exercise Programme).'
    ],
    referenceUrl: 'https://www.cdc.gov/steadi/index.html',
    doiOrCitation: 'Montero-Odasso M, et al. World guidelines for falls prevention and management for older adults: a global initiative. Age Ageing. 2022;51(9):afac205.'
  },
  {
    id: 'nice-dementia-ng97-ardsi',
    guideline: 'NICE NG97 Guidelines & ARDSI National Dementia Report',
    organization: 'National Institute for Health and Care Excellence (NICE) / ARDSI India',
    year: '2024 / 2021',
    evidenceLevel: 'Level A (High Quality RCTs / Meta-analyses)',
    category: 'Cognitive & Mental Health',
    keyFindings: [
      'Dementia affects over 8.8 million seniors in India; the vast majority are cared for at home by family caregivers with high physical and emotional strain.',
      'Non-pharmacological strategies (validation therapy, structured routines, sensory stimulation, music) are first-line for managing Behavioral and Psychological Symptoms of Dementia (BPSD).',
      'Antipsychotic medications in dementia increase stroke and mortality risks and should only be used as a short-term last resort when there is acute risk of severe harm.'
    ],
    caregiverImplications: [
      'Never argue or try to logically convince an agitated dementia patient. Use Validation ("I understand you are looking for your mother, tell me about her") and gentle redirection.',
      'Manage Sundowning (late afternoon agitation) by keeping rooms well-lit, reducing noise, and avoiding caffeine or heavy stimulation after 4 PM.',
      'Maintain predictable daily routines for meals, wake times, and bedtime to reduce cognitive confusion.'
    ],
    clinicalRecommendations: [
      'Investigate treatable physical triggers for acute behavioral changes (UTI, fecal impaction, occult pain, dehydration).',
      'Conduct caregiver burden assessment (Zarit Burden Interview) and offer structured respite resources.',
      'Tailor advance care planning and decision-making early in the disease trajectory with family dyads.'
    ],
    referenceUrl: 'https://www.nice.org.uk/guidance/ng97',
    doiOrCitation: 'NICE Guideline NG97: Dementia: assessment, management and support for people living with dementia and their carers (2018, updated 2024).'
  },
  {
    id: 'epuap-npiap-pressure-injuries',
    guideline: 'Prevention and Treatment of Pressure Ulcers/Injuries: Clinical Practice Guideline',
    organization: 'EPUAP / NPIAP / Pan Pacific Pressure Injury Alliance (PPPIA)',
    year: '2019 (Updated 2023 Standards)',
    evidenceLevel: 'Level A (High Quality RCTs / Meta-analyses)',
    category: 'Wound & Bedside Care',
    keyFindings: [
      'Pressure injuries develop within 2 hours of unrelieved pressure over bony prominences (sacrum, greater trochanter, heels, occiput).',
      'Regular Q2H (2-hourly) 30-degree lateral tilt repositioning prevents tissue ischemia and capillary collapse.',
      'Moisture-Associated Skin Damage (MASD) from incontinence compromises the epidermal barrier, accelerating pressure injury development by 4-fold.'
    ],
    caregiverImplications: [
      'Turn and tilt bed-bound patients every 2 hours using the 30-degree tilt method with supportive pillows under the back and between the knees.',
      'Never massage red or irritated skin over bony spots—massaging fragile tissue worsens deep microvascular damage.',
      'Cleanse skin promptly after incontinence using pH-neutral soap, pat dry gently without rubbing, and apply zinc oxide barrier creams.'
    ],
    clinicalRecommendations: [
      'Perform daily comprehensive skin inspection of high-risk pressure points (sacrum, ischial tuberosities, heels, elbows).',
      'Utilize pressure-redistributing dynamic air mattresses or high-specification foam mattresses for bedfast/chairfast patients.',
      'Optimize dietary protein intake (1.25 to 1.5 g/kg body weight/day) and hydration to accelerate wound healing and prevent skin breakdown.'
    ],
    referenceUrl: 'https://npiap.com/page/FreeGuideline',
    doiOrCitation: 'European Pressure Ulcer Advisory Panel, National Pressure Injury Advisory Panel and Pan Pacific Pressure Injury Alliance. Prevention and Treatment of Pressure Ulcers/Injuries: Clinical Practice Guideline. 2019.'
  },
  {
    id: 'icmr-geriatric-guidelines',
    guideline: 'ICMR Multicentric Consensus Guidelines for Comprehensive Geriatric Care',
    organization: 'Indian Council of Medical Research (ICMR) & MoHFW',
    year: '2023',
    evidenceLevel: 'Level B (Well-designed Cohort / Clinical Trials)',
    category: 'Chronic Disease',
    keyFindings: [
      'Multimorbidity (hypertension, type 2 diabetes, osteoarthritis, chronic kidney disease) affects >65% of Indian seniors over 60 years.',
      'Strict glycemic control (HbA1c < 6.5%) in frail or elderly individuals leads to catastrophic hypoglycemia, cardiac arrhythmias, and fall-related fractures without mortality benefit.',
      'Individualized HbA1c targets (7.5% - 8.0% for moderate frailty, up to 8.5% for advanced frailty) provide optimal safety and quality of life.'
    ],
    caregiverImplications: [
      'Recognize subtle signs of low blood sugar in seniors: sudden drowsiness, confusion, irritability, clammy sweating, or slurred speech.',
      'Master the "Rule of 15": Give 15g of fast-acting glucose (3 teaspoons of sugar in water or 1/2 cup fruit juice), wait 15 minutes, and re-test blood sugar.',
      'Modify diet to include easily digestible, protein-dense Indian foods: moong dal khichdi with ghee, sattu, soft paneer, egg whites, and curd.'
    ],
    clinicalRecommendations: [
      'Tailor blood pressure targets cautiously: systolic 130-139 mmHg for fit elders, avoid diastolic < 65-70 mmHg to preserve coronary and cerebral perfusion.',
      'Conduct regular screening for chronic kidney disease (eGFR, serum creatinine) and adjust all oral hypoglycemics accordingly.',
      'Promote vaccination against Influenza, Pneumococcal disease, and Herpes Zoster for all older adults with chronic conditions.'
    ],
    referenceUrl: 'https://main.icmr.nic.in',
    doiOrCitation: 'Indian Council of Medical Research (ICMR). Consensus Guidelines on Management of Common Geriatric Conditions in Primary and Secondary Care. New Delhi: ICMR; 2023.'
  },
  {
    id: 'delirium-bgs-nice-guidelines',
    guideline: 'Delirium in Older Adults: Diagnosis, Prevention and Management (NICE CG103 & BGS)',
    organization: 'British Geriatrics Society (BGS) / NICE',
    year: '2023',
    evidenceLevel: 'Level A (High Quality RCTs / Meta-analyses)',
    category: 'Cognitive & Mental Health',
    keyFindings: [
      'Delirium is an acute, fluctuating medical emergency characterized by sudden disturbances in attention, awareness, and cognition.',
      'Unlike dementia (which progresses over months to years), delirium onset occurs over hours to days and is frequently triggered by acute infections (UTI, chest infection), medication changes, dehydration, or urinary retention.',
      'Up to 30-40% of delirium episodes in hospitalized or home-care elderly are preventable through proactive hydration, pain relief, sensory aid maintenance, and sleep hygiene.'
    ],
    caregiverImplications: [
      'If a loved one suddenly starts hallucinating, becoming unusually agitated, or becomes unusually sleepy and uncommunicative within a few hours or days, treat it as an URGENT medical event.',
      'Check for common culprits immediately: Has there been foul-smelling urine? Missed bowel movements for 3+ days? A new medicine started? Low water intake?',
      'Keep familiar family photos, clocks, and calendars in the room, ensure hearing aids and eyeglasses are in place, and communicate in calm, short sentences.'
    ],
    clinicalRecommendations: [
      'Utilize the 4AT (4-Item Assessment for Delirium) or Confusion Assessment Method (CAM) for rapid screening.',
      'Identify and aggressively treat underlying medical triggers (PINCHES: Pain, Infection, Nutrition/hydration, Constipation, Hydration/hypoxia, Electrolytes, Sedatives).',
      'Avoid physical restraints and minimize sedating psychoactive medications which exacerbate delirium duration and mortality.'
    ],
    referenceUrl: 'https://www.nice.org.uk/guidance/cg103',
    doiOrCitation: 'NICE Clinical Guideline CG103: Delirium: diagnosis, prevention and management. London: National Institute for Health and Care Excellence; 2010 (updated 2023).'
  }
];
