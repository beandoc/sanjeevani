'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  UserCheck,
  Stethoscope,
  HeartPulse,
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Bed,
  PhoneCall,
  Save,
  Droplet,
  Sparkles
} from 'lucide-react';
import { HealthRepository, VitalRecord } from '@/lib/db/health-repository';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function NurseShiftDashboard() {
  const { toast } = useToast();
  const patient = HealthRepository.getPatientProfile();

  const [shiftType, setShiftType] = useState<'day_12h' | 'night_12h' | 'live_in_24h'>('day_12h');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [spO2, setSpO2] = useState('');

  // Nursing Procedures Checklist
  const [procedures, setProcedures] = useState({
    morningBathSkinInspect: false,
    dentureLukewarmClean: false,
    q2hTurnCompleted: false,
    woundDressingChanged: false,
    catheterOutputMeasured: false,
    eveningMedsAdministered: false
  });

  const toggleProcedure = (key: keyof typeof procedures) => {
    setProcedures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogShiftVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic && !pulse && !bloodSugar) {
      toast({ variant: 'destructive', title: 'Empty Vitals', description: 'Enter at least one vital sign reading.' });
      return;
    }

    HealthRepository.addVital({
      date: new Date().toISOString(),
      bp: systolic && diastolic ? `${systolic}/${diastolic}` : systolic || undefined,
      pulse: pulse || undefined,
      bloodSugar: bloodSugar || undefined,
      sleep: 'average',
      notes: `Logged by Shift Nurse (${shiftType.replace('_', ' ')})${spO2 ? ` • SpO2: ${spO2}%` : ''}`
    });

    toast({
      title: 'Shift Vitals Recorded',
      description: 'Logged to permanent patient trajectory record.'
    });

    setSystolic('');
    setDiastolic('');
    setPulse('');
    setBloodSugar('');
    setSpO2('');
  };

  const completedCount = Object.values(procedures).filter(Boolean).length;
  const totalCount = Object.keys(procedures).length;

  return (
    <div className="space-y-6">
      {/* Nurse Shift Header */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-600 shrink-0 mt-0.5">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/30 uppercase">
                  Trained Nurse / Medical Attendant Portal
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Shift Active</span>
              </div>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                Bedside Clinical Handoff & Shift Tasks — {patient.name} (Age {patient.age})
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Log vital signs, record Medication Administration (MAR), and execute bedside pressure-ulcer prevention protocols.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/domiciliary">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                <Bed className="w-4 h-4" /> Bedside Companion
              </Button>
            </Link>
            <Link href="/vital-logs">
              <Button size="sm" className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                <Activity className="w-4 h-4" /> Vitals History
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Shift Vitals Logging & Nursing Tasks Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Shift Vitals Quick Log */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                Shift Vital Signs Log (MAR Entry)
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                Real-Time
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleLogShiftVitals} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">BP Systolic (mmHg)</label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">BP Diastolic (mmHg)</label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Pulse (bpm)</label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Blood Glucose (mg/dL)</label>
                  <Input
                    type="number"
                    placeholder="110"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">SpO2 Oxygen (%)</label>
                  <Input
                    type="number"
                    placeholder="98"
                    value={spO2}
                    onChange={(e) => setSpO2(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="w-3.5 h-3.5" /> Save Shift Readings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Card 2: Bedside Nursing Procedure Checklist */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                Shift Nursing Duties & Care Plan
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {completedCount} / {totalCount} Done
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-2.5">
            {[
              { key: 'morningBathSkinInspect', label: 'Morning Sponge Bath & Skin Check', desc: 'Mild soap, no-rub pat dry, sacral redness inspect' },
              { key: 'dentureLukewarmClean', label: 'Oral & Denture Hygiene', desc: 'Lukewarm water clean over towel-lined sink' },
              { key: 'q2hTurnCompleted', label: 'Q2H Lateral Turn & Heel Float', desc: '30° wedge oblique positioning and calf elevation' },
              { key: 'woundDressingChanged', label: 'Wound Dressing / Skin Flap Check', desc: 'Sterile saline rinse, non-adherent silicone dressing' },
              { key: 'catheterOutputMeasured', label: 'Catheter / Fluid Balance Log', desc: 'Drain bag measurement, inspect for turbidity' },
              { key: 'eveningMedsAdministered', label: 'Medication Administration Record (MAR)', desc: 'Verify 5 rights of medication dispensing' },
            ].map((task) => {
              const isChecked = procedures[task.key as keyof typeof procedures];
              return (
                <button
                  key={task.key}
                  type="button"
                  onClick={() => toggleProcedure(task.key as any)}
                  className={cn(
                    'w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all',
                    isChecked
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-foreground'
                      : 'border-border/60 bg-muted/20 hover:border-emerald-500/40 text-muted-foreground'
                  )}
                >
                  <div className="space-y-0.5">
                    <span className={cn('text-xs font-bold block text-foreground', isChecked && 'line-through opacity-80')}>
                      {task.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{task.desc}</span>
                  </div>
                  <div className={cn('w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ml-2', isChecked ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border')}>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
