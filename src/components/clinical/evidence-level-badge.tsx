'use client';

import { Badge } from '@/components/ui/badge';
import type { ClinicalProvenance, EvidenceLevel } from '@/lib/clinical/provenance';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  'validated-instrument': 'Validated Scale',
  guideline: 'Guideline Screen',
  'expert-consensus': 'Expert Reviewed',
  'local-heuristic': 'Planning Estimate'
};

const EVIDENCE_STYLES: Record<EvidenceLevel, string> = {
  'validated-instrument': 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10',
  guideline: 'border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-500/10',
  'expert-consensus': 'border-violet-500/40 text-violet-700 dark:text-violet-300 bg-violet-500/10',
  'local-heuristic': 'border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/10'
};

interface EvidenceLevelBadgeProps {
  provenance?: ClinicalProvenance;
  level?: EvidenceLevel;
  label?: string;
  className?: string;
}

export function EvidenceLevelBadge({
  provenance,
  level,
  label,
  className
}: EvidenceLevelBadgeProps) {
  const evidenceLevel = level || provenance?.evidenceLevel || 'local-heuristic';
  const badgeLabel = label || EVIDENCE_LABELS[evidenceLevel];

  return (
    <Badge
      variant="outline"
      title={provenance ? `${provenance.source}. ${provenance.note}` : undefined}
      className={cn(
        'text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
        EVIDENCE_STYLES[evidenceLevel],
        className
      )}
    >
      {badgeLabel}
    </Badge>
  );
}

interface ClinicalSafetyNoteProps {
  children?: ReactNode;
  className?: string;
  defaultExpanded?: boolean;
}

export function ClinicalSafetyNote({ children, className }: ClinicalSafetyNoteProps) {
  return (
    <div className={cn('rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs', className)}>
      <div className="flex items-center gap-2">
        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400 shrink-0 bg-amber-500/20 px-1.5 py-0.5 rounded">
          Precaution
        </span>
        <div className="text-[11px] leading-snug line-clamp-2 hover:line-clamp-none transition-all">
          {children || 'Decision support only. Confirm with a clinician before altering care or staffing.'}
        </div>
      </div>
    </div>
  );
}
