'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, ArrowLeft, PhoneCall } from 'lucide-react';

export default function MainNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
            404 Error
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-headline">
            Page Not Found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The module or page you are looking for has moved or does not exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full gap-2 font-bold text-xs">
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <Link href="/modules" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2 text-xs font-semibold">
              <ArrowLeft className="w-4 h-4" />
              <span>Browse All Modules</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
