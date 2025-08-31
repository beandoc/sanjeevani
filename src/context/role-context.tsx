
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Role = 'caregiver' | 'professional';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

type ModuleProgress = {
  [moduleId: string]: number; // progress percentage
};

type ProfileContextType = {
  role: Role;
  setRole: (role: Role) => void;
  skillLevel: SkillLevel;
  setSkillLevel: (level: SkillLevel) => void;
  caregivingScenario: string;
  setCaregivingScenario: (scenario: string) => void;
  moduleProgress: ModuleProgress;
  updateModuleProgress: (moduleId: string, progress: number) => void;
  getModuleProgress: (moduleId: string) => number;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('caregiver');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [caregivingScenario, setCaregivingScenario] = useState('General Frailty');
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress>({});

  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('moduleProgress');
      if (savedProgress) {
        setModuleProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error("Failed to parse module progress from localStorage", error);
    }
  }, []);

  const updateModuleProgress = (moduleId: string, progress: number) => {
    setModuleProgress(prevProgress => {
      const newProgress = { ...prevProgress, [moduleId]: Math.min(progress, 100) };
      try {
        localStorage.setItem('moduleProgress', JSON.stringify(newProgress));
      } catch (error) {
        console.error("Failed to save module progress to localStorage", error);
      }
      return newProgress;
    });
  };

  const getModuleProgress = (moduleId: string): number => {
    return moduleProgress[moduleId] || 0;
  };

  return (
    <ProfileContext.Provider
      value={{
        role,
        setRole: setRole as (role: Role) => void,
        skillLevel,
        setSkillLevel: setSkillLevel as (level: SkillLevel) => void,
        caregivingScenario,
        setCaregivingScenario,
        moduleProgress,
        updateModuleProgress,
        getModuleProgress,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a RoleProvider');
  }
  return context;
}
