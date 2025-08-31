'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Target, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Option = {
  text: string;
  isCorrect: boolean;
  feedback: string;
  recommendation: string;
};

const simulationsData: {
  [key: string]: {
    title: string;
    scenario: string;
    condition: string;
    options: Option[];
  };
} = {
  'managing-a-fall': {
    title: 'Managing a Fall',
    scenario:
      'You enter the living room and find an elderly person on the floor next to a chair. They are awake and seem worried.',
    condition: 'Patient has a history of osteoporosis and is on blood thinners.',
    options: [
      {
        text: 'Help the person stand up immediately.',
        isCorrect: false,
        feedback:
          'Incorrect. Moving someone after a fall without assessing for injury, especially with osteoporosis and on blood thinners, can cause serious harm, such as worsening a fracture or causing internal bleeding.',
        recommendation:
          'The first priority is to assess for injury before any movement. Ask the person if they are in pain and perform a visual check for obvious signs of fractures, bleeding, or head injury.',
      },
      {
        text: 'Ask the person if they are in pain and look for obvious injuries.',
        isCorrect: true,
        feedback:
          'Correct. This is the most important first step. Assessing for pain and obvious injuries before moving the person prevents further harm.',
        recommendation:
          'Before attempting any movement, always check for pain, visible injuries, or neurological changes (like confusion). If there is any sign of significant injury, it is best to keep the person comfortable and call for emergency help.',
      },
      {
        text: 'Call for an ambulance right away.',
        isCorrect: false,
        feedback:
          'Incorrect. While this may be necessary, it is not the first step. A quick assessment is needed to determine if emergency services are required. An unnecessary ambulance call can be stressful and costly.',
        recommendation:
          'First, assess the situation. If the person reports severe pain, has a visible injury, has lost consciousness, or is confused, then calling an ambulance is the correct next step. Otherwise, you may be able to proceed differently.',
      },
      {
        text: 'Leave them on the floor and get a pillow and blanket.',
        isCorrect: false,
        feedback:
          'Incorrect. While providing comfort is important, your first action must be to assess for immediate danger or injury. Leaving them without assessment could delay necessary medical attention.',
        recommendation:
          'First, assess for injury. If there are no obvious severe injuries and the person is not in significant pain, making them comfortable with a pillow and blanket while you decide on the next steps (like calling for help or assisting them up) is a good secondary action.',
      },
    ],
  },
  'medication-confusion': {
    title: 'Medication Confusion',
    scenario:
      'A person with heart failure tells you they think they already took their morning pills, but you see the pillbox is still full. They seem upset and insistent.',
    condition:
      'Patient has known memory problems and takes multiple critical medications, including diuretics and beta-blockers.',
    options: [
      {
        text: 'Give them the pills from the box anyway to ensure they take them.',
        isCorrect: false,
        feedback: 'Incorrect. This could lead to a dangerous double dose if they are mistaken, potentially causing severe side effects like dangerously low blood pressure or heart rate.',
        recommendation: 'The safest approach is to de-escalate the situation and verify before administering. Do not force medications when the patient is resistant or confused.'
      },
      {
        text: 'Argue with them to prove they haven\'t taken the pills.',
        isCorrect: false,
        feedback: 'Incorrect. Arguing with a person with memory issues is counterproductive. It will only increase their agitation and damage your trusting relationship, making future care more difficult.',
        recommendation: 'Avoid confrontation. Use validation and therapeutic communication. Acknowledge their belief calmly and then gently guide them towards a safe solution, such as checking with their doctor.',
      },
      {
        text: 'Say "Okay, maybe you did. Let\'s double-check your blood pressure and call the doctor\'s office to be sure."',
        isCorrect: true,
        feedback: 'Correct. This response validates their feeling, avoids conflict, and introduces a safe verification step. It respects their autonomy while ensuring their safety.',
        recommendation: 'This is the best course of action. It combines therapeutic communication with a clinical safety check (checking vitals) and consultation with a healthcare professional, ensuring no harm is done.',
      },
      {
        text: 'Skip the medication for today to avoid a double dose.',
        isCorrect: false,
        feedback: 'Incorrect. Skipping critical heart medications can be just as dangerous as double-dosing. It can lead to worsening heart failure symptoms like fluid retention and shortness of breath.',
        recommendation: 'Never skip critical medications without consulting a doctor. The correct procedure is to verify whether the medication was taken and seek medical advice if unsure.',
      }
    ]
  },
  'sudden-shortness-of-breath': {
    title: 'Sudden Shortness of Breath',
    scenario:
      'While helping a person with COPD get dressed, they suddenly say it is very hard to breathe and their chest feels tight.',
    condition: 'Patient has a history of smoking and an irregular heartbeat. They use supplemental oxygen as needed.',
    options: [
      {
        text: 'Have them lie down flat on their back.',
        isCorrect: false,
        feedback: 'Incorrect. Lying flat can make it harder to breathe for someone with COPD or heart failure as it increases pressure on the diaphragm.',
        recommendation: 'An upright position is crucial. It allows the lungs to expand more fully and reduces the work of breathing. Always help someone who is short of breath to sit up.'
      },
      {
        text: 'Immediately call for emergency medical help (e.g., 911).',
        isCorrect: false,
        feedback: 'Incorrect. While this might be needed, it\'s not the best *first* action. Immediate comfort measures can often stabilize the situation. A premature 911 call could be unnecessary.',
        recommendation: 'First, take immediate steps to ease their breathing (sit them up, ensure oxygen is on, encourage calm breathing). If these actions do not provide rapid relief, then call for emergency help.'
      },
      {
        text: 'Tell them to take deep, fast breaths to catch their breath.',
        isCorrect: false,
        feedback: 'Incorrect. Fast, panicked breathing is counterproductive and can worsen the feeling of breathlessness and anxiety.',
        recommendation: 'The goal is to slow down their breathing to make it more efficient. Pursed-lip breathing (breathing in through the nose, and out slowly through a small "o" shape with the lips) is the recommended technique.'
      },
      {
        text: 'Help them sit upright, ensure their oxygen is on, and encourage slow, pursed-lip breathing.',
        isCorrect: true,
        feedback: 'Correct. This combination of actions directly addresses the immediate needs: an upright position helps with lung expansion, oxygen provides necessary support, and pursed-lip breathing helps calm the person and makes breathing more efficient.',
        recommendation: 'This is the standard first-line response for an acute COPD exacerbation. If symptoms do not improve quickly with these measures, emergency medical help should be called.',
      },
    ],
  },
   'hypertension-dizziness': {
    title: 'Managing Hypertension Side Effects',
    scenario: 'An 85-year-old person, who recently started a new blood pressure medication, tells you they feel dizzy every time they stand up from their chair.',
    condition: 'Patient is frail and has a history of falls.',
    options: [
      {
        text: 'Tell them this is a normal side effect and it will pass.',
        isCorrect: false,
        feedback: 'Incorrect. While dizziness can be a side effect, dismissing it is dangerous in a frail older adult. This symptom (orthostatic hypotension) is a major risk factor for falls and injury.',
        recommendation: 'Never normalize symptoms that increase fall risk. The priority is to ensure safety and communicate the issue to the healthcare provider for potential medication adjustment.'
      },
      {
        text: 'Advise them to stand up more slowly and ensure the area is clear of trip hazards.',
        isCorrect: false,
        feedback: 'Incorrect. While good advice, this is not a complete solution. It manages the symptom but does not address the root cause, which is a potentially dangerous medication side effect. It leaves the patient at ongoing risk.',
        recommendation: 'Safety measures are important, but they must be combined with medical consultation. The most critical action is to report the side effect to the doctor or nurse.'
      },
      {
        text: 'Check their blood pressure while sitting and then immediately after standing, and report the findings to their doctor.',
        isCorrect: true,
        feedback: 'Correct. This is the best course of action. It involves assessing for orthostatic hypotension, gathering objective data, and communicating it to the healthcare provider, who can make an informed decision about the medication.',
        recommendation: 'Measuring sitting and standing blood pressure provides crucial clinical information. Reporting these numbers allows the doctor to safely adjust the medication, balancing blood pressure control with fall prevention.'
      },
      {
        text: 'Suggest they stop taking the medication until they can see the doctor.',
        isCorrect: false,
        feedback: 'Incorrect. Abruptly stopping a blood pressure medication can cause a dangerous rebound in blood pressure. Medication changes should only be made by a healthcare professional.',
        recommendation: 'Never advise a patient to stop prescribed medication. The correct protocol is to report the side effect and allow the prescriber to make the necessary adjustments safely.'
      }
    ]
  },
  'polypharmacy-prescribing-cascade': {
    title: 'Spotting a Prescribing Cascade',
    scenario: 'A patient started a new blood pressure pill (a calcium channel blocker) a month ago. Today, they are complaining of new, significant swelling in their ankles. Their pill list is very long.',
    condition: 'Patient has multiple chronic conditions, including heart failure and arthritis.',
    options: [
      {
        text: 'Assume the swelling is from their heart failure and ask the doctor for a "water pill" (diuretic).',
        isCorrect: false,
        feedback: 'Incorrect. While possible, this assumption can lead to a classic prescribing cascade. Adding a diuretic to treat a medication side effect adds another drug, increases complexity, and can cause its own side effects (like dizziness or dehydration).',
        recommendation: 'When a new symptom appears after a new drug is started, always suspect the new drug first. The primary goal is to simplify, not add more medications.'
      },
      {
        text: 'Tell the patient to elevate their legs and reduce their salt intake.',
        isCorrect: false,
        feedback: 'Incorrect. This is a partial answer. While these are good general recommendations for swelling, they fail to address the likely root cause: the new medication. This could delay the correct solution.',
        recommendation: 'Lifestyle advice is helpful, but it should not replace a medication review. The most important step is to question if the new symptom is linked to a recent medication change.'
      },
      {
        text: 'Suggest they start wearing compression stockings.',
        isCorrect: false,
        feedback: 'Incorrect. This is another example of treating the symptom, not the cause. It adds another intervention and complexity to the patient\'s life without addressing the underlying medication issue.',
        recommendation: 'Avoid adding new treatments or interventions until the possibility of a medication side effect has been thoroughly investigated. The simplest solution is often to change or stop the offending drug.'
      },
      {
        text: 'Recognize this might be a side effect and ask the doctor if the new blood pressure pill could be the cause.',
        isCorrect: true,
        feedback: 'Correct. This action correctly identifies the potential for a prescribing cascade. Ankle swelling is a well-known side effect of calcium channel blockers. Questioning the new medication is the most critical and safest first step.',
        recommendation: 'This demonstrates excellent clinical judgment. Always think "medication side effect" first when a new symptom arises in a patient on multiple drugs. This prevents the prescribing cascade and leads to safer care.'
      }
    ]
  },
  'exercise-hesitancy': {
    title: 'Encouraging Safe Exercise',
    scenario: 'An older adult with osteoarthritis in their knees tells you they have stopped walking because "it hurts too much" and they are afraid of making their arthritis worse.',
    condition: 'Patient is becoming more sedentary and is at risk for deconditioning and functional decline.',
    options: [
      {
        text: 'Agree with them that they should rest their knees and avoid walking to prevent more damage.',
        isCorrect: false,
        feedback: 'Incorrect. While well-intentioned, this advice can worsen their condition. Inactivity leads to muscle weakness, increased stiffness, and more pain, creating a vicious cycle of decline.',
        recommendation: 'The principle for osteoarthritis is "motion is lotion." Rest is appropriate for an acute flare, but long-term inactivity is detrimental. The goal is to find safe ways to stay active.'
      },
      {
        text: 'Tell them to push through the pain because exercise is important.',
        isCorrect: false,
        feedback: 'Incorrect. Telling someone to "push through the pain" can lead to injury and reinforces the idea that exercise is an unpleasant or unsafe activity, reducing their motivation to continue.',
        recommendation: 'Exercise should be challenging but not cause sharp pain. Acknowledge their pain and work with them to find a comfortable starting point and alternative activities.'
      },
      {
        text: 'Suggest non-weight-bearing exercises like swimming or a stationary bike, and recommend seeing a physical therapist.',
        isCorrect: true,
        feedback: 'Correct. This is the best approach. It validates their pain while offering a practical, safe solution (non-weight-bearing exercise) and directing them to a professional (a physical therapist) who can create a tailored, safe strengthening program.',
        recommendation: 'For joint pain, focus on strengthening the muscles around the joint. A physical therapist is the ideal professional to guide this. Suggesting alternatives like aquatic exercise shows an understanding of their limitations and provides a path forward.'
      },
      {
        text: 'Advise them to just take pain medication before they walk.',
        isCorrect: false,
        feedback: 'Incorrect. While pain medication has its place, using it to simply mask pain during an activity can lead to overexertion and joint damage. It does not address the underlying issue of muscle weakness or poor biomechanics.',
        recommendation: 'The focus should be on therapeutic exercise to improve function, not just masking pain to perform an activity. A long-term solution involves strengthening and unload the joint.'
      }
    ]
  },
  'constipation-management': {
    title: 'Managing Chronic Constipation',
    scenario: 'A family caregiver calls you, frustrated. Their loved one, who is bed-bound, has not had a bowel movement in 5 days despite using a fiber supplement daily.',
    condition: 'Patient is immobile and takes opioid pain medication.',
    options: [
      {
        text: 'Advise them to double the dose of the fiber supplement to make it work better.',
        isCorrect: false,
        feedback: 'Incorrect. This is dangerous advice. In a bed-bound person, especially one on opioids, increasing fiber without adequate fluid can turn the fiber into a cement-like mass, causing a severe blockage (impaction).',
        recommendation: 'Bulking agents like fiber are inappropriate and potentially harmful for immobile patients with opioid-induced constipation. They require a different management strategy.'
      },
      {
        text: 'Tell them to try a stimulant laxative like senna or bisacodyl.',
        isCorrect: false,
        feedback: 'Incorrect. While a stimulant may be needed, it is not the correct first step. An osmotic laxative should be used first to soften the stool. Using a stimulant first could cause cramping and discomfort without resolving the underlying hard stool.',
        recommendation: 'The correct step-wise approach is to first ensure the stool is soft, then stimulate the bowel to move it. Jumping to a stimulant is not best practice.'
      },
      {
        text: 'Explain that fiber isn\'t helping and suggest they switch to a gentle osmotic laxative like polyethylene glycol (PEG).',
        isCorrect: true,
        feedback: 'Correct. This is the safest and most appropriate next step. It correctly identifies that fiber is the wrong agent for this patient and recommends the first-line osmotic laxative (PEG) to soften the stool.',
        recommendation: 'Educating the caregiver on why fiber is not working and guiding them to the correct first-line agent (an osmotic laxative) is the best clinical advice and follows the recommended step-wise approach.'
      },
      {
        text: 'Recommend they use an over-the-counter enema to clear things out quickly.',
        isCorrect: false,
        feedback: 'Incorrect. While an enema might be used for a diagnosed impaction under clinical supervision, recommending it as a first-line solution over the phone is inappropriate and can be uncomfortable and invasive for the patient.',
        recommendation: 'Enemas are a bottom-up approach and should be reserved for specific situations after a physical assessment. The preferred method is a top-down approach starting with oral osmotic laxatives.'
      }
    ]
  },
   'recognizing-delirium': {
    title: 'Recognizing a Medication Side Effect',
    scenario: 'A family caregiver calls, worried. Their mother, who was previously sharp, became suddenly confused and agitated overnight. You see she was just started on a new over-the-counter sleep aid for insomnia.',
    condition: 'Patient has mild cognitive impairment but has been stable.',
    options: [
      {
        text: 'Reassure them that this is likely just a progression of her underlying cognitive issues.',
        isCorrect: false,
        feedback: 'Incorrect. A sudden, acute change in mental status is the hallmark of delirium, not a typical dementia progression. Attributing this to her baseline condition could cause a dangerous, reversible condition to be missed.',
        recommendation: 'Always suspect delirium when there is an acute change in mental status. The key features are its acute onset and fluctuating course, which is different from the gradual decline of dementia.'
      },
      {
        text: 'Advise them to take her to the emergency room immediately for a dementia workup.',
        isCorrect: false,
        feedback: 'Incorrect. While an ER visit might become necessary, it\'s not the most efficient first step. A dementia workup is for chronic cognitive decline, not an acute change. The likely cause is the new medication.',
        recommendation: 'A focused history is the most important first step. Identifying recent changes—like a new medication—can often reveal the cause of delirium without a costly and stressful ER visit.'
      },
      {
        text: 'Ask about the new sleep aid and explain it has anticholinergic effects that can cause confusion in older adults.',
        isCorrect: true,
        feedback: 'Correct. This response correctly identifies the most likely culprit. Many OTC sleep aids contain diphenhydramine, a strong anticholinergic drug that is a common cause of delirium in older adults. This is a classic ADE presentation.',
        recommendation: 'Educating the caregiver about the risks of seemingly harmless OTC medications is a critical intervention. The first step in managing delirium is to identify and remove the offending agent.'
      },
      {
        text: 'Tell them to give another dose of the sleep aid tonight to see if it helps her calm down.',
        isCorrect: false,
        feedback: 'Incorrect. This is extremely dangerous advice that would worsen the delirium. Continuing the offending medication will only prolong and intensify the confusion and agitation.',
        recommendation: 'Once a drug is suspected of causing delirium, it should be stopped immediately (after confirming with a provider). The principle is to "stop the poison," not give more of it.'
      }
    ]
  }
};

interface SimulationPageProps {
  params: { slug: string };
}

export default function SimulationPage({ params }: SimulationPageProps) {
  const slug = params.slug;
  const simData = simulationsData[slug];

  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  if (!simData) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <h1 className="text-3xl font-bold font-headline">Simulation Not Found</h1>
        <p className="text-muted-foreground">The simulation you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/simulations">Back to Simulations</Link>
        </Button>
      </div>
    );
  }

  const handleActionSubmit = (option: Option) => {
    setSelectedOption(option);
    setIsAnswered(true);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsAnswered(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="outline" asChild>
        <Link href="/simulations">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Simulations
        </Link>
      </Button>

      <h1 className="text-3xl font-bold font-headline">{simData.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Underlying Conditions</CardTitle>
          <CardDescription>Keep these factors in mind as you make decisions.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{simData.condition}</p>
        </CardContent>
      </Card>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{simData.scenario}</p>
        </CardContent>
      </Card>

      {!isAnswered && (
        <Card>
          <CardHeader>
            <CardTitle>What do you do?</CardTitle>
            <CardDescription>
              Choose the best action from the options below.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {simData.options.map((option) => (
              <Button
                key={option.text}
                variant="outline"
                className="h-auto whitespace-normal py-4 text-left justify-start"
                onClick={() => handleActionSubmit(option)}
              >
                {option.text}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {isAnswered && selectedOption && (
        <Card>
            <CardHeader>
                <CardTitle>Your Answer</CardTitle>
                 <Alert variant={selectedOption.isCorrect ? 'default' : 'destructive'} className={cn(selectedOption.isCorrect && "border-green-500/50 bg-green-500/10")}>
                    {selectedOption.isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle className={cn(selectedOption.isCorrect && "text-green-400")}>
                        {selectedOption.isCorrect ? 'Correct' : 'Incorrect'}
                    </AlertTitle>
                    <AlertDescription className={cn(selectedOption.isCorrect && "text-green-400/80")}>
                        Your choice: "{selectedOption.text}"
                    </AlertDescription>
                 </Alert>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Feedback</AlertTitle>
                <AlertDescription>{selectedOption.feedback}</AlertDescription>
              </Alert>

              <Alert variant="default" className="border-blue-500/50 bg-blue-500/10 text-primary-foreground">
                <Target className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-400">Recommendation</AlertTitle>
                <AlertDescription className="text-blue-400/80">{selectedOption.recommendation}</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={handleReset}>Try Again</Button>
                <Button asChild>
                    <Link href="/simulations">
                        Choose Another Simulation <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
