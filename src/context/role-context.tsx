'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'caregiver' | 'professional';

type RoleContextType = {
  role: Role;
  setRole: (role: Role) => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('caregiver');

  return (
    <RoleContext.Provider value={{ role, setRole: setRole as (role: Role) => void }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
