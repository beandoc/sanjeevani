'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  ShieldAlert,
  PhoneCall,
  Activity,
  HeartCrack,
  Droplet,
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrisisEscalationModal } from '@/components/crisis/crisis-escalation-modal';

export interface EmergencyActionCard {
  id: string;
  title: string;
  triggerEvent: string;
  category: 'choking' | 'delirium' | 'back_strain' | 'skin_tear' | 'hypotension';
  severity: 'critical' | 'urgent' | 'moderate';
  color: string;
  steps: string[];
  doNotDo: string[];
  escalationThreshold: string;
}

export const EMERGENCY_ACTION_CARDS: EmergencyActionCard[] = [
  {
    id: 'choking_dysphagia',
    title: 'Choking / Severe Coughing Episode During Feeding',
    triggerEvent: 'Patient coughs violently, gurgles, or struggles for breath during mealtime.',
    category: 'choking',
    severity: 'critical',
    color: 'border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100',
    steps: [
      'Stop feeding or giving liquids immediately.',
      'Instruct and assist the patient to tuck their chin firmly downward toward their chest (chin-tuck maneuver closes the airway).',
      'Encourage strong coughing—do not pat back forcefully while sitting upright (which can lodge the bolus deeper).',
      'If visible and easy to reach, clear pocketed food from the cheek with gauze; avoid blind finger sweeps.'
    ],
    doNotDo: [
      'Never give water to "wash down" a choking episode—thin water accelerates lung aspiration!',
      'Never feed a patient lying flat or in a reclined position.'
    ],
    escalationThreshold: 'If patient turns blue (cyanosis), cannot breathe, or loses consciousness, call 112 immediately and follow dispatcher-guided choking/CPR instructions.'
  },
  {
    id: 'sundowning_delirium',
    title: 'Sudden Nighttime Delirium & Agitation (Sundowning)',
    triggerEvent: 'Elderly patient suddenly becomes confused, agitated, sees things, or attempts to leave bed at dusk.',
    category: 'delirium',
    severity: 'urgent',
    color: 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100',
    steps: [
      'Turn on warm, diffuse ambient lighting to eliminate frightening shadows.',
      'Speak in a calm, low, reassuring tone. Re-orient gently: "You are safe at home in your bed with me."',
      'Check physiological triggers: Offer 100ml water, offer the toilet/urinal, check body temperature for acute UTI or fever.',
      'Play familiar soothing Indian classical music or chantings.'
    ],
    doNotDo: [
      'Never argue with or invalidate the patient’s hallucinations.',
      'Never physically tie or restrain the senior, which triggers panic and lethal struggle.'
    ],
    escalationThreshold: 'If acute delirium is sudden (onset < 24 hours), contact the doctor immediately to check for silent pneumonia or urinary tract infection.'
  },
  {
    id: 'caregiver_back_strain',
    title: 'Caregiver Acute Back Spasm During Patient Transfer',
    triggerEvent: 'Caregiver feels a sudden sharp lumbar spasm or pain while lifting/transferring the patient.',
    category: 'back_strain',
    severity: 'urgent',
    color: 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-100',
    steps: [
      'Immediately lower the patient safely onto the nearest surface (bed, chair, or floor)—do not attempt to heroically carry them alone.',
      'Stop all single-person manual lifting. Use any prescribed support belt only if it is already part of your care plan.',
      'Utilize slide sheets and ask a second family member or neighbor for help.',
      'Lie supine on a firm surface with knees bent over pillows for 15 minutes.'
    ],
    doNotDo: [
      'Never twist your spine while bearing the patient’s body weight.',
      'Do not continue heavy manual lifting while experiencing acute radiating sciatica pain.'
    ],
    escalationThreshold: 'If you experience severe shooting leg pain, numbness, weakness, bladder/bowel symptoms, or pain after a fall, seek urgent medical evaluation and mobilize secondary family caregivers.'
  },
  {
    id: 'skin_tear_anticoagulation',
    title: 'Skin Tear / Bleeding in Patient on Blood Thinners',
    triggerEvent: 'Frail paper-thin skin tears from minor bump or friction; continuous oozing.',
    category: 'skin_tear',
    severity: 'moderate',
    color: 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100',
    steps: [
      'Apply direct, continuous, firm pressure with sterile saline gauze for at least 10–15 minutes without lifting to check.',
      'Cleanse gently with sterile normal saline—do not scrub or use stinging alcohol.',
      'Gently approximate the torn skin flap back into position.',
      'Cover with non-adherent silicone dressing or petroleum gauze. Secure with tubular netting (avoid adhesive tape on skin).'
    ],
    doNotDo: [
      'Never tear off the viable skin flap.',
      'Never apply standard sticky adhesive tapes directly to geriatric senile purpura skin.'
    ],
    escalationThreshold: 'If bleeding does not stop after 20 minutes of continuous direct pressure in a patient on Warfarin/Apixaban, visit the emergency room.'
  },
  {
    id: 'postural_hypotension',
    title: 'Sudden Dizziness / Lightheadedness upon Standing',
    triggerEvent: 'Patient feels faint, dizzy, or sways when standing up from bed or chair.',
    category: 'hypotension',
    severity: 'moderate',
    color: 'border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-100',
    steps: [
      'Immediately assist the patient back into a seated or lying position.',
      'Elevate the patient’s legs on 2 pillows to facilitate venous blood return to the heart and brain.',
      'Offer small sips of water if the patient is fully awake, able to swallow safely, and not on a fluid-restriction plan.',
      'Instruct patient on "3-Stage Transfer": Lie down → Sit at edge of bed for 2 minutes → Stand up slowly with support.'
    ],
    doNotDo: [
      'Never rush a senior to stand up quickly upon waking from sleep.',
      'Never leave a dizzy senior standing alone without walker or physical support.'
    ],
    escalationThreshold: 'If dizziness is accompanied by chest pain, slurred speech, or loss of consciousness, call 112 emergency immediately.'
  }
];

export function BedsideEmergencyCards() {
  const [expandedCardId, setExpandedCardId] = useState<string | null>('choking_dysphagia');
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [crisisReason, setCrisisReason] = useState<string>('Home Care Bedside Crisis Protocol');

  const handleTriggerCrisis = (reason: string) => {
    setCrisisReason(reason);
    setIsCrisisModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <CrisisEscalationModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
        severityReason={crisisReason}
        isSelfHarmBranch={false}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-destructive/10 border border-destructive/30">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-destructive/20 text-destructive mt-0.5 animate-pulse shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-foreground text-base sm:text-lg">
              Just-In-Time (JIT) Bedside Emergency Action Cards
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Immediate clinical micro-steps for acute domiciliary events (choking, sudden delirium, caregiver back spasms, and bleeding).
            </p>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleTriggerCrisis('Emergency Escalation triggered from Bedside Quick Cards')}
          className="gap-2 font-bold shrink-0 text-xs shadow-md"
        >
          <PhoneCall className="w-4 h-4" /> Tele-MANAS / 112 SOS
        </Button>
      </div>

      <div className="space-y-4">
        {EMERGENCY_ACTION_CARDS.map((card) => {
          const isExpanded = expandedCardId === card.id;

          return (
            <Card
              key={card.id}
              className={cn(
                'border-2 transition-all rounded-2xl overflow-hidden shadow-xs',
                card.color
              )}
            >
              <div
                onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-background/80 shrink-0">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-foreground">
                        {card.title}
                      </h4>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                        {card.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {card.triggerEvent}
                    </p>
                  </div>
                </div>

                <div className="p-1 rounded-lg bg-background/60 shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && (
                <CardContent className="px-5 pb-5 pt-0 space-y-4 border-t border-border/40 bg-background/90 backdrop-blur-sm">
                  {/* Action Steps */}
                  <div className="pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Immediate Action Steps:
                    </span>
                    <ul className="space-y-2 text-xs text-foreground/90 pl-1">
                      {card.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Do Not Do */}
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      What NOT To Do (Dangerous Errors):
                    </span>
                    <ul className="list-disc space-y-1 pl-5 text-[11px] leading-relaxed">
                      {card.doNotDo.map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Hospital Escalation Threshold */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block text-[11px]">
                        When to Escalate to Hospital:
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        {card.escalationThreshold}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.location.href = 'tel:112';
                      }}
                      className="shrink-0 text-xs font-bold text-destructive hover:bg-destructive/10"
                    >
                      Call Emergency (112)
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
