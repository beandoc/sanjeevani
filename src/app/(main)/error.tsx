'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
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

  const handleHardReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border/80 p-6 rounded-2xl shadow-sm">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-headline">Clinical Module Load Error</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The requested module encountered a momentary rendering issue during hot-reloading.
          </p>
          {error?.message && (
            <div className="p-2.5 rounded-lg bg-muted/60 text-[11px] font-mono text-muted-foreground text-left overflow-x-auto max-h-24">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          <Button onClick={handleHardReload} size="sm" className="gap-1.5 font-bold text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-semibold">
            <Link href="/modules">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Modules</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs font-semibold">
            <Link href="/dashboard">
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
