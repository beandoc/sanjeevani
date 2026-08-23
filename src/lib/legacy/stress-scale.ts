// src/lib/stress-scale.ts
import { z } from 'zod';

export type AssessmentInstrumentType = 'COHEN_PSS10' | 'ZARIT_ZBI12';

export interface AssessmentQuestion {
  id: number;
  question: string;
  isReversed?: boolean;
  explanation: string;
  domain?: 'psychosocial' | 'physical' | 'role_strain' | 'competence';
}

/**
 * 1. Sheldon Cohen Perceived Stress Scale (PSS-10)
 * Scored 0-40. Reversed items: 4, 5, 7, 8
 */
export const PSS10_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    question: 'In the last month, how often have you been upset because of something that happened unexpectedly?',
    isReversed: false,
    explanation: 'Measures sensitivity to unpredictable caregiving emergencies or sudden changes in the care recipient\'s health.',
    domain: 'psychosocial',
  },
  {
    id: 2,
    question: 'In the last month, how often have you felt that you were unable to control the important things in your life?',
    isReversed: false,
    explanation: 'Assesses loss of personal autonomy due to demanding caregiving schedules.',
    domain: 'role_strain',
  },
  {
    id: 3,
    question: 'In the last month, how often have you felt nervous and "stressed"?',
    isReversed: false,
    explanation: 'Captures generalized somatic and emotional tension.',
    domain: 'psychosocial',
  },
  {
    id: 4,
    question: 'In the last month, how often have you felt confident about your ability to handle your personal problems?',
    isReversed: true,
    explanation: 'Measures perceived self-efficacy and problem-solving confidence (Reversed item).',
    domain: 'competence',
  },
  {
    id: 5,
    question: 'In the last month, how often have you felt that things were going your way?',
    isReversed: true,
    explanation: 'Evaluates optimism and alignment of daily outcomes with expectations (Reversed item).',
    domain: 'psychosocial',
  },
  {
    id: 6,
    question: 'In the last month, how often have you found that you could not cope with all the things that you had to do?',
    isReversed: false,
    explanation: 'Reflects overwhelming task load and threshold fatigue.',
    domain: 'physical',
  },
  {
    id: 7,
    question: 'In the last month, how often have you been able to control irritations in your life?',
    isReversed: true,
    explanation: 'Assesses emotional regulation and tolerance to daily caregiving friction (Reversed item).',
    domain: 'psychosocial',
  },
  {
    id: 8,
    question: 'In the last month, how often have you felt that you were on top of things?',
    isReversed: true,
    explanation: 'Evaluates perceived mastery and organization over daily responsibilities (Reversed item).',
    domain: 'competence',
  },
  {
    id: 9,
    question: 'In the last month, how often have you been angered because of things that were outside of your control?',
    isReversed: false,
    explanation: 'Identifies frustration and caregiver helplessness towards progressive illness.',
    domain: 'psychosocial',
  },
  {
    id: 10,
    question: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?',
    isReversed: false,
    explanation: 'A critical indicator of crisis point and acute caregiver burnout.',
    domain: 'psychosocial',
  },
];

/**
 * 2. Zarit Burden Interview (ZBI-12 Short Form)
 * Gold standard instrument specifically designed to measure subjective caregiver burden.
 * Scored 0-48 (0 = Never, 1 = Rarely, 2 = Sometimes, 3 = Quite Frequently, 4 = Nearly Always).
 */
export const ZBI12_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    question: 'Do you feel that because of the time you spend with your relative that you don\'t have enough time for yourself?',
    explanation: 'Time dependency and sacrifice of personal leisure.',
    domain: 'role_strain',
  },
  {
    id: 2,
    question: 'Do you feel stressed between caring for your relative and trying to meet other responsibilities for your family or work?',
    explanation: 'Inter-role conflict between caregiving and career/family commitments.',
    domain: 'role_strain',
  },
  {
    id: 3,
    question: 'Do you feel angry when you are around your relative?',
    explanation: 'Caregiver resentment and emotional exhaustion.',
    domain: 'psychosocial',
  },
  {
    id: 4,
    question: 'Do you feel that your relative currently affects your relationships with other family members or friends in a negative way?',
    explanation: 'Social isolation and interpersonal tension.',
    domain: 'psychosocial',
  },
  {
    id: 5,
    question: 'Do you feel strained when you are around your relative?',
    explanation: 'Somatic anxiety and proximity-related strain.',
    domain: 'psychosocial',
  },
  {
    id: 6,
    question: 'Do you feel your health has suffered because of your involvement with your relative?',
    explanation: 'Physical toll, sleep deprivation, and psychosomatic illness.',
    domain: 'physical',
  },
  {
    id: 7,
    question: 'Do you feel that you don\'t have as much privacy as you would like because of your relative?',
    explanation: 'Loss of personal space and boundary erosion.',
    domain: 'role_strain',
  },
  {
    id: 8,
    question: 'Do you feel that your social life has suffered because you are caring for your relative?',
    explanation: 'Community disconnection and shrinking social network.',
    domain: 'psychosocial',
  },
  {
    id: 9,
    question: 'Do you feel that you have lost control of your life since your relative\'s illness?',
    explanation: 'Core indicator of role captivity and existential helplessness.',
    domain: 'role_strain',
  },
  {
    id: 10,
    question: 'Do you feel uncertain about what to do about your relative?',
    explanation: 'Decision fatigue and clinical uncertainty in chronic illness trajectory.',
    domain: 'competence',
  },
  {
    id: 11,
    question: 'Do you feel you should be doing more for your relative?',
    explanation: 'Caregiver guilt and unrealistic internal standards.',
    domain: 'competence',
  },
  {
    id: 12,
    question: 'Do you feel you could do a better job in caring for your relative?',
    explanation: 'Perceived inadequacy and chronic self-criticism.',
    domain: 'competence',
  },
];

export const LIKERT_OPTIONS = [
  { value: 0, label: 'Never', shortLabel: 'Never', scoreDescription: '0 pts' },
  { value: 1, label: 'Rarely', shortLabel: 'Rarely', scoreDescription: '1 pt' },
  { value: 2, label: 'Sometimes', shortLabel: 'Sometimes', scoreDescription: '2 pts' },
  { value: 3, label: 'Quite Frequently', shortLabel: 'Frequently', scoreDescription: '3 pts' },
  { value: 4, label: 'Nearly Always', shortLabel: 'Always', scoreDescription: '4 pts' },
] as const;

export type StressSeverity = 'low' | 'moderate' | 'high';

export interface StressLevelInfo {
  severity: StressSeverity;
  range: string;
  title: string;
  badgeVariant: 'default' | 'secondary' | 'destructive';
  color: string;
  bgLight: string;
  borderClass: string;
  description: string;
  clinicalMeaning: string;
  recommendedAction: string;
}

export const STRESS_LEVEL_INFO: Record<StressSeverity, StressLevelInfo> = {
  low: {
    severity: 'low',
    range: '0 - 13 (PSS) / 0 - 10 (ZBI)',
    title: 'Low Burden / Normal Adaptive Range',
    badgeVariant: 'secondary',
    color: '#10b981', // green
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    description: 'You are currently managing caregiving responsibilities effectively with healthy psychological reserves.',
    clinicalMeaning: 'Strain is within normative adaptive levels. Primary goal is maintenance and proactive fatigue prevention.',
    recommendedAction: 'Maintain current routine, prioritize 7-8 hours of sleep, and engage in daily 15-minute restorative activities.',
  },
  moderate: {
    severity: 'moderate',
    range: '14 - 26 (PSS) / 11 - 20 (ZBI)',
    title: 'Moderate Strain / Caregiver Fatigue',
    badgeVariant: 'default',
    color: '#f59e0b', // amber
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-300 dark:border-amber-700',
    description: 'You are experiencing notable caregiver burden. Daily demands are beginning to tax your emotional, physical, and personal bandwidth.',
    clinicalMeaning: 'Early-to-mid stage caregiver fatigue. High risk of progressive burnout if respite mechanisms are not engaged.',
    recommendedAction: 'Institute boundary management, offload non-essential household tasks, and schedule weekly respite breaks.',
  },
  high: {
    severity: 'high',
    range: '27 - 40 (PSS) / 21 - 48 (ZBI)',
    title: 'Severe Caregiver Burden / Acute Burnout Risk',
    badgeVariant: 'destructive',
    color: '#ef4444', // red
    bgLight: 'bg-rose-50 dark:bg-rose-950/30',
    borderClass: 'border-rose-300 dark:border-rose-700',
    description: 'You are under critical psychological and physical strain. Immediate intervention and rescue support are urgently advised.',
    clinicalMeaning: 'Severe caregiver burnout threshold. High risk of clinical depression, somatic breakdown, and compromised patient care safety.',
    recommendedAction: 'Activate Emergency Caregiver Rescue Protocol: Seek professional counseling, arrange replacement respite care, and contact 24/7 helplines.',
  },
};

export const stressAssessmentEntrySchema = z.object({
  id: z.string(),
  date: z.string(), // ISO date string
  instrument: z.enum(['COHEN_PSS10', 'ZARIT_ZBI12']).default('COHEN_PSS10'),
  answers: z.record(z.number()), // questionId -> raw answer 0-4
  totalScore: z.number(),
  maxScore: z.number().default(40),
  normalizedPercentage: z.number().default(0), // 0 - 100%
  severity: z.enum(['low', 'moderate', 'high']),
  notes: z.string().optional(),
  careRecipientCondition: z.string().optional(),
});

export type StressAssessmentEntry = z.infer<typeof stressAssessmentEntrySchema>;

/**
 * Calculates Sheldon Cohen PSS-10 Total Score (0-40).
 * Reverse items: 4, 5, 7, 8
 */
export function calculatePSS10Score(answers: Record<number, number>): number {
  let total = 0;
  for (const q of PSS10_QUESTIONS) {
    const rawVal = answers[q.id] ?? 0;
    if (q.isReversed) {
      total += 4 - rawVal;
    } else {
      total += rawVal;
    }
  }
  return total;
}

/**
 * Calculates Zarit Burden Interview ZBI-12 Total Score (0-48).
 * Direct summation of all 12 items.
 */
export function calculateZBI12Score(answers: Record<number, number>): number {
  let total = 0;
  for (const q of ZBI12_QUESTIONS) {
    const rawVal = answers[q.id] ?? 0;
    total += rawVal;
  }
  return total;
}

/**
 * Categorizes score based on instrument type.
 */
export function getSeverity(score: number, instrument: AssessmentInstrumentType = 'COHEN_PSS10'): StressSeverity {
  if (instrument === 'COHEN_PSS10') {
    if (score <= 13) return 'low';
    if (score <= 26) return 'moderate';
    return 'high';
  } else {
    // Zarit ZBI-12 cutoffs: <=10 Low, 11-20 Moderate, 21-48 High/Severe
    if (score <= 10) return 'low';
    if (score <= 20) return 'moderate';
    return 'high';
  }
}

/**
 * Normalizes score to standard 0-100% index (Piecewise Anchored as in Care-giver-gauge).
 */
export function normalizeScore(score: number, instrument: AssessmentInstrumentType): number {
  if (instrument === 'COHEN_PSS10') {
    return Math.round((score / 40) * 100);
  } else {
    // Zarit ZBI-12 Anchors: (0,0), (10,20), (20,50), (30,80), (48,100)
    if (score <= 10) return Math.round((score / 10) * 20);
    if (score <= 20) return Math.round(20 + ((score - 10) / 10) * 30);
    if (score <= 30) return Math.round(50 + ((score - 20) / 10) * 30);
    return Math.round(80 + ((score - 30) / 18) * 20);
  }
}

export interface LongitudinalAnalysis {
  previousScore: number | null;
  baselineScore: number | null;
  deltaFromPrevious: number | null;
  deltaFromBaseline: number | null;
  isWorsening: boolean; // >= 4 points increase (PSS) or >= 4 points (ZBI)
  isImproving: boolean;
  trajectory: 'improving' | 'stable' | 'worsening' | 'critical_surge';
  trajectoryLabel: string;
  trajectoryColor: string;
  clinicalAlert: string | null;
}

export function analyzeLongitudinalTrajectory(
  history: StressAssessmentEntry[],
  currentScore: number,
  instrument: AssessmentInstrumentType = 'COHEN_PSS10'
): LongitudinalAnalysis {
  if (!history || history.length === 0) {
    return {
      previousScore: null,
      baselineScore: null,
      deltaFromPrevious: null,
      deltaFromBaseline: null,
      isWorsening: false,
      isImproving: false,
      trajectory: 'stable',
      trajectoryLabel: 'Initial Baseline Assessment',
      trajectoryColor: 'text-slate-600 dark:text-slate-300',
      clinicalAlert: null,
    };
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const baseline = sorted[0];
  const previous = sorted[sorted.length - 1];

  const deltaFromPrevious = currentScore - previous.totalScore;
  const deltaFromBaseline = currentScore - baseline.totalScore;

  const isWorsening = deltaFromPrevious >= 4 || deltaFromBaseline >= 6;
  const isImproving = deltaFromPrevious <= -4;

  const highThreshold = instrument === 'COHEN_PSS10' ? 27 : 21;
  const maxScore = instrument === 'COHEN_PSS10' ? 40 : 48;

  let trajectory: LongitudinalAnalysis['trajectory'] = 'stable';
  let trajectoryLabel = 'Stable Trajectory';
  let trajectoryColor = 'text-blue-600 dark:text-blue-400';
  let clinicalAlert: string | null = null;

  if (currentScore >= highThreshold && deltaFromPrevious >= 4) {
    trajectory = 'critical_surge';
    trajectoryLabel = 'Critical Surge (Urgent Rescue Required)';
    trajectoryColor = 'text-rose-600 dark:text-rose-400';
    clinicalAlert = `⚠️ Critical Surge Alert: Your score jumped by +${deltaFromPrevious} points into the Severe Burnout threshold (${currentScore}/${maxScore}). Activate the Caregiver Rescue Protocol immediately.`;
  } else if (isWorsening) {
    trajectory = 'worsening';
    trajectoryLabel = `Worsening Fatigue Trend (+${deltaFromPrevious} pts)`;
    trajectoryColor = 'text-amber-600 dark:text-amber-400';
    clinicalAlert = `⚠️ Escalating Strain: Your burden increased by +${deltaFromPrevious} points since your last check-in. Proactive respite intervention is recommended before exhaustion sets in.`;
  } else if (isImproving) {
    trajectory = 'improving';
    trajectoryLabel = `Improving Resilience (${deltaFromPrevious} pts)`;
    trajectoryColor = 'text-emerald-600 dark:text-emerald-400';
    clinicalAlert = `✅ Positive Recovery: Your caregiver strain reduced by ${Math.abs(
      deltaFromPrevious
    )} points since your last checkpoint. Keep maintaining supportive boundaries.`;
  } else {
    trajectory = 'stable';
    trajectoryLabel = 'Stable Strain Level';
    trajectoryColor = 'text-blue-600 dark:text-blue-400';
  }

  return {
    previousScore: previous.totalScore,
    baselineScore: baseline.totalScore,
    deltaFromPrevious,
    deltaFromBaseline,
    isWorsening,
    isImproving,
    trajectory,
    trajectoryLabel,
    trajectoryColor,
    clinicalAlert,
  };
}

export interface RescuePlan {
  immediateActions: { title: string; desc: string; priority: 'urgent' | 'high' | 'routine' }[];
  respiteOptions: { title: string; desc: string }[];
  taskOffloadingSuggestions: { category: string; tasks: string[] }[];
  copingExercises: { name: string; duration: string; instructions: string }[];
  emergencyContacts: { name: string; number: string; type: string; notes: string }[];
}

export function generateRescuePlan(
  score: number,
  severity: StressSeverity,
  isWorsening: boolean
): RescuePlan {
  const isHighOrWorsening = severity === 'high' || isWorsening;

  const immediateActions: RescuePlan['immediateActions'] = isHighOrWorsening
    ? [
        {
          title: 'Activate Emergency Respite (Next 24-48 Hours)',
          desc: 'Request a family member, secondary caregiver, or home-care attendant to take over direct patient care for at least a 6-hour block so you can sleep and recover.',
          priority: 'urgent',
        },
        {
          title: 'Consult Tele-MANAS (14416) or Clinical Psychologist',
          desc: 'Connect with a mental health counselor to address acute caregiver exhaustion symptoms (insomnia, irritability, anxiety, emotional depletion).',
          priority: 'urgent',
        },
        {
          title: 'Suspend Non-Essential Household Demands',
          desc: 'Temporarily halt deep cleaning, elaborate cooking, and discretionary tasks. Narrow focus exclusively to patient safety and caregiver sleep.',
          priority: 'high',
        },
      ]
    : [
        {
          title: 'Protect 30 Minutes of Daily Non-Negotiable "Me Time"',
          desc: 'Block out dedicated time away from the patient for light walking, music, prayer, or reading without caregiving interruptions.',
          priority: 'high',
        },
        {
          title: 'Set Up a Shared Family Care Calendar',
          desc: 'Use digital tools or a whiteboard to distribute doctor visits, grocery runs, and pharmacy trips among other family members.',
          priority: 'routine',
        },
        {
          title: 'Practice Restorative Sleep Hygiene',
          desc: 'Avoid screens 45 minutes before sleep; ensure bedroom is dark and quiet to maintain uninterrupted restorative rest.',
          priority: 'routine',
        },
      ];

  const respiteOptions: RescuePlan['respiteOptions'] = [
    {
      title: 'Informal Family Handover Matrix',
      desc: 'Establish a structured schedule where secondary caregivers cover weekend mornings or 2 evenings per week.',
    },
    {
      title: 'Professional Geriatric Aide / Attendant Relief',
      desc: 'Hire certified General Duty Assistants (GDAs) for overnight shifts or 3-4 afternoons per week to prevent chronic sleep deprivation.',
    },
    {
      title: 'Day Care / Geriatric Activity Centers',
      desc: 'Utilize specialized day rehabilitation centers for dementia or stroke patients to enable structured cognitive stimulation while caregiver rests.',
    },
  ];

  const taskOffloadingSuggestions: RescuePlan['taskOffloadingSuggestions'] = [
    {
      category: 'Medical & Administration',
      tasks: [
        'Automate monthly prescription refills through e-pharmacy delivery apps',
        'Delegate doctor appointment booking and lab report fetching to a family member',
        'Use pre-sorted weekly 7-day pill organizers to reduce daily medication stress',
      ],
    },
    {
      category: 'Daily Living & Meals',
      tasks: [
        'Subscribe to healthy meal tiffin services or hire domestic kitchen help',
        'Outsource heavy laundry and household sanitation',
        'Batch grocery orders online rather than daily physical shopping trips',
      ],
    },
    {
      category: 'Patient Companionship',
      tasks: [
        'Schedule daily 20-minute video calls with distant grandchildren or relatives',
        'Enlist a trusted neighbor to accompany patient during afternoon garden walks',
      ],
    },
  ];

  const copingExercises: RescuePlan['copingExercises'] = [
    {
      name: '4-7-8 Somatic Calming Breath',
      duration: '3 Minutes',
      instructions: 'Inhale silently through the nose for 4 seconds, hold breath comfortably for 7 seconds, and exhale completely with a whoosh sound for 8 seconds. Repeat 4 cycles.',
    },
    {
      name: '5-4-3-2-1 Sensory Grounding',
      duration: '5 Minutes',
      instructions: 'Acknowledge 5 things you can see around you, 4 things you can physically touch, 3 sounds you can hear, 2 things you can smell, and 1 positive affirmation.',
    },
    {
      name: 'Progressive Muscle Relaxation',
      duration: '7 Minutes',
      instructions: 'Tense your shoulder and neck muscles tightly for 5 seconds, then deliberately release all tension as you exhale. Move downward through hands, abdomen, and legs.',
    },
  ];

  const emergencyContacts: RescuePlan['emergencyContacts'] = [
    {
      name: 'Tele-MANAS (Govt. of India National Mental Health Helpline)',
      number: '14416 / 1800-891-4416',
      type: 'Toll-Free 24/7 Helpline',
      notes: 'Comprehensive round-the-clock psychological first-aid in 20+ Indian languages by clinical psychologists.',
    },
    {
      name: 'KIRAN Helpline (Govt. of India)',
      number: '1800-599-0019',
      type: 'Toll-Free 24/7 Support',
      notes: 'National helpline for mental health rehabilitation, anxiety, and caregiver burnout relief.',
    },
    {
      name: 'Vandrevala Foundation Crisis Support',
      number: '+91 9999 666 555',
      type: '24/7 Crisis Counseling',
      notes: 'Immediate confidential emotional support for acute exhaustion, panic, and distress.',
    },
    {
      name: 'NIMHANS Geriatric Care & Memory Clinic',
      number: '080-26995000',
      type: 'Premier Geriatric Institute',
      notes: 'Specialized consultation and support network for caregivers of patients with dementia and Parkinsonism.',
    },
  ];

  return {
    immediateActions,
    respiteOptions,
    taskOffloadingSuggestions,
    copingExercises,
    emergencyContacts,
  };
}

export const SAMPLE_HISTORICAL_DATA: StressAssessmentEntry[] = [
  {
    id: 'sample-1',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    instrument: 'ZARIT_ZBI12',
    answers: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 1, 6: 0, 7: 1, 8: 1, 9: 0, 10: 1, 11: 1, 12: 1 },
    totalScore: 8,
    maxScore: 48,
    normalizedPercentage: 16,
    severity: 'low',
    notes: 'Baseline assessment at discharge from hospital.',
    careRecipientCondition: 'Stroke Recovery',
  },
  {
    id: 'sample-2',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    instrument: 'ZARIT_ZBI12',
    answers: { 1: 2, 2: 2, 3: 1, 4: 1, 5: 2, 6: 1, 7: 2, 8: 2, 9: 1, 10: 2, 11: 1, 12: 1 },
    totalScore: 18,
    maxScore: 48,
    normalizedPercentage: 44,
    severity: 'moderate',
    notes: 'Difficulty balancing work and nightly patient monitoring.',
    careRecipientCondition: 'Dementia & Stroke',
  },
  {
    id: 'sample-3',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    instrument: 'ZARIT_ZBI12',
    answers: { 1: 3, 2: 4, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 2, 12: 2 },
    totalScore: 33,
    maxScore: 48,
    normalizedPercentage: 85,
    severity: 'high',
    notes: 'Severe physical exhaustion and role conflict. Feeling trapped and unable to sleep.',
    careRecipientCondition: 'Dementia & Stroke',
  },
];
