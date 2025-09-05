// src/lib/learning-paths.ts

import { allModules } from './modules';

// Function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const getPersonalizedPath = (skillLevel: string, caregivingScenario: string) => {
  // Mock logic: return a random selection of modules
  const suggestedModules = shuffleArray(allModules).slice(0, 3);
  
  const modulesWithFocusArea = suggestedModules.map(module => ({
    ...module,
    focusArea: caregivingScenario
  }));

  return {
    suggestedModules: modulesWithFocusArea,
    reasoning: `Based on your profile, we've selected these modules for you to explore. They change periodically!`
  };
};
