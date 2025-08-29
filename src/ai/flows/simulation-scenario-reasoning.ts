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
  scenarioUpdate: z
    .string()
    .describe('An updated description of the scenario, including any complications or changes in patient condition.'),
  llmReasoning: z
    .string()
    .optional()
    .describe('The LLM reasoning behind the updated scenario and complications.'),
});
export type SimulationScenarioOutput = z.infer<typeof SimulationScenarioOutputSchema>;

export async function simulateScenario(input: SimulationScenarioInput): Promise<SimulationScenarioOutput> {
  return simulationScenarioFlow(input);
}

const scenarioReasoningPrompt = ai.definePrompt({
  name: 'scenarioReasoningPrompt',
  input: {schema: SimulationScenarioInputSchema},
  output: {schema: SimulationScenarioOutputSchema},
  prompt: `You are simulating a care scenario for an elderly patient. The caregiver has provided the following initial scenario and their action:

Initial Scenario: {{{scenarioDescription}}}
Caregiver Action: {{{caregiverAction}}}

Based on the caregiver's action, determine if any complications or changes in the patient's condition should arise.  Provide an updated scenario description, incorporating these changes. Explain your reasoning for the changes in the llmReasoning field. If the patient condition is available, take it into account when determining complications.

Patient Condition: {{{patientCondition}}}
Updated Scenario Description:`, //Ensure the updated description continues the scenario from the caregiver's perspective
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
