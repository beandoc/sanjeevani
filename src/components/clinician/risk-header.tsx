'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import type { TrajectoryResult, RiskBand } from '@/lib/analytics/trajectory';
import { cn } from '@/lib/utils';

const RISK_BAND_CONFIG: Record<RiskBand, { label: string; badgeClass: string; icon: typeof AlertTriangle }> = {
  stable: {
    label: 'Stable',
    badgeClass: 'bg-emerald-500 text-white',
    icon: Minus
  },
  deteriorating: {
    label: 'Deteriorating',
    badgeClass: 'bg-amber-500 text-white',
    icon: TrendingUp
  },
  critical: {
    label: 'Critical',
    badgeClass: 'bg-red-600 text-white animate-pulse',
    icon: AlertTriangle
  },
  'lost-to-follow-up': {
    label: 'Lost to Follow-Up',
    badgeClass: 'bg-orange-600 text-white',
    icon: AlertTriangle
  },
  'insufficient-data': {
    label: 'Insufficient Data',
    badgeClass: 'bg-slate-400 text-white',
    icon: HelpCircle
  }
};

/**
 * Categorical risk band + trend arrow, deliberately never a projected date.
 * See trajectory.ts for why: a linear extrapolation of a handful of ZBI
 * points is not a validated predictor of when a caregiver will break down.
 */
export function RiskHeader({ trajectory }: { trajectory: TrajectoryResult }) {
  const config = RISK_BAND_CONFIG[trajectory.riskBand];
  const Icon = config.icon;
  const { burdenSlope, functionSlope, latestAssessmentAgeDays } = trajectory;

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Badge className={cn('font-bold text-xs px-3 py-1 gap-1.5', config.badgeClass)}>
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </Badge>
            {latestAssessmentAgeDays !== null && (
              <span className="text-xs text-muted-foreground">
                Last assessed {latestAssessmentAgeDays} day{latestAssessmentAgeDays === 1 ? '' : 's'} ago
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <TrendIndicator label="Burden" slope={burdenSlope} invert={false} />
            <TrendIndicator label="Dependency" slope={functionSlope} invert={false} />
          </div>
        </div>

        {trajectory.riskReasons.length > 0 && (
          <ul className="space-y-1">
            {trajectory.riskReasons.map((reason, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-muted-foreground/60 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TrendIndicator({
  label,
  slope
}: {
  label: string;
  slope: TrajectoryResult['burdenSlope'];
  invert: boolean;
}) {
  if (!slope.isReliable || slope.slopePerMonth === null) {
    return (
      <span className="text-muted-foreground flex items-center gap-1">
        <HelpCircle className="w-3.5 h-3.5" /> {label}: n/a ({slope.n} pt{slope.n === 1 ? '' : 's'})
      </span>
    );
  }
  const rising = slope.slopePerMonth > 0.5;
  const falling = slope.slopePerMonth < -0.5;
  const TrendIcon = rising ? TrendingUp : falling ? TrendingDown : Minus;
  const colorClass = rising ? 'text-rose-500' : falling ? 'text-emerald-500' : 'text-muted-foreground';

  return (
    <span className={cn('flex items-center gap-1 font-medium', colorClass)} title={`R² = ${slope.rSquared}`}>
      <TrendIcon className="w-3.5 h-3.5" />
      {label}: {slope.slopePerMonth > 0 ? '+' : ''}
      {slope.slopePerMonth}/mo
    </span>
  );
}
