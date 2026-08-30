'use client';

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import type { TrajectoryResult } from '@/lib/analytics/trajectory';

interface ScissorsChartProps {
  trajectory: TrajectoryResult;
}

interface ChartRow {
  date: string;
  dateMs: number;
  burdenPct: number | null;
  dependencyPct: number | null;
  tierChange?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The core visualization: caregiver burden (ZBI normalized %, rising = worse)
 * plotted against care-recipient dependency (100 - Barthel, rising = worse)
 * on a shared 0-100 axis, so both curves move in the same direction and a
 * widening gap between them is visible without any rescaling trick.
 *
 * Burden and function are recorded on independent schedules (not paired 1:1),
 * so this renders two separate series on a unified date axis rather than
 * forcing them into synthetic shared data points — recharts handles sparse
 * series on a shared axis natively via distinct dataKeys with `connectNulls`.
 */
export function ScissorsChart({ trajectory }: ScissorsChartProps) {
  const { burdenSeries, functionSeries, tierChanges, interventions = [] } = trajectory;

  const rows = new Map<string, ChartRow>();

  for (const point of burdenSeries) {
    const key = point.date;
    rows.set(key, {
      date: key,
      dateMs: new Date(key).getTime(),
      burdenPct: point.normalizedPercentage,
      dependencyPct: rows.get(key)?.dependencyPct ?? null
    });
  }
  for (const point of functionSeries) {
    const key = point.date;
    const existing = rows.get(key);
    rows.set(key, {
      date: key,
      dateMs: new Date(key).getTime(),
      burdenPct: existing?.burdenPct ?? null,
      dependencyPct: point.dependencyPercentage
    });
  }

  const sortedRows = Array.from(rows.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const minDateMs = sortedRows[0]?.dateMs ?? Date.now();
  const maxDateMs = sortedRows[sortedRows.length - 1]?.dateMs ?? minDateMs;
  const domainPadMs =
    sortedRows.length === 1 ? 7 * DAY_MS : Math.max(DAY_MS, Math.round((maxDateMs - minDateMs) * 0.04));

  for (const tc of tierChanges) {
    const row = sortedRows.find((r) => r.date === tc.date);
    if (row) row.tierChange = `${tc.fromTier} → ${tc.toTier}`;
  }

  if (sortedRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed rounded-xl">
        <p className="text-sm font-medium">No burden or function assessments recorded yet.</p>
        <p className="text-xs mt-1">The trajectory chart appears once at least one of each is on file.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <div className="w-full h-72 sm:h-80 md:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sortedRows} margin={{ top: 15, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="dateMs"
            type="number"
            scale="time"
            domain={[minDateMs - domainPadMs, maxDateMs + domainPadMs]}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => format(new Date(value), 'dd MMM yy')}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            label={{ value: '0-100, higher = worse', angle: -90, position: 'insideLeft', fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              value === null ? '—' : `${value}%`,
              name === 'burdenPct' ? 'Caregiver Burden (ZBI)' : 'Care-Recipient Dependency (100 − Barthel)'
            ]}
            labelFormatter={(label) => format(new Date(Number(label)), 'dd MMM yy, h:mm a')}
          />
          <Legend
            formatter={(value) =>
              value === 'burdenPct' ? 'Caregiver Burden (ZBI %)' : 'Care-Recipient Dependency (%)'
            }
          />
          {tierChanges.map((tc) => (
            <ReferenceLine
              key={`tier-${tc.date}`}
              x={new Date(tc.date).getTime()}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              label={{ value: `Tier: ${tc.toTier}`, fontSize: 9, position: 'top', fill: 'hsl(var(--muted-foreground))' }}
            />
          ))}
          {interventions.map((iv) => (
            <ReferenceLine
              key={`iv-${iv.id}-${iv.date}`}
              x={new Date(iv.date).getTime()}
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              label={{
                value: iv.title,
                fontSize: 9,
                position: 'insideTopLeft',
                fill: 'hsl(var(--primary))'
              }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="burdenPct"
            stroke="hsl(var(--destructive))"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls
            name="burdenPct"
          />
          <Line
            type="monotone"
            dataKey="dependencyPct"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls
            name="dependencyPct"
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground px-1 gap-2">
        {tierChanges.length > 0 && (
          <p>
            Dashed gray lines mark a change in Zarit tier (ZBI-22/12/4).
          </p>
        )}
        {interventions.length > 0 && (
          <p className="font-semibold text-primary">
            Vertical lines mark active Care Matrix Builder interventions.
          </p>
        )}
      </div>
    </div>
  );
}
