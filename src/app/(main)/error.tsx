'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Module Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold font-headline">Clinical Module Load Error</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The requested module could not finish rendering. Try refreshing the view.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => reset()} size="sm" className="gap-1.5 font-bold text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Module</span>
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
