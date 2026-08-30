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
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserRoundSearch className="w-4 h-4 text-primary" />
              Clinician Query Dashboard
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Ask practical OPD questions across daily logs, caregiver burden, care gap, vitals, and safety flags.
            </CardDescription>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patient, caregiver, condition"
              className="h-9 pl-8 text-xs"
            />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pt-3">
          {QUERY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = category === option.id;
            return (
              <Button
                key={option.id}
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => setCategory(option.id)}
                className="h-8 text-xs font-bold gap-1.5 shrink-0"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{option.label}</span>
                <Badge variant="outline" className={cn('text-[9px] font-mono ml-0.5', active && 'border-white/50 text-current')}>
                  {categoryCounts.get(option.id) || 0}
                </Badge>
              </Button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm font-bold text-foreground">No matching dyads</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different query, filter, or datewise bedside logs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {results.slice(0, 6).map((row) => {
              const topSignals = (row.dailyLogSignals || []).slice(0, 2);
              return (
                <div key={row.patientUid} className="rounded-xl border border-border/70 bg-background p-3 text-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">{row.displayName}</h4>
                      <p className="text-muted-foreground">
                        Caregiver: {row.caregiverName || 'Primary caregiver'} | Last daily log: {row.lastDailyLogDate || 'not saved'}
                      </p>
                    </div>
                    <Badge className={cn('text-[9px] uppercase font-bold', row.respitePrescription?.needed ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white')}>
                      {row.respitePrescription?.needed ? 'Respite' : row.riskBand}
                    </Badge>
                  </div>

                  {row.respitePrescription?.needed && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2">
                      <p className="font-bold text-red-700 dark:text-red-300">
                        {row.respitePrescription.recommendedDaysPerMonth} days/month respite recommended
                      </p>
                      <p className="text-muted-foreground mt-0.5">{row.respitePrescription.reasons[0] || row.respitePrescription.recommendedSupport}</p>
                    </div>
                  )}

                  {topSignals.length > 0 ? (
                    <div className="space-y-1.5">
                      {topSignals.map((signal) => (
                        <p key={signal.id} className="flex gap-1.5 text-muted-foreground">
                          <AlertTriangle className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', signal.severity === 'urgent' ? 'text-red-600' : 'text-amber-600')} />
                          <span>
                            <strong className="text-foreground">{signal.title}:</strong> {signal.detail}
                          </span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No daily-log red flags found in the latest synced bedside sheets.</p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ZBI {row.latestBurdenPct ?? 'n/a'}% | {row.dailyLogCount || 0} daily sheets
                    </span>
                    <Button asChild size="sm" className="h-8 text-xs font-bold gap-1.5">
                      <Link href={`/clinic/dyad/${row.patientUid}`}>
                        <Stethoscope className="w-3.5 h-3.5" />
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
