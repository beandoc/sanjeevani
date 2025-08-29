
import {
  generatePersonalizedPath,
  type PersonalizedPathInput,
} from '@/ai/flows/personalized-learning-path';
import { NextResponse } from 'next/server';

// This route is no longer used by the dashboard but can be kept for other potential uses.
export async function GET() {
  const personalizedPathInput: PersonalizedPathInput = {
    skillLevel: 'intermediate',
    performanceHistory: [
      { moduleId: 'dementia-care', score: 75, timeSpent: 120 },
      { moduleId: 'heart-failure-management', score: 40, timeSpent: 90 },
    ],
    caregivingScenario:
      'Caring for an elderly person who recently had a stroke and needs help with moving around and seems a little confused.',
  };

  try {
    const personalizedPath = await generatePersonalizedPath(personalizedPathInput);
    return NextResponse.json(personalizedPath);
  } catch (error) {
    console.error('Error fetching personalized path:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
