'use client';

import type { User } from 'firebase/auth';

export async function createSession(user: User): Promise<void> {
  const idToken = await user.getIdToken(true);
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  if (!response.ok) throw new Error('Could not establish a secure session.');
}

export async function clearSession(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' });
}
