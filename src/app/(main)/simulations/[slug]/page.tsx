
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
import { Lightbulb, Target, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
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
};

export default function SimulationPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
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
            {simData.options.map((option, index) => (
              <Button
                key={index}
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
