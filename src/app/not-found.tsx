'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, ArrowLeft, PhoneCall } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
            404 Error — Page Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-headline">
            Clinical Page Not Located
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The requested health resource or module could not be found. You can return to the main dashboard or access emergency helplines.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full gap-2 font-bold text-xs">
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
          <Link href="/resources" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2 text-xs font-semibold">
              <PhoneCall className="w-4 h-4 text-primary" />
              <span>National Helplines</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
