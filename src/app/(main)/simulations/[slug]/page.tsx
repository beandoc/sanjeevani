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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { simulateScenario } from '@/ai/flows/simulation-scenario-reasoning';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const simulationsData: {
  [key: string]: { title: string; scenario: string; condition: string };
} = {
  'managing-a-fall': {
    title: 'Managing a Fall',
    scenario:
      'You enter the living room and find an elderly person on the floor next to a chair. They are awake and seem worried.',
    condition: 'Patient has a history of weak bones and is on blood thinners.',
  },
  'medication-confusion': {
    title: 'Medication Confusion',
    scenario:
      'A person with heart failure tells you they think they already took their morning pills, but you see the pillbox is still full. They seem upset.',
    condition:
      'Patient has known memory problems and takes many different medicines.',
  },
  'sudden-shortness-of-breath': {
    title: 'Sudden Shortness of Breath',
    scenario:
      'While helping a person get dressed, they suddenly say it is very hard to breathe and their chest feels tight. They have a history of breathing problems (COPD).',
    condition: 'Patient has a history of smoking and an irregular heartbeat.',
  },
};

type HistoryItem = {
  type: 'caregiver' | 'system';
  content: string;
  reasoning?: string;
};

export default function SimulationPage({ params: { slug } }: { params: { slug: string } }) {
  const simData = simulationsData[slug] || {
    title: 'Simulation',
    scenario: 'Scenario not found.',
    condition: '',
  };
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'system', content: simData.scenario },
  ]);
  const [action, setAction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim() || isLoading) return;

    setIsLoading(true);
    const currentHistory = [...history, { type: 'caregiver', content: action }];
    setHistory(currentHistory);
    setAction('');

    try {
      const lastSystemMessage = currentHistory
        .filter((h) => h.type === 'system')
        .pop();

      const result = await simulateScenario({
        scenarioDescription: lastSystemMessage?.content || simData.scenario,
        caregiverAction: action,
        patientCondition: simData.condition,
      });

      setHistory((prev) => [
        ...prev,
        {
          type: 'system',
          content: result.scenarioUpdate,
          reasoning: result.llmReasoning,
        },
      ]);
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        variant: 'destructive',
        title: 'Simulation Error',
        description: 'Could not get a response from the simulation. Please try again.',
      });
      setHistory(history);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold font-headline">{simData.title}</h1>
      <div className="space-y-4">
        {history.map((item, index) =>
          item.type === 'system' ? (
            <Card key={index}>
              <CardHeader>
                <CardTitle>Scenario Update</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.content}</p>
                {item.reasoning && (
                  <Alert className="mt-4">
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>AI Reasoning</AlertTitle>
                    <AlertDescription>{item.reasoning}</AlertDescription>
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

      <Card>
        <form onSubmit={handleActionSubmit}>
          <CardHeader>
            <CardTitle>What do you do next?</CardTitle>
            <CardDescription>
              Describe the action you would take in this situation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="action" className="sr-only">
              Your Action
            </Label>
            <Textarea
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g., 'I will first check if the person is responsive and check for any visible injuries...'"
              rows={4}
              disabled={isLoading}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !action.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                'Submit Action'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
