'use client';

/**
 * SyncStatusBanner
 *
 * A slim, dismissible banner shown to unauthenticated users on high-value
 * pages (dashboard, stress-calculator, vital-logs) to make the local-only
 * storage behaviour explicit rather than invisible.
 *
 * Design decisions:
 *  - Shown only when auth is fully resolved AND the user is signed out.
 *    The isLoading guard prevents a flash of the banner during the initial
 *    auth state check (which takes ~200ms on first load).
 *  - Not shown if Firebase is unconfigured (no apiKey in env) — the app is
 *    running in a fully offline/demo environment where signing in is not
 *    possible at all, so the nudge would be misleading.
 *  - Dismissible per session (sessionStorage) so it doesn't nag on every
 *    navigation within the same session.
 */

import { useState, useEffect } from 'react';
import { CloudOff, X, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuthUser } from '@/hooks/use-auth-user';

const DISMISSED_KEY = 'sanjeevani_sync_banner_dismissed';

function isFirebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

export function SyncStatusBanner() {
  const { user, isLoading } = useAuthUser();
  const [dismissed, setDismissed] = useState(true); // start dismissed to avoid SSR flash

  useEffect(() => {
    // Read dismissal state after hydration (sessionStorage not available on server)
    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY) === 'true';
    setDismissed(wasDismissed);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  // Don't render if: loading, signed in, dismissed, or Firebase not configured
  if (isLoading || user || dismissed || !isFirebaseConfigured()) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs"
    >
      <CloudOff className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-amber-900 dark:text-amber-300 leading-snug">
        <span className="font-bold">Data is saved on this device only.</span>{' '}
        Sign in to back up your records to the cloud and share them with your care team.
      </p>
      <Link
        href="/login"
        className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-semibold transition-colors"
        aria-label="Sign in to sync your data"
      >
        <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
        Sign in
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-md text-amber-600 hover:bg-amber-500/20 transition-colors"
        aria-label="Dismiss sync status notice"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
