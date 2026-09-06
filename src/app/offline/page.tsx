import { WifiOff } from 'lucide-react';

export const metadata = {
  title: 'Offline — Sanjeevani'
};

/**
 * Service-worker offline fallback (see public/sw.js). Served entirely from
 * the SW's precache when a navigation request fails with no network — this
 * page must never depend on live data, auth state, or any component that
 * makes its own network/Firestore calls, unlike every other route in the
 * app. Intentionally outside the (main) route group so it renders without
 * the sidebar/header shell.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <WifiOff className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground">You&apos;re offline</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This page needs an internet connection to load. Reconnect and try again — anything you
          logged while offline in an already-open screen is saved on this device and will sync
          automatically.
        </p>
        <p className="text-xs text-muted-foreground pt-2 border-t border-border/60">
          Medical emergency? Call Elder Line <strong>14567</strong> or <strong>112</strong> directly —
          this does not need the app or an internet connection.
        </p>
      </div>
    </div>
  );
}
