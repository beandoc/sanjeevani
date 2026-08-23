'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Wind,
  Droplets,
  Pill,
  Moon,
  PhoneCall,
  RotateCcw,
  HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrisisEscalationModal } from '@/components/crisis/crisis-escalation-modal';

/* ─── Types ─────────────────────────────────────────────────── */
type StepAction = {
  label: string;
  isRedFlag?: boolean;
  nextStep?: number; // index into scenario.steps
  terminal?: 'safe' | 'crisis';
};

type Step = {
  title: string;
  body: string[];
  tip?: string;
  actions: StepAction[];
};

type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  steps: Step[];
};

/* ─── Scenario Data ──────────────────────────────────────────── */
const SCENARIOS: Scenario[] = [
  {
    id: 'delirium',
    title: 'Sudden Confusion / Agitation',
    subtitle: 'Delirium vs. Dementia — home triage',
    icon: Brain,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10 border-violet-500/30',
    steps: [
      {
        title: 'Step 1 — Check Vitals First',
        body: [
          'Measure SpO₂ with pulse oximeter — normal is ≥ 94%.',
          'Check temperature — fever ≥ 38°C may indicate UTI or pneumonia triggering delirium.',
          'Note time of onset: sudden (hours) = delirium; gradual (weeks) = dementia progression.',
        ],
        tip: 'Delirium is reversible. Dementia is not. A sudden change almost always means delirium — treat it as an emergency until proven otherwise.',
        actions: [
          { label: 'SpO₂ < 90% or Fever ≥ 38.5°C', isRedFlag: true, nextStep: 1 },
          { label: 'Vitals normal — check bowel', nextStep: 2 },
        ],
      },
      {
        title: '🚨 Red Flag — Low Oxygen or High Fever',
        body: [
          'SpO₂ below 90% indicates possible pneumonia, pulmonary embolism, or heart failure.',
          'High fever with confusion is a medical emergency — likely sepsis or meningitis.',
          'Do NOT attempt home management. Call ambulance immediately.',
        ],
        tip: 'Do not give paracetamol alone and wait. Call 112 now.',
        actions: [
          { label: 'Call Emergency (112)', isRedFlag: true, terminal: 'crisis' },
        ],
      },
      {
        title: 'Step 2 — Check Bowel & Bladder',
        body: [
          'Ask: Has the patient had a bowel movement in the past 2–3 days?',
          'Fecal impaction is a common but overlooked trigger of delirium in elderly.',
          'Check if urination is painful or cloudy — signs of UTI.',
          'Check if any new medications were started in the past 48 hours.',
        ],
        tip: 'Constipation-triggered delirium responds rapidly to an enema or suppository. A simple intervention can reverse acute confusion within hours.',
        actions: [
          { label: 'No bowel movement >3 days', nextStep: 3 },
          { label: 'Possible UTI or new medication', nextStep: 4 },
          { label: 'None of the above — proceed to reorientation', nextStep: 5 },
        ],
      },
      {
        title: 'Step 3 — Manage Constipation at Home',
        body: [
          'Administer glycerine suppository (available OTC) per pharmacist guidance.',
          'Offer 200ml warm water with 1 tsp ghee/olive oil orally if conscious and safe to swallow.',
          'Gently massage abdomen clockwise for 5–10 minutes.',
          'Monitor for response within 2–4 hours.',
        ],
        tip: 'If no response after 4 hours and confusion worsens, escalate to doctor.',
        actions: [
          { label: 'Responded — confusion cleared', terminal: 'safe' },
          { label: 'No response after 4 hours', isRedFlag: true, terminal: 'crisis' },
        ],
      },
      {
        title: 'Step 4 — UTI or Medication-Induced Delirium',
        body: [
          'For suspected UTI: increase oral fluids (>1.5L/day). Contact doctor for urine culture and antibiotic prescription.',
          'For medication triggers: do NOT stop medications abruptly without medical guidance.',
          'Common culprits: anticholinergics, benzodiazepines, opioids, steroids.',
          'Have medication list ready when calling doctor.',
        ],
        tip: 'Many sedatives (Diazepam, Alprazolam) are listed on the Beers Criteria as high-risk for elderly. Mention any such drugs to your doctor.',
        actions: [
          { label: 'Contact GP or Geriatrician', terminal: 'safe' },
          { label: 'Rapid deterioration — call emergency', isRedFlag: true, terminal: 'crisis' },
        ],
      },
      {
        title: 'Step 5 — Environmental Reorientation',
        body: [
          'Ensure good lighting — darkness worsens confusion. Use a familiar night lamp.',
          'Speak in a calm, slow, familiar voice. Avoid arguing or correcting.',
          'Orient the patient: "It is morning. You are at home. I am [name]."',
          'Maintain familiar objects nearby: clock, family photo, favorite cup.',
          'Avoid physical restraints — they escalate agitation and cause injury.',
        ],
        tip: 'Caregiver anxiety is sensed by the patient. Take 3 slow breaths before approaching.',
        actions: [
          { label: 'Patient calmed — monitor closely', terminal: 'safe' },
          { label: 'Agitation worsening or violence', isRedFlag: true, terminal: 'crisis' },
        ],
      },
    ],
  },
  {
    id: 'fall',
    title: 'Unwitnessed Fall at Home',
    subtitle: 'Head trauma, hip check & safe floor recovery',
    icon: ShieldAlert,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    steps: [
      {
        title: 'Step 1 — Do NOT Move Yet',
        body: [
          'First: Speak calmly to the patient. "Can you hear me? Are you okay?"',
          'Look for red flags before attempting to lift.',
          'Check: Loss of consciousness (even brief)? Vomiting? Severe headache?',
          'Check: Is one leg shorter than the other, rotated outward? = Suspect hip fracture.',
        ],
        tip: 'Moving a patient with a hip fracture or spinal injury can cause permanent paralysis. Always rule out red flags first.',
        actions: [
          { label: 'Red flag present (LOC / vomiting / deformed leg)', isRedFlag: true, nextStep: 1 },
          { label: 'No red flags — assess head and limbs', nextStep: 2 },
        ],
      },
      {
        title: '🚨 Red Flag — Do Not Move. Call 112.',
        body: [
          'Loss of consciousness, even brief, = possible intracranial bleed. Needs CT scan urgently.',
          'Vomiting after fall = raised intracranial pressure.',
          'Shortened, externally rotated leg = hip fracture. Attempted lifting = bone displacement and fat embolism risk.',
          'Keep patient still. Cover with blanket. Stay with them. Call 112 immediately.',
        ],
        tip: 'Stay on the line with emergency services. They will guide you until paramedics arrive.',
        actions: [
          { label: 'Call Emergency (112)', isRedFlag: true, terminal: 'crisis' },
        ],
      },
      {
        title: 'Step 2 — Safe Floor Assessment',
        body: [
          'Check for cuts or bleeding — apply gentle pressure with clean cloth.',
          'Ask patient to wiggle toes and fingers — rules out spinal cord injury.',
          'Check for wrist tenderness — Colles fracture is common from outstretched hand breaking fall.',
          'If patient is conscious and comfortable on floor, take a moment to plan the lift.',
        ],
        tip: 'Never rush to lift. A 2-minute assessment prevents a permanent injury.',
        actions: [
          { label: 'Wrist / shoulder pain or unable to move limbs', isRedFlag: true, terminal: 'crisis' },
          { label: 'All clear — proceed with safe two-chair lift', nextStep: 3 },
        ],
      },
      {
        title: 'Step 3 — Two-Chair Safe Lift Technique',
        body: [
          '1. Place a sturdy chair close to the patient\'s side.',
          '2. Help patient roll to their stronger side into a kneeling position.',
          '3. Patient places hands on the seat of the first chair for support.',
          '4. Patient pushes up with strong leg — caregiver supports from behind at hip level, NOT by pulling arms.',
          '5. Once standing, pivot patient into the second chair.',
          'Rest for 5 minutes before standing fully.',
        ],
        tip: 'Protect YOUR back: keep spine straight, lift with your legs, not waist. Never pull by the arms — it dislocates shoulders.',
        actions: [
          { label: 'Patient safely seated — monitor for 30 minutes', terminal: 'safe' },
          { label: 'Cannot complete lift safely', isRedFlag: true, terminal: 'crisis' },
        ],
      },
    ],
  },
  {
    id: 'choking',
    title: 'Choking & Dysphagia Emergency',
    subtitle: 'Feeding posture, aspiration drill & airway management',
    icon: Wind,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30',
    steps: [
      {
        title: 'Step 1 — Assess Severity Immediately',
        body: [
          'Mild choke: Patient can cough forcefully, speak, and breathe → encourage coughing.',
          'Severe choke: Patient cannot speak, breathe, or cough. Hands at throat. Face turning blue.',
          'Silent aspiration: Patient shows no distress but has wet/gurgly voice after swallowing.',
        ],
        tip: 'A patient who can cough has an open airway. Never do the Heimlich on a patient who can still cough — it can cause rib fractures.',
        actions: [
          { label: 'Can cough and breathe — mild obstruction', nextStep: 1 },
          { label: 'Cannot breathe or turning blue — severe', isRedFlag: true, nextStep: 2 },
          { label: 'No choking episode — preventing future aspiration', nextStep: 3 },
        ],
      },
      {
        title: 'Step 2 — Mild Choke: Support Coughing',
        body: [
          'Encourage continued coughing — this is the most effective airway clearance.',
          'Lean patient slightly forward (gravity helps dislodge object downward).',
          'Do NOT give water — it may carry the obstruction deeper.',
          'Monitor for 5 minutes; if coughing resolves, assess swallowing safety before next meal.',
        ],
        tip: 'Once resolved, soft/pureed diet for 24 hours. Report to treating physician or speech therapist.',
        actions: [
          { label: 'Resolved safely', terminal: 'safe' },
          { label: 'Coughing stops but patient distressed', isRedFlag: true, nextStep: 2 },
        ],
      },
      {
        title: '🚨 Severe Choke — Abdominal Thrusts',
        body: [
          '1. Stand behind patient. Place one foot forward for stability.',
          '2. Make a fist with one hand; place thumb side against abdomen above navel, below breastbone.',
          '3. Grab your fist with other hand. Give 5 quick, sharp inward-and-upward thrusts.',
          '4. Alternate 5 back blows (heel of hand between shoulder blades) with 5 abdominal thrusts.',
          '5. If patient becomes unconscious — lower to floor and call 112. Begin CPR.',
        ],
        tip: 'For bed-bound patients: modified technique — position hands on chest (chest thrusts) instead of abdomen.',
        actions: [
          { label: 'Object expelled — patient breathing', terminal: 'safe' },
          { label: 'Patient unconscious or no relief', isRedFlag: true, terminal: 'crisis' },
        ],
      },
      {
        title: 'Step 4 — Preventing Future Aspiration',
        body: [
          'Always feed in upright 90° sitting position — NEVER lying flat or semi-reclined.',
          'Maintain upright for at least 45 minutes after each meal.',
          'Use chin-tuck posture during swallowing (chin toward chest before each sip/bite).',
          'Use thickened liquids (nectar or honey consistency) if prescribed by speech therapist.',
          'Offer small bites/sips. Never rush a meal. Aim 30–45 minutes per feed.',
          'Avoid distractions (TV, conversation) while patient is swallowing.',
        ],
        tip: 'Request a Speech Language Pathology (SLP) evaluation. They can prescribe the exact texture/thickness needed for your patient.',
        actions: [
          { label: 'Noted — implement posture protocols', terminal: 'safe' },
        ],
      },
    ],
  },
  {
    id: 'fever-catheter',
    title: 'Fever & Catheter Turbidity',
    subtitle: 'Urosepsis screen & catheter blockage triage',
    icon: Droplets,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    steps: [
      {
        title: 'Step 1 — Assess Catheter Output',
        body: [
          'Check catheter bag: Is urine output less than 30ml/hour? (Normal: 40–80ml/hr)',
          'Is urine dark, cloudy, or malodorous (foul smelling)?',
          'Is there visible debris, flakes, or blood in the catheter tubing?',
          'Check if patient has fever ≥ 38°C, chills, rigors, or new confusion.',
        ],
        tip: 'A blocked catheter causes bladder distension which can rapidly trigger autonomic dysreflexia (dangerous blood pressure spike) in spinal cord patients.',
        actions: [
          { label: 'No output for >1 hour or high fever + confusion', isRedFlag: true, nextStep: 1 },
          { label: 'Cloudy/dark but draining — UTI screen', nextStep: 2 },
          { label: 'Output normal — check hydration', nextStep: 3 },
        ],
      },
      {
        title: '🚨 Blocked Catheter or Urosepsis',
        body: [
          'Blocked catheter + fever + confusion = potential urosepsis (life-threatening).',
          'Signs of urosepsis: HR > 90, RR > 20, fever ≥ 38.3°C or < 36°C, confusion.',
          'Do NOT attempt bladder irrigation without medical guidance if blocked and febrile.',
          'Call your urologist or GP immediately. If unresponsive — call 112.',
        ],
        tip: 'Urosepsis is the #1 cause of sepsis in elderly with catheters. Time to antibiotics matters — golden hour concept applies.',
        actions: [
          { label: 'Call Doctor / Urologist immediately', terminal: 'crisis' },
          { label: 'Call Emergency (112) — rapid deterioration', isRedFlag: true, terminal: 'crisis' },
        ],
      },
      {
        title: 'Step 2 — Suspected UTI (Draining Catheter)',
        body: [
          'Increase oral fluid intake to 2–2.5L/day unless patient is on fluid restriction.',
          'Do NOT change catheter without sterile technique — increases infection risk.',
          'Collect urine sample from catheter port (not bag) using sterile syringe for culture.',
          'Contact GP for antibiotic prescription — avoid empiric antibiotics without culture.',
          'Monitor temperature every 4 hours.',
        ],
        tip: 'A catheter itself is always colonized — only treat UTI if patient has SYMPTOMS (fever, confusion, pain) not just cloudy urine.',
        actions: [
          { label: 'GP contacted, culture collected', terminal: 'safe' },
          { label: 'Fever rises above 38.5°C', isRedFlag: true, terminal: 'crisis' },
        ],
      },
      {
        title: 'Step 3 — Ensure Adequate Hydration',
        body: [
          'Dark urine without fever is most commonly dehydration in elderly.',
          'Target: pale yellow urine (straw-colored) = good hydration.',
          'Offer 150–200ml fluid every 2 hours while awake.',
          'Elderly patients often have blunted thirst mechanism — proactively offer fluids.',
          'Monitor output hourly — should improve within 2–3 hours of increased fluids.',
        ],
        tip: 'If patient refuses fluids and output remains low after 4 hours, or if confusion develops, contact GP.',
        actions: [
          { label: 'Hydration improved, urine clearing', terminal: 'safe' },
          { label: 'No improvement or new confusion develops', isRedFlag: true, terminal: 'crisis' },
        ],
      },
    ],
  },
  {
    id: 'sundowning',
    title: 'Medication Refusal & Sundowning',
    subtitle: 'De-escalation protocols & nighttime agitation',
    icon: Moon,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10 border-indigo-500/30',
    steps: [
      {
        title: 'Step 1 — Identify the Trigger',
        body: [
          'Sundowning peaks between 4PM–8PM when light decreases. Is this the time now?',
          'Medication refusal: Is it taste, texture, swallowing difficulty, or distrust?',
          'Check: Is the patient in pain? Pain is a common hidden trigger for agitation.',
          'Any recent change in routine, caregiver, or environment?',
        ],
        tip: 'Sundowning is neurological, not willful. The patient is not being difficult — their brain has lost its circadian anchor. Meet them where they are.',
        actions: [
          { label: 'Medication refusal — improve administration', nextStep: 1 },
          { label: 'Sundowning agitation / pacing', nextStep: 2 },
          { label: 'Aggressive behaviour towards caregiver', isRedFlag: true, nextStep: 3 },
        ],
      },
      {
        title: 'Step 2 — Improve Medication Acceptance',
        body: [
          'Crush tablets (if allowed — never crush sustained-release medications) and mix in jam, honey, or curd.',
          'Use liquid formulations when available — ask pharmacist to check availability.',
          'Offer medication with patient\'s favorite beverage.',
          'Never sneak medication into food without disclosure — this breaks trust when discovered.',
          'Try changing the TIME of dose if refusal is consistent at a certain hour.',
        ],
        tip: 'If the patient spits out medications repeatedly, contact the prescribing physician. Transdermal patches or injectable depot formulations may be an option.',
        actions: [
          { label: 'Accepted medication', terminal: 'safe' },
          { label: 'Consistently refusing — contact doctor', terminal: 'safe' },
        ],
      },
      {
        title: 'Step 3 — Sundowning De-escalation Protocol',
        body: [
          'Turn on bright lights inside (light therapy combats circadian disruption).',
          'Engage in calm physical activity: short walk, hand massage, folding towels.',
          'Maintain a predictable routine — dinner, bath, music at the same time daily.',
          'Play familiar music from the patient\'s youth — powerful memory anchor.',
          'Minimize caregivers/family crowding — too many faces increase agitation.',
          'Avoid naps after 3PM — disrupts nighttime sleep architecture.',
        ],
        tip: 'The goal is not to "fix" sundowning but to ride it out safely until the brain resets at night. Consistency over weeks is the treatment.',
        actions: [
          { label: 'Patient calmed with de-escalation', terminal: 'safe' },
          { label: 'Worsening — discuss medications with neurologist', terminal: 'safe' },
          { label: 'Immediate safety risk', isRedFlag: true, nextStep: 3 },
        ],
      },
      {
        title: '⚠️ Physical Aggression — Safety Protocol',
        body: [
          'DO NOT physically restrain — this escalates violence and causes injury to both.',
          'Step back and give physical space (at least 2 arm lengths).',
          'Use calm, low voice. Do not match their emotional energy.',
          'Remove hard objects from reach. Stay near an exit.',
          'If there is immediate risk of injury to patient or caregiver, call for help.',
        ],
        tip: 'A patient who is aggressive is terrified. The aggression is driven by fear. Your calmness is the most effective tool.',
        actions: [
          { label: 'Situation de-escalated', terminal: 'safe' },
          { label: 'Immediate danger — call emergency', isRedFlag: true, terminal: 'crisis' },
        ],
      },
    ],
  },
];

/* ─── Component ─────────────────────────────────────────────── */
export type CaregiverTroubleshootingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialScenarioId?: string;
};

export function CaregiverTroubleshootingModal({
  isOpen,
  onClose,
  initialScenarioId,
}: CaregiverTroubleshootingModalProps) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    initialScenarioId ? (SCENARIOS.find(s => s.id === initialScenarioId) ?? null) : null
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [terminal, setTerminal] = useState<'safe' | 'crisis' | null>(null);

  const handleClose = () => {
    setSelectedScenario(null);
    setStepIndex(0);
    setTerminal(null);
    onClose();
  };

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setStepIndex(0);
    setTerminal(null);
  };

  const handleAction = (action: StepAction) => {
    if (action.terminal === 'crisis') {
      setIsCrisisOpen(true);
    } else if (action.terminal === 'safe') {
      setTerminal('safe');
    } else if (action.nextStep !== undefined) {
      setStepIndex(action.nextStep);
      setTerminal(null);
    }
  };

  const handleBack = () => {
    if (terminal) {
      setTerminal(null);
      return;
    }
    if (stepIndex === 0) {
      setSelectedScenario(null);
    } else {
      setStepIndex(0); // return to start of scenario
    }
  };

  const currentStep = selectedScenario?.steps[stepIndex];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/60 shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <HeartPulse className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold leading-tight">
                  Caregiver Acute Troubleshooting
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Step-by-step bedside decision support
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6">
            {/* ── Scenario Picker ── */}
            {!selectedScenario && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Select an acute situation
                </p>
                {SCENARIOS.map(scenario => (
                  <button
                    key={scenario.id}
                    onClick={() => handleSelectScenario(scenario)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99]',
                      scenario.bgColor
                    )}
                  >
                    <div className={cn('h-10 w-10 rounded-lg bg-background/80 flex items-center justify-center shrink-0 border border-border/40')}>
                      <scenario.icon className={cn('h-5 w-5', scenario.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground">{scenario.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{scenario.subtitle}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* ── Step View ── */}
            {selectedScenario && !terminal && currentStep && (
              <div className="space-y-5">
                {/* Progress */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 border',
                      selectedScenario.color,
                      selectedScenario.bgColor
                    )}
                  >
                    {selectedScenario.title}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Step {stepIndex + 1} of {selectedScenario.steps.length}
                  </span>
                </div>

                {/* Step Title */}
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {currentStep.title}
                </h3>

                {/* Body Points */}
                <ul className="space-y-2.5">
                  {currentStep.body.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                      </div>
                      {point}
                    </li>
                  ))}
                </ul>

                {/* Tip */}
                {currentStep.tip && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      {currentStep.tip}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  {currentStep.actions.map((action, i) => (
                    <Button
                      key={i}
                      onClick={() => handleAction(action)}
                      variant={action.isRedFlag ? 'destructive' : 'outline'}
                      className={cn(
                        'w-full justify-start text-left h-auto py-3 px-4 rounded-xl text-xs font-semibold gap-3',
                        action.isRedFlag
                          ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                          : 'border-border/60 hover:bg-primary/5 hover:border-primary/30'
                      )}
                    >
                      {action.isRedFlag ? (
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Safe Terminal ── */}
            {terminal === 'safe' && (
              <div className="text-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  Situation Stabilised
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Continue monitoring closely. Document this event in the Bedside Log and flag for your next clinical review.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedScenario(null); setTerminal(null); setStepIndex(0); }}
                    className="rounded-xl gap-2 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Another Scenario
                  </Button>
                  <Button size="sm" onClick={handleClose} className="rounded-xl text-xs">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer nav */}
          {selectedScenario && !terminal && (
            <div className="px-6 pb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-xl"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {stepIndex === 0 ? 'Back to scenarios' : 'Back to start'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CrisisEscalationModal
        isOpen={isCrisisOpen}
        onClose={() => setIsCrisisOpen(false)}
        severityReason="Acute caregiver emergency escalation from troubleshooting walkthrough."
      />
    </>
  );
}

export { SCENARIOS };
export type { Scenario };
