'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  StressAssessmentEntry,
  analyzeLongitudinalTrajectory,
  STRESS_LEVEL_INFO,
} from '@/lib/stress-scale';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Calendar,
  Sparkles,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StressTrendChartProps {
  history: StressAssessmentEntry[];
  onSelectEntry?: (entry: StressAssessmentEntry) => void;
}

export function StressTrendChart({ history, onSelectEntry }: StressTrendChartProps) {
  if (!history || history.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
          <Activity className="h-10 w-10 text-muted-foreground/40 animate-pulse" />
          <div>
            <h3 className="font-semibold text-foreground">No Longitudinal Data Yet</h3>
            <p className="text-xs max-w-sm mt-1">
              Complete your first Zarit ZBI-12 or Cohen PSS-10 assessment to establish a clinical baseline and begin tracking stress trajectories over time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort chronological for chart display
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latestEntry = sortedHistory[sortedHistory.length - 1];
  const previousHistory = sortedHistory.slice(0, sortedHistory.length - 1);
  const analysis = analyzeLongitudinalTrajectory(
    previousHistory,
    latestEntry.totalScore,
    latestEntry.instrument || 'ZARIT_ZBI12'
  );

  // Transform data for recharts
  const chartData = sortedHistory.map((item, index) => {
    const prevItem = index > 0 ? sortedHistory[index - 1] : null;
    const delta = prevItem ? item.totalScore - prevItem.totalScore : 0;
    const maxScore = item.maxScore || (item.instrument === 'ZARIT_ZBI12' ? 48 : 40);

    return {
      id: item.id,
      dateFormatted: format(new Date(item.date), 'dd MMM'),
      fullDate: format(new Date(item.date), 'PPP'),
      score: item.totalScore,
      maxScore,
      normalizedPct: item.normalizedPercentage ?? Math.round((item.totalScore / maxScore) * 100),
      instrument: item.instrument === 'ZARIT_ZBI12' ? 'Zarit ZBI-12' : 'Cohen PSS-10',
      severity: item.severity,
      delta,
      notes: item.notes,
      condition: item.careRecipientCondition || 'Not specified',
    };
  });

  const latestSeverity = STRESS_LEVEL_INFO[latestEntry.severity];
  const isZarit = latestEntry.instrument === 'ZARIT_ZBI12';

  return (
    <div className="space-y-6">
      {/* Dynamic Longitudinal Trajectory Alert */}
      {analysis.clinicalAlert && (
        <div
          className={cn(
            'p-4 rounded-xl border flex items-start gap-3 shadow-sm transition-all',
            analysis.trajectory === 'critical_surge'
              ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : analysis.trajectory === 'worsening'
              ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          )}
        >
          {analysis.trajectory === 'critical_surge' || analysis.trajectory === 'worsening' ? (
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <TrendingDown className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-sm">
            <div className="font-bold flex items-center gap-2">
              <span>{analysis.trajectoryLabel}</span>
              {analysis.deltaFromPrevious !== null && (
                <Badge
                  variant={analysis.isWorsening ? 'destructive' : 'secondary'}
                  className="text-[10px] uppercase font-mono px-2 py-0"
                >
                  {analysis.deltaFromPrevious >= 0
                    ? `+${analysis.deltaFromPrevious} pts`
                    : `${analysis.deltaFromPrevious} pts`}
                </Badge>
              )}
            </div>
            <p className="text-xs leading-relaxed opacity-90">{analysis.clinicalAlert}</p>
          </div>
        </div>
      )}

      {/* Main Longitudinal Trend Chart */}
      <Card className="shadow-lg border-border">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Longitudinal Caregiver Fatigue & Burden Trajectory
              </CardTitle>
              <CardDescription className="text-xs">
                Standardized tracking across clinical assessments over time ({isZarit ? 'Zarit ZBI-12' : 'Cohen PSS-10'}).
              </CardDescription>
            </div>

            {/* Threshold Legend Chips */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low (≤{isZarit ? 10 : 13})
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate ({isZarit ? '11-20' : '14-26'})
              </span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Severe (≥{isZarit ? 21 : 27})
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="stressAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />

                <XAxis
                  dataKey="dateFormatted"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />

                <YAxis
                  domain={[0, isZarit ? 48 : 40]}
                  ticks={isZarit ? [0, 10, 20, 30, 48] : [0, 13, 26, 40]}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />

                {/* Clinical Risk Boundary Lines */}
                <ReferenceLine
                  y={isZarit ? 10 : 13}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Low Limit (${isZarit ? 10 : 13})`,
                    position: 'insideBottomRight',
                    fill: '#10b981',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={isZarit ? 20 : 26}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: `Mod Limit (${isZarit ? 20 : 26})`,
                    position: 'insideBottomRight',
                    fill: '#f59e0b',
                    fontSize: 10,
                  }}
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#stressAreaGradient)"
                  dot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t text-center">
            <div className="p-3 rounded-lg bg-secondary/30">
              <span className="text-[11px] text-muted-foreground block">Latest Score</span>
              <span className="text-xl font-bold font-headline text-foreground">
                {latestEntry.totalScore}/{latestEntry.maxScore || (isZarit ? 48 : 40)}
              </span>
              <Badge variant={latestSeverity.badgeVariant} className="text-[10px] mt-1">
                {latestSeverity.severity.toUpperCase()}
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-secondary/30">
              <span className="text-[11px] text-muted-foreground block">Baseline Score</span>
              <span className="text-xl font-bold font-headline text-foreground">
                {sortedHistory[0].totalScore}/{sortedHistory[0].maxScore || 48}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-1">
                {format(new Date(sortedHistory[0].date), 'dd MMM yyyy')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-secondary/30">
              <span className="text-[11px] text-muted-foreground block">Net Shift from Baseline</span>
              <span
                className={cn(
                  'text-xl font-bold font-headline flex items-center justify-center gap-1',
                  analysis.deltaFromBaseline !== null && analysis.deltaFromBaseline > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                )}
              >
                {analysis.deltaFromBaseline !== null && analysis.deltaFromBaseline > 0 ? '+' : ''}
                {analysis.deltaFromBaseline ?? 0} pts
              </span>
              <span className="text-[10px] text-muted-foreground block mt-1">
                {analysis.deltaFromBaseline !== null && analysis.deltaFromBaseline >= 6
                  ? 'Significant Shift'
                  : 'Stable Range'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-secondary/30">
              <span className="text-[11px] text-muted-foreground block">Total Assessments</span>
              <span className="text-xl font-bold font-headline text-foreground">
                {sortedHistory.length}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-1">
                Logged checkpoints
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const severityInfo = STRESS_LEVEL_INFO[data.severity as 'low' | 'moderate' | 'high'];

    return (
      <div className="rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl text-xs space-y-1.5 min-w-[210px]">
        <div className="flex items-center justify-between font-semibold border-b pb-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" /> {data.fullDate}
          </span>
          <span className="font-bold text-sm">{data.score}/{data.maxScore}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Battery:</span> <strong>{data.instrument}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">Classification:</span>{' '}
          <strong style={{ color: severityInfo.color }}>{severityInfo.title}</strong>
        </div>
        {data.delta !== 0 && (
          <div>
            <span className="text-muted-foreground">Delta from prior:</span>{' '}
            <strong className={data.delta > 0 ? 'text-rose-500' : 'text-emerald-500'}>
              {data.delta > 0 ? `+${data.delta}` : data.delta} pts
            </strong>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Condition:</span> <strong>{data.condition}</strong>
        </div>
        {data.notes && (
          <div className="pt-1 text-[11px] italic text-muted-foreground border-t">
            "{data.notes}"
          </div>
        )}
      </div>
    );
  }
  return null;
}
