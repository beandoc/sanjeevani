
'use server';

/**
 * @fileOverview Adapts the learning path to the caregiver's skill level, focusing on areas needing improvement.
 *
 * - generatePersonalizedPath - A function that generates a personalized learning path.
 * - PersonalizedPathInput - The input type for the generatePersonalizedPath function.
 * - PersonalizedPathOutput - The return type for the generatePersonalizedPath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SkillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);

const ModulePerformanceSchema = z.object({
  moduleId: z.string().describe('Unique identifier for the module.'),
  score: z.number().min(0).max(100).describe('The score achieved in the module (0-100).'),
  timeSpent: z.number().describe('Time spent on the module in minutes.'),
});

export type ModulePerformance = z.infer<typeof ModulePerformanceSchema>;

const PersonalizedPathInputSchema = z.object({
  skillLevel: SkillLevelSchema.describe('The caregiver\'s self-assessed skill level.'),
  performanceHistory: z.array(ModulePerformanceSchema).describe('History of module performance.'),
  caregivingScenario: z.string().describe('Description of the current caregiving scenario or patient condition.'),
});
export type PersonalizedPathInput = z.infer<typeof PersonalizedPathInputSchema>;

const LearningModuleSchema = z.object({
  moduleId: z.string().describe('Unique identifier for the module.'),
  title: z.string().describe('Title of the learning module.'),
  description: z.string().describe('Description of the module content.'),
  estimatedDuration: z.number().describe('Estimated time to complete the module in minutes.'),
  topic: z.string().describe('The organ system or condition covered in the module (e.g., dementia, heart failure).'),
  focusArea: z.string().describe('Specific skill or knowledge area addressed by the module (e.g., medication management, mobility assistance).'),
});

const PersonalizedPathOutputSchema = z.object({
  suggestedModules: z.array(LearningModuleSchema).describe('List of suggested learning modules tailored to the caregiver.'),
  reasoning: z.string().describe('Explanation of why these modules were suggested.'),
});
export type PersonalizedPathOutput = z.infer<typeof PersonalizedPathOutputSchema>;

export async function generatePersonalizedPath(input: PersonalizedPathInput): Promise<PersonalizedPathOutput> {
  return personalizedLearningPathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedLearningPathPrompt',
  input: {schema: PersonalizedPathInputSchema},
  output: {schema: PersonalizedPathOutputSchema},
  prompt: `You are an AI learning path generator for eldercare caregivers.

  Based on the caregiver's self-assessed skill level ({{skillLevel}}), their past performance in modules ({{#each performanceHistory}}Module {{moduleId}}: Score={{score}}, Time Spent={{timeSpent}} minutes. {{/each}}), and the current caregiving scenario ({{caregivingScenario}}), recommend a personalized learning path consisting of modules that address their specific needs and areas for improvement.

  Consider the following factors when recommending modules:
  - Skill Level: Match the module difficulty to the caregiver's skill level.
  - Performance History: Identify areas where the caregiver has struggled or spent a significant amount of time.
  - Caregiving Scenario: Prioritize modules that are directly relevant to the current scenario.

  Available Modules:
  - Dementia Care Module (moduleId: 'dementia-care'): Covers techniques for communicating with and caring for individuals with dementia, including managing behavioral symptoms, creating a safe environment, and providing cognitive stimulation.
  - Stroke Rehabilitation Module (moduleId: 'stroke-rehab'): Addresses the principles of stroke rehabilitation, including mobility assistance, speech therapy exercises, and strategies for preventing complications.
  - Heart Failure Management Module (moduleId: 'heart-failure'): Focuses on the management of heart failure in elderly patients, including medication adherence, fluid balance monitoring, and lifestyle modifications.
  - Bed Bound Patient Care Module (moduleId: 'bed-bound-care'): Covers essential aspects of caring for bed-bound patients, including pressure ulcer prevention, hygiene, and mobility assistance.
  - Parkinsonism Care Module (moduleId: 'parkinsonism-care'): Provides guidance on managing Parkinson's symptoms, including medication management, mobility support, and strategies for addressing motor and non-motor symptoms.
  - Fall Prevention Module (moduleId: 'fall-prevention'): Teaches how to identify risks and create a safe environment to prevent falls.
  - Palliative Care for Caregivers Module (moduleId: 'palliative-care-caregiver'): A compassionate guide to understanding and navigating palliative care for a loved one.
  - Geriatric Rehabilitation Module (moduleId: 'geriatric-rehabilitation'): Understand the interventions that help restore function and independence in older adults.
  - Strength Training for Health Module (moduleId: 'strength-training'): Learn the principles and benefits of strength training for older adults.
  - Palliative Care for Professionals Module (moduleId: 'palliative-care-professional'): An evidence-based overview of geriatric palliative care principles and practice for clinicians.
  - Geriatric Depression in Primary Care Module (moduleId: 'geriatric-depression-professional'): A review of the detection and management of depression in older adults for primary care providers.


  Return the 'suggestedModules' as a list of modules best suited for the caregiver given their current situation.
  Explain your reasoning for selecting the modules in the 'reasoning' field.
  Module descriptions should contain the 'moduleId', 'title', 'description', 'estimatedDuration' and 'topic' of each module, and 'focusArea'.
  `,
});

const personalizedLearningPathFlow = ai.defineFlow(
  {
    name: 'personalizedLearningPathFlow',
    inputSchema: PersonalizedPathInputSchema,
    outputSchema: PersonalizedPathOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        return output!;
    } catch (error) {
        console.error("Error in personalizedLearningPathFlow: ", error);
        // Return a valid, empty structure on error to prevent crashes downstream.
        return { suggestedModules: [], reasoning: "We encountered an error generating your personalized path. Please try again later." };
    }
  }
);

