'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface MedicalDisclaimerProps {
  variant?: 'banner' | 'footer' | 'inline';
  className?: string;
}

export function MedicalDisclaimer({ variant = 'banner', className = '' }: MedicalDisclaimerProps) {
  if (variant === 'footer') {
    return (
      <footer className={`mt-10 border-t border-border/50 bg-muted/15 py-3.5 px-4 sm:px-6 lg:px-8 text-[11px] text-muted-foreground ${className}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="flex items-center justify-center sm:justify-start gap-1.5 leading-normal">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              <strong>Clinical Note:</strong> Educational and decision-support only; not a substitute for clinical assessment, prescription, or emergency care. Use locally verified emergency contacts when urgent symptoms occur.
            </span>
          </p>

          <div className="flex items-center gap-3 shrink-0 text-xs font-medium">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <span className="text-border">•</span>
            <Link href="/assessment-guide" className="hover:text-primary transition-colors">
              Guidelines
            </Link>
            <span className="text-border">•</span>
            <Link href="/resources" className="hover:text-primary transition-colors">
              Helplines
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
        <strong className="font-semibold">Clinical Note:</strong> This module is for informational training and caregiver decision support. It is not a replacement for professional clinical judgment, medication review, emergency care, or direct physician consultation.
      </div>
    </div>
  );
}
