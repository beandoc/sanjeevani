'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Root Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-destructive uppercase">
            Application Exception
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-headline">
            Something went wrong
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this interface. Your saved health data remains secure on your device.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button onClick={() => reset()} className="w-full sm:w-auto gap-2 font-bold text-xs">
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2 text-xs font-semibold">
              <Home className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
