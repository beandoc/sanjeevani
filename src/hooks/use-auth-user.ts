'use client';

import { useEffect, useState } from 'react';
import { subscribeToAuthState, type User } from '@/lib/firebase/auth';

export interface AuthUserState {
  user: User | null;
  isLoading: boolean;
}

/** Tracks the current Firebase Auth user. Never redirects or gates access —
 * callers decide what to do with a null user (this app keeps routes open
 * during testing; see role-context and the login page). */
export function useAuthUser(): AuthUserState {
  const [state, setState] = useState<AuthUserState>({ user: null, isLoading: true });

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setState({ user, isLoading: false });
    });
    return unsubscribe;
  }, []);

  return state;
}
