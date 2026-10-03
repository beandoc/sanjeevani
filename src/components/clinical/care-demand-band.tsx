'use client';

import type { CareDemandBand, CareTimeEstimate } from '@/lib/clinical/care-demand-model';
import { EvidenceLevelBadge } from '@/components/clinical/evidence-level-badge';
import { cn } from '@/lib/utils';
import { Info, MoonStar } from 'lucide-react';

/**
 * Renders a care-demand estimate as a RANGE.
 *
 * The model's output is a band, not a number. Rendering a single figure to
 * 0.1 h — six minutes a day — would imply a precision that the evidence cannot
 * support: purpose-built, time-calibrated home-care case-mix systems explain
 * only 16-24% of individual care-hour variance, so roughly three-quarters of
 * the variation is unaccounted for. Every surface that shows care hours uses
 * this component so no screen can quietly present the midpoint alone.
 */

/** "4–9 h/day". Collapses to one figure only when the band has zero width. */
export function formatBand(e: CareTimeEstimate, unit = 'h/day'): string {
  if (e.highHours === 0 && e.lowHours === 0) return `0 ${unit}`;
  if (e.lowHours === e.highHours) return `${e.lowHours} ${unit}`;
  return `${e.lowHours}–${e.highHours} ${unit}`;
}

export function CareDemandBandValue({
  estimate,
  className,
  unit
}: {
  estimate: CareTimeEstimate;
  className?: string;
  unit?: string;
}) {
  return (
    <span className={cn('font-mono font-black tabular-nums', className)}>
      {formatBand(estimate, unit)}
    </span>
  );
}

/**
 * The three time types, shown separately.
 *
 * A clinician choosing between a 4h morning attendant and a 12h night watch
 * needs to know which kind of time the estimate is made of. Hands-on work,
 * active supervision and passive availability have different costs, different
 * skill requirements and different consequences for the caregiver, so a single
 * combined figure cannot answer the question being asked of it.
 */
export function CareDemandBreakdown({
  band,
  className,
  compact = false
}: {
  band: CareDemandBand;
  className?: string;
  compact?: boolean;
}) {
  const rows: Array<{ label: string; hint: string; estimate: CareTimeEstimate }> = [
    { label: 'Hands-on care', hint: 'Direct physical assistance', estimate: band.directCare },
    { label: 'Active supervision', hint: 'Vigilance, prompting, oversight', estimate: band.supervision },
    { label: 'On-call presence', hint: 'Availability, not hands-on work', estimate: band.onCall }
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Estimated care time (planning range)
        </span>
        <EvidenceLevelBadge provenance={band.provenance} label="Planning Range" />
      </div>

      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {r.label}
              {!compact && <span className="block text-[10px] opacity-70">{r.hint}</span>}
            </span>
            <CareDemandBandValue estimate={r.estimate} className="text-sm" />
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 pt-1.5 border-t">
          <span className="text-xs font-bold">
            Workload total
            {!compact && (
              <span className="block text-[10px] font-normal opacity-70">
                Caregiver-hours of hands-on care plus non-overlapping supervision. Two carers for
                15 minutes counts as 30 caregiver-minutes. Compare this with caregiver capacity.
              </span>
            )}
          </span>
          <CareDemandBandValue estimate={band.activeCare} className="text-base" />
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-bold">
            Coverage required
            {!compact && (
              <span className="block text-[10px] font-normal opacity-70">
                Elapsed hours someone must be present. Not the sum of the rows above — supervision
                and hands-on care happen in the same minutes. Build the rota from this.
              </span>
            )}
          </span>
          <CareDemandBandValue estimate={band.coverage} className="text-base" />
        </div>
      </div>

      {band.supervisionOverlapCreditMinutes > 0 && !compact && (
        <p className="text-[10px] text-muted-foreground">
          {Math.round(band.supervisionOverlapCreditMinutes)} min/day of supervision is not charged
          separately because hands-on care already occupies those minutes.
        </p>
      )}

      {band.requiresNightPresence && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
          <MoonStar className="w-3 h-3 mt-0.5 shrink-0" />
          <span>
            Overnight presence required. This is a coverage question — someone available — rather
            than hours to be added to the active-care total.
          </span>
        </p>
      )}

      {!compact && band.bandBasis.length > 0 && (
        <details className="text-[11px] text-muted-foreground">
          <summary className="cursor-pointer flex items-center gap-1 font-semibold">
            <Info className="w-3 h-3" />
            Why this is a range, not a number
          </summary>
          <ul className="list-disc pl-5 pt-1.5 space-y-1">
            {band.bandBasis.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {band.inputCompleteness.missing.length > 0 && (
            <p className="pt-1.5">
              Complete these to narrow the range:{' '}
              <strong>{band.inputCompleteness.missing.join(', ')}</strong>.
            </p>
          )}
        </details>
      )}
    </div>
  );
}

/**
 * States the gap honestly, including when it cannot be stated.
 *
 * A deficit is asserted only when the whole band exceeds capacity. Where the
 * band straddles capacity the answer is "indeterminate" and the right response
 * is to ask for the missing inputs, not to assert a shortfall an estimate
 * cannot support.
 */
export function CareGapVerdict({
  classification,
  gapHours,
  className
}: {
  classification: 'covered' | 'indeterminate' | 'deficit';
  gapHours: number;
  className?: string;
}) {
  if (classification === 'covered') {
    return (
      <span className={cn('font-bold text-emerald-600 dark:text-emerald-400', className)}>
        Within available capacity
      </span>
    );
  }
  if (classification === 'deficit') {
    return (
      <span className={cn('font-bold text-rose-600 dark:text-rose-400', className)}>
        Shortfall ≈ {gapHours.toFixed(1)} h/day
      </span>
    );
  }
  return (
    <span className={cn('font-bold text-amber-700 dark:text-amber-400', className)}>
      Cannot be determined — estimate range spans available capacity
    </span>
  );
}
