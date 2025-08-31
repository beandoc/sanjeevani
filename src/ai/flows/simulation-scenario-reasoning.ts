
'use server';

/**
 * @fileOverview Implements the Simulation Scenario Reasoning flow for caregiver training.
 *
 * - `simulateScenario` function - Handles the simulation scenario, incorporating complications based on caregiver actions.
 * - `SimulationScenarioInput` interface - Defines the input schema for the `simulateScenario` function.
 * - `SimulationScenarioOutput` interface - Defines the output schema for the `simulateScenario` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulationScenarioInputSchema = z.object({
  scenarioDescription: z
    .string()
    .describe('A description of the initial care scenario for the elderly patient.'),
  caregiverAction: z
    .string()
    .describe('The action taken by the caregiver in the simulation.'),
  patientCondition: z
    .string()
    .optional()
    .describe('Current condition of the patient.'),
});
export type SimulationScenarioInput = z.infer<typeof SimulationScenarioInputSchema>;

const SimulationScenarioOutputSchema = z.object({
  feedback: z
    .string()
    .describe('Feedback on the caregiver\'s action, explaining if it was correct or incorrect and why.'),
  recommendation: z
    .string()
    .describe('A clear recommendation for the best course of action in the given scenario.'),
  scenarioUpdate: z
    .string()
    .describe('An updated description of the scenario, including any complications or changes in patient condition resulting from the action.'),
  nextOptions: z
    .array(z.string())
    .describe('A list of 3-4 multiple-choice options for the next action the caregiver should take.'),
});
export type SimulationScenarioOutput = z.infer<typeof SimulationScenarioOutputSchema>;

export async function simulateScenario(input: SimulationScenarioInput): Promise<SimulationScenarioOutput> {
  try {
    const {output} = await simulationScenarioFlow(input);
    return output!;
  } catch (error) {
    console.error("Error in simulateScenario flow:", error);
    // Return a valid, structured error response to prevent crashes
    return {
      feedback: 'An error occurred while processing the simulation. The AI model may be unavailable.',
      recommendation: 'Please try a different simulation or check back later.',
      scenarioUpdate: 'The current scenario cannot be continued due to an internal error.',
      nextOptions: ['Go back to simulations list'],
    };
  }
}

const prompt = ai.definePrompt({
    name: 'simulationScenarioPrompt',
    input: { schema: SimulationScenarioInputSchema },
    output: { schema: SimulationScenarioOutputSchema },
    prompt: `You are an AI educator for eldercare caregivers. Your role is to create realistic simulation scenarios.

    The user will provide a scenario, their chosen action, and the patient's underlying condition.

    Your tasks are:
    1.  **Analyze the Action:** Evaluate the caregiver's action. Was it appropriate? Safe? What are the immediate consequences?
    2.  **Provide Feedback:** Give clear, constructive feedback on why the action was correct or incorrect.
    3.  **Give a Recommendation:** State the single best course of action.
    4.  **Update the Scenario:** Describe how the situation evolves based on the caregiver's action. Introduce a realistic complication if the action was incorrect or risky.
    5.  **Generate Next Steps:** Provide 3-4 plausible multiple-choice options for the caregiver's next action in the updated scenario.

    **Scenario Context:**
    - Initial Scenario: {{{scenarioDescription}}}
    - Patient's Condition: {{{patientCondition}}}
    - Caregiver's Action: {{{caregiverAction}}}
    `,
});

const simulationScenarioFlow = ai.defineFlow(
  {
    name: 'simulationScenarioFlow',
    inputSchema: SimulationScenarioInputSchema,
    outputSchema: SimulationScenarioOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
