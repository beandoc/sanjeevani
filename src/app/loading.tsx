import React from 'react';
import { HeartPulse } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
            <HeartPulse className="w-6 h-6 animate-bounce" />
          </div>
        </div>
        <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
          Loading Kutumbh...
        </p>
      </div>
    </div>
  );
}
