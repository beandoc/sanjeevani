'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { HealthRepository, ModuleSectionProgress } from '@/lib/db/health-repository';

export type Role = 'caregiver' | 'nurse' | 'doctor' | 'professional';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type ModuleProgressMap = {
  [moduleId: string]: {
    completedSections: string[];
    lastAccessedAt: string;
  };
};

type ProfileContextType = {
  role: Role;
  setRole: (role: Role) => void;
  skillLevel: SkillLevel;
  setSkillLevel: (level: SkillLevel) => void;
  caregivingScenario: string;
  setCaregivingScenario: (scenario: string) => void;
  isOnboardingCompleted: boolean;
  completeOnboarding: () => void;
  moduleProgress: { [moduleId: string]: number }; // percentage map for UI compatibility
  moduleSectionMap: ModuleProgressMap;
  updateModuleProgress: (moduleId: string, progress: number, sectionId?: string | number) => void;
  toggleSection: (moduleId: string, sectionId: string | number) => string[];
  isSectionCompleted: (moduleId: string, sectionId: string | number) => boolean;
  getCompletedSections: (moduleId: string) => string[];
  getModuleProgress: (moduleId: string, totalSections?: number) => number;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>('caregiver');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [caregivingScenario, setCaregivingScenario] = useState('General Frailty');
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(true);
  const [moduleSectionMap, setModuleSectionMap] = useState<ModuleProgressMap>({});
  const [modulePercentages, setModulePercentages] = useState<{ [moduleId: string]: number }>({});

  useEffect(() => {
    // Load stored role and onboarding status
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('sanjeevani_user_role') as Role | null;
      if (storedRole) {
        setRoleState(storedRole);
      }
      const onboarded = localStorage.getItem('sanjeevani_onboarding_done');
      setIsOnboardingCompleted(onboarded === 'true');
    }

    // Load from HealthRepository
    const stored = HealthRepository.getModuleProgressMap();
    setModuleSectionMap(stored);

    // Compute initial percentages
    const percentages: { [moduleId: string]: number } = {};
    for (const [modId, data] of Object.entries(stored)) {
      percentages[modId] = Math.min(100, Math.round((data.completedSections.length / 4) * 100));
    }
    setModulePercentages(percentages);
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sanjeevani_user_role', newRole);
    }
  };

  const completeOnboarding = () => {
    setIsOnboardingCompleted(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sanjeevani_onboarding_done', 'true');
    }
  };

  const toggleSection = useCallback((moduleId: string, sectionId: string | number): string[] => {
    const secStr = String(sectionId);
    const updatedSections = HealthRepository.toggleSectionCompletion(moduleId, secStr);
    
    setModuleSectionMap((prev) => ({
      ...prev,
      [moduleId]: {
        moduleId,
        completedSections: updatedSections,
        lastAccessedAt: new Date().toISOString()
      }
    }));

    const pct = Math.min(100, Math.round((updatedSections.length / 4) * 100));
    setModulePercentages((prev) => ({ ...prev, [moduleId]: pct }));
    return updatedSections;
  }, []);

  const isSectionCompleted = useCallback((moduleId: string, sectionId: string | number): boolean => {
    const secStr = String(sectionId);
    const sections = moduleSectionMap[moduleId]?.completedSections || [];
    return sections.includes(secStr);
  }, [moduleSectionMap]);

  const getCompletedSections = useCallback((moduleId: string): string[] => {
    return moduleSectionMap[moduleId]?.completedSections || [];
  }, [moduleSectionMap]);

  const updateModuleProgress = useCallback((moduleId: string, progress: number, sectionId?: string | number) => {
    if (sectionId !== undefined) {
      toggleSection(moduleId, sectionId);
    } else {
      setModulePercentages((prev) => ({
        ...prev,
        [moduleId]: Math.min(100, Math.round(progress))
      }));
    }
  }, [toggleSection]);

  const getModuleProgress = useCallback((moduleId: string, totalSections: number = 4): number => {
    const sections = moduleSectionMap[moduleId]?.completedSections;
    if (sections && totalSections > 0) {
      return Math.min(100, Math.round((sections.length / totalSections) * 100));
    }
    return modulePercentages[moduleId] || 0;
  }, [moduleSectionMap, modulePercentages]);

  return (
    <ProfileContext.Provider
      value={{
        role,
        setRole,
        skillLevel,
        setSkillLevel,
        caregivingScenario,
        setCaregivingScenario,
        isOnboardingCompleted,
        completeOnboarding,
        moduleProgress: modulePercentages,
        moduleSectionMap,
        updateModuleProgress,
        toggleSection,
        isSectionCompleted,
        getCompletedSections,
        getModuleProgress,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a RoleProvider');
  }
  return context;
}
