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
import { simulateScenario, SimulationScenarioOutput } from '@/ai/flows/simulation-scenario-reasoning';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Loader2, CheckCircle, XCircle, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const simulationsData: {
  [key: string]: {
    title: string;
    scenario: string;
    condition: string;
    initialOptions: string[];
  };
} = {
  'managing-a-fall': {
    title: 'Managing a Fall',
    scenario:
      'You enter the living room and find an elderly person on the floor next to a chair. They are awake and seem worried.',
    condition: 'Patient has a history of osteoporosis and is on blood thinners.',
    initialOptions: [
      'Help the person stand up immediately.',
      'Ask the person if they are in pain and look for obvious injuries.',
      'Call for an ambulance right away.',
      'Leave them on the floor and get a pillow and blanket.',
    ],
  },
  'medication-confusion': {
    title: 'Medication Confusion',
    scenario:
      'A person with heart failure tells you they think they already took their morning pills, but you see the pillbox is still full. They seem upset and insistent.',
    condition:
      'Patient has known memory problems and takes multiple critical medications, including diuretics and beta-blockers.',
    initialOptions: [
      'Give them the pills from the box anyway to ensure they take them.',
      'Argue with them to prove they haven\'t taken the pills.',
      'Say "Okay, maybe you did. Let\'s double-check your blood pressure and call the doctor\'s office to be sure."',
      'Skip the medication for today to avoid a double dose.',
    ],
  },
  'sudden-shortness-of-breath': {
    title: 'Sudden Shortness of Breath',
    scenario:
      'While helping a person with COPD get dressed, they suddenly say it is very hard to breathe and their chest feels tight.',
    condition: 'Patient has a history of smoking and an irregular heartbeat. They use supplemental oxygen as needed.',
    initialOptions: [
      'Have them lie down flat on their back.',
      'Immediately call for emergency medical help (e.g., 911).',
      'Tell them to take deep, fast breaths to catch their breath.',
      'Help them sit upright, ensure their oxygen is on, and encourage slow, pursed-lip breathing.',
    ],
  },
};

type HistoryItem = {
  type: 'caregiver' | 'system';
  content: string;
  feedback?: string;
  recommendation?: string;
};


export default function SimulationPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const simData = simulationsData[slug] || {
    title: 'Simulation',
    scenario: 'Scenario not found.',
    condition: '',
    initialOptions: [],
  };

  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'system', content: simData.scenario },
  ]);
  const [options, setOptions] = useState<string[]>(simData.initialOptions);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const { toast } = useToast();

  const handleActionSubmit = async (action: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setSelectedAction(action);
    const currentHistory = [...history, { type: 'caregiver', content: action }];
    setHistory(currentHistory);
    setOptions([]);

    try {
      const lastSystemMessage = history.filter((h) => h.type === 'system').pop();

      const result: SimulationScenarioOutput = await simulateScenario({
        scenarioDescription: lastSystemMessage?.content || simData.scenario,
        caregiverAction: action,
        patientCondition: simData.condition,
      });

      setHistory((prev) => [
        ...prev,
        {
          type: 'system',
          content: result.scenarioUpdate,
          feedback: result.feedback,
          recommendation: result.recommendation,
        },
      ]);
      setOptions(result.nextOptions);
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        variant: 'destructive',
        title: 'Simulation Error',
        description: 'Could not get a response from the simulation. Please try again.',
      });
      // Rollback UI state on error
      setHistory(history);
      setOptions(options);
    } finally {
      setIsLoading(false);
      setSelectedAction(null);
    }
  };

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
      
      <div className="space-y-4">
        {history.map((item, index) =>
          item.type === 'system' ? (
            <Card key={index} className="bg-background">
              <CardHeader>
                <CardTitle>Scenario Update</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{item.content}</p>
                {item.feedback && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Feedback on Your Action</AlertTitle>
                    <AlertDescription>{item.feedback}</AlertDescription>
                  </Alert>
                )}
                 {item.recommendation && (
                  <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-primary-foreground">
                    <Target className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-400">Recommendation</AlertTitle>
                    <AlertDescription className="text-green-400/80">{item.recommendation}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card key={index} className="bg-secondary">
              <CardHeader>
                <CardTitle>Your Action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary-foreground">{item.content}</p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {options.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>What do you do next?</CardTitle>
            <CardDescription>
              Choose the best action from the options below.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto whitespace-normal py-4"
                onClick={() => handleActionSubmit(option)}
                disabled={isLoading}
              >
                {isLoading && selectedAction === option ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {option}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {isLoading && !options.length && (
         <div className="flex justify-center items-center p-8">
            <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">AI is thinking...</p>
         </div>
      )}
    </div>
  );
}
