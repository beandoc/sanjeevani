'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Activity, CalendarDays, Droplets, Moon, Pill, Save, Stethoscope, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  HealthRepository,
  type DailyCareLog,
  type DailyCareLogMedication,
  type DailyCareLogVitalsRow,
  type DailyCareShift,
  type MedicationItem
} from '@/lib/db/health-repository';
import {
  getDailyCareLogsFor,
  saveDailyCareLogFor,
  subscribeToDailyCareLogsFor,
  syncDailyCareLog
} from '@/lib/firebase/clinical-sync';
import { cn } from '@/lib/utils';

const DEFAULT_MONITORING_ROWS: DailyCareLogVitalsRow[] = [
  { id: 'before_breakfast', timeLabel: 'Before Breakfast' },
  { id: 'before_lunch', timeLabel: 'Before Lunch' },
  { id: 'before_snacks', timeLabel: 'Before Snacks' },
  { id: 'before_dinner', timeLabel: 'Before Dinner' },
  { id: 'night', timeLabel: 'Night' }
];

const SHIFT_LABEL: Record<DailyCareShift, string> = {
  morning: 'Morning',
  day: 'Day',
  evening: 'Evening',
  night: 'Night',
  full_day: 'Full Day'
};

interface DailyCareLogPanelProps {
  patientUid?: string;
  patientName?: string | null;
  mode?: 'edit' | 'readonly';
  title?: string;
  medications?: MedicationItem[];
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeLogId(date: string, shift: DailyCareShift) {
  return `daily_${date}_${shift}`;
}

function medicationsFromActive(items: MedicationItem[]): DailyCareLogMedication[] {
  if (items.length === 0) {
    return [
      { id: 'med_morning_1', label: 'Morning medicines', slot: 'morning', given: false },
      { id: 'med_lunch_1', label: 'Post-lunch medicines', slot: 'lunch', given: false },
      { id: 'med_night_1', label: 'Night medicines', slot: 'night', given: false }
    ];
  }

  return items.flatMap((item) =>
    item.timeOfDay.map((slot, index) => ({
      id: `${item.id}_${slot}_${index}`,
      label: `${item.name}${item.dosage ? ` ${item.dosage}` : ''}`,
      slot: slot === 'afternoon' ? 'lunch' : slot === 'bedtime' ? 'night' : slot,
      given: Boolean(item.takenSlots?.includes(slot) || item.takenToday),
      notes: item.instructions
    } satisfies DailyCareLogMedication))
  );
}

export function DailyCareLogPanel({
  patientUid,
  patientName,
  mode = 'edit',
  title = 'Daily Bedside Update',
  medications
}: DailyCareLogPanelProps) {
  const { toast } = useToast();
  const isReadOnly = mode === 'readonly';
  const [logs, setLogs] = useState<DailyCareLog[]>([]);
  const [date, setDate] = useState(todayKey);
  const [shift, setShift] = useState<DailyCareShift>('full_day');
  const [recordedByName, setRecordedByName] = useState('');
  const [meals, setMeals] = useState<DailyCareLog['meals']>({});
  const [monitoringRows, setMonitoringRows] = useState<DailyCareLogVitalsRow[]>(DEFAULT_MONITORING_ROWS);
  const [logMeds, setLogMeds] = useState<DailyCareLogMedication[]>(() =>
    medicationsFromActive(medications || HealthRepository.getMedications())
  );
  const [stoolPassed, setStoolPassed] = useState<boolean | null>(null);
  const [urineMorningMl, setUrineMorningMl] = useState('');
  const [urineEveningMl, setUrineEveningMl] = useState('');
  const [waterIntakeMl, setWaterIntakeMl] = useState('');
  const [catheterChanged, setCatheterChanged] = useState<boolean | null>(null);
  const [sleep, setSleep] = useState<DailyCareLog['sleep']>('not_recorded');
  const [generalRemarks, setGeneralRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeLog = useMemo(
    () => logs.find((log) => log.id === makeLogId(date, shift)) || null,
    [date, logs, shift]
  );
  const latestLog = logs[0] || null;

  useEffect(() => {
    let unsubscribe = () => {};
    if (patientUid) {
      void getDailyCareLogsFor(patientUid).then(setLogs);
      unsubscribe = subscribeToDailyCareLogsFor(patientUid, setLogs);
    } else {
      setLogs(HealthRepository.getDailyCareLogs());
    }
    return () => unsubscribe();
  }, [patientUid]);

  useEffect(() => {
    if (!activeLog || isReadOnly) return;
    setRecordedByName(activeLog.recordedByName || '');
    setMeals(activeLog.meals || {});
    setMonitoringRows(activeLog.monitoringRows.length > 0 ? activeLog.monitoringRows : DEFAULT_MONITORING_ROWS);
    setLogMeds(activeLog.medications.length > 0 ? activeLog.medications : medicationsFromActive(medications || HealthRepository.getMedications()));
    setStoolPassed(activeLog.stoolPassed);
    setUrineMorningMl(activeLog.urineMorningMl || '');
    setUrineEveningMl(activeLog.urineEveningMl || '');
    setWaterIntakeMl(activeLog.waterIntakeMl || '');
    setCatheterChanged(activeLog.catheterChanged);
    setSleep(activeLog.sleep || 'not_recorded');
    setGeneralRemarks(activeLog.generalRemarks || '');
  }, [activeLog, isReadOnly, medications]);

  const completeness = useMemo(() => {
    const mealCount = Object.values(meals).filter(Boolean).length;
    const vitalsCount = monitoringRows.filter((row) => row.bp || row.bloodSugar || row.spo2 || row.pulse).length;
    const medsGiven = logMeds.filter((med) => med.given).length;
    const outputCount = [stoolPassed !== null, urineMorningMl, urineEveningMl, waterIntakeMl, catheterChanged !== null, sleep !== 'not_recorded'].filter(Boolean).length;
    return Math.min(100, Math.round(((mealCount + vitalsCount + medsGiven + outputCount) / 18) * 100));
  }, [catheterChanged, logMeds, meals, monitoringRows, sleep, stoolPassed, urineEveningMl, urineMorningMl, waterIntakeMl]);

  const updateMonitoringRow = (id: string, patch: Partial<DailyCareLogVitalsRow>) => {
    setMonitoringRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const toggleMedication = (id: string) => {
    setLogMeds((prev) => prev.map((med) => (med.id === id ? { ...med, given: !med.given } : med)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const now = new Date().toISOString();
    const log: DailyCareLog = {
      id: makeLogId(date, shift),
      date,
      shift,
      patientUid: patientUid || null,
      patientName: patientName || HealthRepository.getPatientProfile().name,
      recordedByName: recordedByName.trim() || null,
      recordedByRole: 'nurse',
      meals,
      monitoringRows,
      medications: logMeds,
      stoolPassed,
      urineMorningMl: urineMorningMl || undefined,
      urineEveningMl: urineEveningMl || undefined,
      waterIntakeMl: waterIntakeMl || undefined,
      catheterChanged,
      sleep,
      generalRemarks: generalRemarks || undefined,
      createdAt: activeLog?.createdAt || now,
      updatedAt: now
    };

    try {
      if (patientUid) {
        await saveDailyCareLogFor(patientUid, log);
        setLogs(await getDailyCareLogsFor(patientUid));
      } else {
        const updated = HealthRepository.saveDailyCareLog(log);
        setLogs(updated);
        await syncDailyCareLog(log);
      }
      toast({
        title: 'Daily Update Saved',
        description: `${format(new Date(date), 'dd MMM yyyy')} ${SHIFT_LABEL[shift].toLowerCase()} sheet is available to the family and care team.`
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Save Daily Update',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayLogs = logs.slice(0, 7);

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                {title}
              </CardTitle>
              <CardDescription className="text-xs">
                {patientName || 'Patient'} daily vitals, feeds, medicines, sleep, stool, and urine output.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono">
                {displayLogs.length} recent
              </Badge>
              {!isReadOnly && (
                <Badge className={cn('text-[10px] font-bold', completeness >= 70 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white')}>
                  {completeness}% complete
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {!isReadOnly && (
          <CardContent className="p-4 sm:p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Shift</label>
                <Select value={shift} onValueChange={(value) => setShift(value as DailyCareShift)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SHIFT_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-muted-foreground">Recorded By</label>
                <Input value={recordedByName} onChange={(e) => setRecordedByName(e.target.value)} placeholder="Nurse / medical assistant name" className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  Meals & Feeds
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ['breakfast', 'Breakfast'],
                    ['lunch', 'Lunch'],
                    ['eveningSnack', 'Evening Snack'],
                    ['dinner', 'Dinner']
                  ].map(([key, label]) => (
                    <Input
                      key={key}
                      value={String(meals[key as keyof DailyCareLog['meals']] || '')}
                      onChange={(e) => setMeals((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={label}
                      className="h-9 text-xs"
                    />
                  ))}
                </div>
                <Textarea
                  value={meals.feedNotes || ''}
                  onChange={(e) => setMeals((prev) => ({ ...prev, feedNotes: e.target.value }))}
                  placeholder="Feed tolerance, appetite, choking/coughing, supplements"
                  rows={2}
                  className="text-xs resize-none"
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  Output, Hydration & Sleep
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Input value={urineMorningMl} onChange={(e) => setUrineMorningMl(e.target.value)} placeholder="Urine AM ml" className="h-9 text-xs font-mono" />
                  <Input value={urineEveningMl} onChange={(e) => setUrineEveningMl(e.target.value)} placeholder="Urine PM ml" className="h-9 text-xs font-mono" />
                  <Input value={waterIntakeMl} onChange={(e) => setWaterIntakeMl(e.target.value)} placeholder="Water ml" className="h-9 text-xs font-mono" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={stoolPassed === true ? 'default' : 'outline'} size="sm" onClick={() => setStoolPassed(true)} className="h-8 text-xs">Stool Yes</Button>
                  <Button type="button" variant={stoolPassed === false ? 'default' : 'outline'} size="sm" onClick={() => setStoolPassed(false)} className="h-8 text-xs">Stool No</Button>
                  <Button type="button" variant={catheterChanged === true ? 'default' : 'outline'} size="sm" onClick={() => setCatheterChanged(true)} className="h-8 text-xs">Catheter Changed</Button>
                  <Button type="button" variant={catheterChanged === false ? 'default' : 'outline'} size="sm" onClick={() => setCatheterChanged(false)} className="h-8 text-xs">No Catheter Change</Button>
                </div>
                <Select value={sleep} onValueChange={(value) => setSleep(value as DailyCareLog['sleep'])}>
                  <SelectTrigger className="h-9 text-xs">
                    <Moon className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_recorded">Sleep not recorded</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Interrupted</SelectItem>
                    <SelectItem value="poor">Poor / restless</SelectItem>
                  </SelectContent>
                </Select>
              </section>
            </div>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Activity className="w-4 h-4 text-primary" />
                Monitoring Summary
              </div>
              <div className="overflow-x-auto border border-border/70 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left p-2 font-bold">Time</th>
                      <th className="text-left p-2 font-bold">Sugar</th>
                      <th className="text-left p-2 font-bold">BP</th>
                      <th className="text-left p-2 font-bold">Pulse</th>
                      <th className="text-left p-2 font-bold">SpO2</th>
                      <th className="text-left p-2 font-bold">Physio</th>
                      <th className="text-left p-2 font-bold">Exercise</th>
                      <th className="text-left p-2 font-bold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoringRows.map((row) => (
                      <tr key={row.id} className="border-t border-border/60">
                        <td className="p-2 font-semibold text-foreground min-w-[130px]">{row.timeLabel}</td>
                        <td className="p-2"><Input value={row.bloodSugar || ''} onChange={(e) => updateMonitoringRow(row.id, { bloodSugar: e.target.value })} className="h-8 min-w-[72px] text-xs font-mono" /></td>
                        <td className="p-2"><Input value={row.bp || ''} onChange={(e) => updateMonitoringRow(row.id, { bp: e.target.value })} className="h-8 min-w-[78px] text-xs font-mono" /></td>
                        <td className="p-2"><Input value={row.pulse || ''} onChange={(e) => updateMonitoringRow(row.id, { pulse: e.target.value })} className="h-8 min-w-[64px] text-xs font-mono" /></td>
                        <td className="p-2"><Input value={row.spo2 || ''} onChange={(e) => updateMonitoringRow(row.id, { spo2: e.target.value })} className="h-8 min-w-[64px] text-xs font-mono" /></td>
                        <td className="p-2"><Input value={row.physiotherapy || ''} onChange={(e) => updateMonitoringRow(row.id, { physiotherapy: e.target.value })} className="h-8 min-w-[88px] text-xs" /></td>
                        <td className="p-2"><Input value={row.exercise || ''} onChange={(e) => updateMonitoringRow(row.id, { exercise: e.target.value })} className="h-8 min-w-[88px] text-xs" /></td>
                        <td className="p-2"><Input value={row.remarks || ''} onChange={(e) => updateMonitoringRow(row.id, { remarks: e.target.value })} className="h-8 min-w-[120px] text-xs" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Pill className="w-4 h-4 text-amber-600" />
                Daily Medication Administration
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {logMeds.map((med) => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => toggleMedication(med.id)}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-colors',
                      med.given ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-border/70 bg-background hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">{med.label}</span>
                      <Badge variant={med.given ? 'default' : 'outline'} className="text-[10px]">{med.given ? 'Given' : 'Due'}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground capitalize mt-1">{med.slot}</p>
                  </button>
                ))}
              </div>
            </section>

            <Textarea
              value={generalRemarks}
              onChange={(e) => setGeneralRemarks(e.target.value)}
              placeholder="Overall condition, pain, drowsiness, agitation, skin redness, cough, missed care, escalation notes"
              rows={3}
              className="text-xs resize-none"
            />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Daily Update'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Recent Daily Updates
          </CardTitle>
          <CardDescription className="text-xs">
            Quick family-readable summary from nurse/medical-assistant bedside sheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center border border-dashed rounded-xl">
              No daily bedside updates recorded yet.
            </p>
          ) : (
            displayLogs.map((log) => {
              const medsGiven = log.medications.filter((med) => med.given).length;
              const firstVitals = log.monitoringRows.find((row) => row.bp || row.bloodSugar || row.spo2 || row.pulse);
              return (
                <div key={log.id} className="rounded-xl border border-border/70 bg-background p-3 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {format(new Date(log.date), 'dd MMM yyyy')}
                      </Badge>
                      <span className="font-bold text-foreground">{SHIFT_LABEL[log.shift]}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Updated {new Date(log.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <SummaryCell label="Vitals" value={firstVitals ? [firstVitals.bp, firstVitals.pulse && `${firstVitals.pulse} bpm`, firstVitals.spo2 && `${firstVitals.spo2}%`, firstVitals.bloodSugar && `${firstVitals.bloodSugar} sugar`].filter(Boolean).join(' | ') : 'Not logged'} />
                    <SummaryCell label="Feeds" value={[log.meals.breakfast, log.meals.lunch, log.meals.eveningSnack, log.meals.dinner].filter(Boolean).join(' | ') || 'Not logged'} />
                    <SummaryCell label="Meds" value={`${medsGiven}/${log.medications.length} given`} />
                    <SummaryCell label="Output" value={`Stool: ${log.stoolPassed === null ? 'n/a' : log.stoolPassed ? 'yes' : 'no'} | Urine: ${[log.urineMorningMl, log.urineEveningMl].filter(Boolean).join('+') || 'n/a'}`} />
                    <SummaryCell label="Sleep" value={log.sleep === 'not_recorded' ? 'Not logged' : log.sleep} />
                  </div>
                  {log.generalRemarks && <p className="text-muted-foreground leading-relaxed">{log.generalRemarks}</p>}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border/50 p-2 min-h-[58px]">
      <span className="block text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
      <span className="block text-[11px] font-semibold text-foreground leading-snug line-clamp-2">{value}</span>
    </div>
  );
}
