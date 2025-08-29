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
  return simulationScenarioFlow(input);
}

const scenarioReasoningPrompt = ai.definePrompt({
  name: 'scenarioReasoningPrompt',
  input: {schema: SimulationScenarioInputSchema},
  output: {schema: SimulationScenarioOutputSchema},
  prompt: `You are a medical simulation AI for training caregivers. Your role is to create a realistic, evolving scenario and provide educational feedback.

  Current Scenario:
  "{{{scenarioDescription}}}"

  Patient's underlying conditions:
  "{{{patientCondition}}}"

  The caregiver chose the following action:
  "{{{caregiverAction}}}"

  Based on the caregiver's action, you must do the following:
  1.  **Provide Feedback**: In the 'feedback' field, evaluate the caregiver's action. Was it the best choice? Was it dangerous? Explain the immediate consequences and reasoning in a clear, concise, and educational manner.
  2.  **Give a Recommendation**: In the 'recommendation' field, state what the best practice or optimal first step would have been in this situation.
  3.  **Update the Scenario**: In the 'scenarioUpdate' field, describe the outcome of the caregiver's action. What happens next? How does the patient's condition change? Make it a logical progression of the story.
  4.  **Generate Next Options**: In the 'nextOptions' field, provide 3-4 distinct, plausible multiple-choice options for the caregiver's next action based on the *new* scenario update. One option should be clearly the best choice, while others should be plausible but less ideal or incorrect.`,
});

const simulationScenarioFlow = ai.defineFlow(
  {
    name: 'simulationScenarioFlow',
    inputSchema: SimulationScenarioInputSchema,
    outputSchema: SimulationScenarioOutputSchema,
  },
  async input => {
    const {output} = await scenarioReasoningPrompt(input);
    return output!;
  }
);
