'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'caregiver' | 'professional';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

type ProfileContextType = {
  role: Role;
  setRole: (role: Role) => void;
  skillLevel: SkillLevel;
  setSkillLevel: (level: SkillLevel) => void;
  caregivingScenario: string;
  setCaregivingScenario: (scenario: string) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('caregiver');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [caregivingScenario, setCaregivingScenario] = useState('General Frailty');

  return (
    <ProfileContext.Provider
      value={{
        role,
        setRole: setRole as (role: Role) => void,
        skillLevel,
        setSkillLevel: setSkillLevel as (level: SkillLevel) => void,
        caregivingScenario,
        setCaregivingScenario,
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
