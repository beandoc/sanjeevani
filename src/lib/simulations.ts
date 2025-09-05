// src/lib/simulations.ts

import { z } from 'zod';

export const simulationSchema = z.object({
  id: z.string(),
  scenario: z.string(),
  options: z.array(z.string()),
  feedback: z.record(z.string()),
  recommendation: z.string(),
});

export type Simulation = z.infer<typeof simulationSchema>;

export const simulations: Simulation[] = [
  {
    id: 'managing-a-fall',
    scenario:
      'You are assisting Mr. Smith, an 85-year-old with osteoporosis, when he loses his balance and falls to the floor. He is conscious but seems disoriented. What is your immediate next step?',
    options: [
      'Immediately help him stand up.',
      'Check for any visible injuries and ask if he is in pain.',
      'Call for an ambulance right away.',
      'Leave him lying down and wait for a family member to arrive.',
    ],
    feedback: {
      'Immediately help him stand up.':
        'This is not the recommended action. Helping him stand up immediately could worsen his injuries if he has a fracture.',
      'Check for any visible injuries and ask if he is in pain.':
        'This is the correct action. It is crucial to assess the situation and check for injuries before attempting to move him.',
      'Call for an ambulance right away.':
        'While calling for help is important, an immediate ambulance might not be necessary. You should first assess his condition.',
      'Leave him lying down and wait for a family member to arrive.':
        'This is an incorrect action. Leaving him unattended for an extended period is unsafe.',
    },
    recommendation:
      'Always check for injuries and assess the situation before moving a patient who has fallen.',
  },
  // Add more simulation scenarios here
];

export function getSimulation(id: string) {
  return simulations.find((s) => s.id === id);
}
