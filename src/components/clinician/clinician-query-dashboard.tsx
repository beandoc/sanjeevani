'use client';

import type { ElementType } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bed,
  Droplets,
  FileQuestion,
  HeartPulse,
  Pill,
  Search,
  ShieldAlert,
  Stethoscope,
  UserRoundSearch
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { CohortRow } from '@/lib/analytics/cohort';
import { matchesClinicianQuery, type ClinicianQueryCategory } from '@/lib/clinical/care-intelligence';
import { cn } from '@/lib/utils';

interface ClinicianQueryDashboardProps {
  rows: CohortRow[];
}

const QUERY_OPTIONS: Array<{
  id: ClinicianQueryCategory;
  label: string;
  icon: ElementType;
}> = [
  { id: 'all', label: 'All', icon: UserRoundSearch },
  { id: 'respite', label: 'Respite', icon: Bed },
  { id: 'delirium', label: 'Delirium', icon: ShieldAlert },
  { id: 'falls', label: 'Falls', icon: AlertTriangle },
  { id: 'medications', label: 'Meds', icon: Pill },
  { id: 'hydration', label: 'Hydration', icon: Droplets },
  { id: 'vitals', label: 'Vitals', icon: HeartPulse },
  { id: 'missing_logs', label: 'Missing Logs', icon: FileQuestion }
];

export function ClinicianQueryDashboard({ rows }: ClinicianQueryDashboardProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ClinicianQueryCategory>('respite');

  const categoryCounts = useMemo(() => {
    const counts = new Map<ClinicianQueryCategory, number>();
    QUERY_OPTIONS.forEach((option) => counts.set(option.id, 0));
    rows.forEach((row) => {
      counts.set('all', (counts.get('all') || 0) + 1);
      if (row.respitePrescription?.needed) counts.set('respite', (counts.get('respite') || 0) + 1);
      const categoriesInRow = new Set((row.dailyLogSignals || []).map((signal) => signal.category));
      categoriesInRow.forEach((signalCategory) => {
        counts.set(signalCategory, (counts.get(signalCategory) || 0) + 1);
      });
    });
    return counts;
  }, [rows]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        const textMatch =
          !normalized ||
          row.displayName.toLowerCase().includes(normalized) ||
          (row.caregiverName || '').toLowerCase().includes(normalized) ||
          (row.conditions || []).some((condition) => condition.toLowerCase().includes(normalized));
        if (!textMatch) return false;
        if (category === 'respite') return Boolean(row.respitePrescription?.needed);
        return matchesClinicianQuery(row.dailyLogSignals || [], category);
      })
      .sort((a, b) => {
        const aUrgent = (a.dailyLogSignals || []).some((signal) => signal.severity === 'urgent') || a.respitePrescription?.urgency === 'urgent';
        const bUrgent = (b.dailyLogSignals || []).some((signal) => signal.severity === 'urgent') || b.respitePrescription?.urgency === 'urgent';
        if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
        return (b.latestBurdenPct || 0) - (a.latestBurdenPct || 0);
      });
  }, [category, query, rows]);

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="p-3 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <UserRoundSearch className="w-3.5 h-3.5 text-primary" />
              Clinician Query Dashboard
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
              OPD surveillance across daily bedside logs, caregiver burden, care gap, and safety flags.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search query…"
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pt-1.5">
          {QUERY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = category === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setCategory(option.id)}
                className={cn(
                  'inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold border transition-colors whitespace-nowrap',
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{option.label}</span>
                <span className={cn('text-[9px] font-mono px-1 rounded', active ? 'bg-white/20' : 'bg-muted text-muted-foreground')}>
                  {categoryCounts.get(option.id) || 0}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-5 text-center">
            <p className="text-xs font-semibold text-foreground">No matching dyads</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Try another filter category or clear search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {results.slice(0, 6).map((row) => {
              const topSignals = (row.dailyLogSignals || []).slice(0, 2);
              return (
                <div key={row.patientUid} className="rounded-lg border border-border/60 bg-background/50 hover:bg-muted/20 transition-colors p-2.5 text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-xs text-foreground truncate">{row.displayName}</h4>
                        <Badge className={cn('text-[9px] uppercase font-bold px-1.5 py-0 h-4 leading-none', row.respitePrescription?.needed ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white')}>
                          {row.respitePrescription?.needed ? 'Respite' : row.riskBand}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        Caregiver: {row.caregiverName || 'Primary'} · Log: {row.lastDailyLogDate || 'none'}
                      </p>
                    </div>
                  </div>

                  {row.respitePrescription?.needed && (
                    <div className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] flex flex-wrap items-center justify-between gap-1">
                      <span className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-1">
                        <Bed className="w-3 h-3 shrink-0" />
                        {row.respitePrescription.recommendedDaysPerMonth}d/month respite recommended
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {row.respitePrescription.reasons[0] || row.respitePrescription.recommendedSupport}
                      </span>
                    </div>
                  )}

                  {topSignals.length > 0 ? (
                    <div className="space-y-1">
                      {topSignals.map((signal) => (
                        <p key={signal.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <AlertTriangle className={cn('w-3 h-3 shrink-0', signal.severity === 'urgent' ? 'text-red-600' : 'text-amber-600')} />
                          <span className="truncate">
                            <strong className="text-foreground">{signal.title}:</strong> {signal.detail}
                          </span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No daily-log red flags in recent sheets.</p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ZBI {row.latestBurdenPct ?? 'n/a'}% · {row.dailyLogCount || 0} sheets
                    </span>
                    <Button asChild size="sm" className="h-6 text-[11px] font-medium gap-1 px-2.5 rounded">
                      <Link href={`/clinic/dyad/${row.patientUid}`}>
                        <Stethoscope className="w-3 h-3" />
                        Open
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
