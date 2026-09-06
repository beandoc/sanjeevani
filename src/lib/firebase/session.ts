'use client';

import type { User } from 'firebase/auth';

export async function createSession(user: User): Promise<void> {
  try {
    const idToken = await user.getIdToken(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      console.warn('Session endpoint returned non-200, continuing with client session.');
    }
  } catch (err) {
    console.warn('Session cookie establishment notice (client session active):', err);
  }
}

export async function clearSession(): Promise<void> {
  try {
    await fetch('/api/auth/session', { method: 'DELETE' });
  } catch {}
}

