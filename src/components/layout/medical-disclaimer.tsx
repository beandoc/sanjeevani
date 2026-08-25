'use client';

import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface MedicalDisclaimerProps {
  variant?: 'banner' | 'footer' | 'inline';
  className?: string;
}

export function MedicalDisclaimer({ variant = 'banner', className = '' }: MedicalDisclaimerProps) {
  if (variant === 'footer') {
    return (
      <footer className={`mt-16 border-t border-border/60 bg-muted/20 py-8 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground ${className}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left max-w-3xl">
            <p className="font-semibold text-foreground/90 flex items-center justify-center md:justify-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Medical Disclaimer & Clinical Decision Support Notice
            </p>
            <p className="leading-relaxed">
              Kutumbh is designed exclusively as an educational, informational, and caregiver decision-support platform. Content and psychometric assessment scales (such as the Zarit Caregiver Burden Scale) do not constitute medical diagnosis, formal prognosis, or clinical prescriptions. Always seek the advice of a qualified physician, geriatrician, or healthcare provider for medical conditions. In acute emergencies, dial <strong>112</strong> or Elder Line <strong>14567</strong>.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 font-medium">
            <Link href="/privacy" className="hover:text-primary underline underline-offset-4">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/assessment-guide" className="hover:text-primary underline underline-offset-4">
              Clinical Guidelines
            </Link>
            <span>•</span>
            <Link href="/resources" className="hover:text-primary underline underline-offset-4">
              National Helplines
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <div className={`p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 ${className}`}>
      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="leading-relaxed">
        <strong className="font-semibold">Clinical Note:</strong> This module is for informational training and caregiver decision support. It is not a replacement for professional clinical judgment or direct physician consultation.
      </div>
    </div>
  );
}
