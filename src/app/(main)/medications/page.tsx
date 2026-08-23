'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pill,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  ShieldAlert,
  Info,
  CalendarCheck,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Search
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HealthRepository, MedicationItem } from '@/lib/db/health-repository';
import { syncMedications } from '@/lib/firebase/clinical-sync';
import { MedicationChecker, BeersWarning } from '@/lib/clinical/medication-checker';
import { useToast } from '@/hooks/use-toast';

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', icon: Sun, timeRange: '06:00 - 11:59' },
  { key: 'afternoon', label: 'Afternoon', icon: Sun, timeRange: '12:00 - 16:59' },
  { key: 'evening', label: 'Evening', icon: Sunset, timeRange: '17:00 - 20:59' },
  { key: 'bedtime', label: 'Bedtime', icon: Moon, timeRange: '21:00 - 05:59' },
] as const;

export default function MedicationsPage() {
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'bedtime'>('all');
  const { toast } = useToast();

  // Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once Daily');
  const [selectedSlots, setSelectedSlots] = useState<('morning' | 'afternoon' | 'evening' | 'bedtime')[]>(['morning']);
  const [foodRelation, setFoodRelation] = useState<'before' | 'after' | 'with' | 'any'>('after');
  const [instructions, setInstructions] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [detectedWarning, setDetectedWarning] = useState<BeersWarning | null>(null);

  useEffect(() => {
    const loaded = HealthRepository.getMedications();
    setMedications(loaded);
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const warning = MedicationChecker.checkBeersCriteria(val);
    setDetectedWarning(warning);
  };

  const toggleSlotSelection = (slot: 'morning' | 'afternoon' | 'evening' | 'bedtime') => {
    if (selectedSlots.includes(slot)) {
      if (selectedSlots.length === 1) return; // Keep at least one
      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Details',
        description: 'Please enter medication name and dosage.',
      });
      return;
    }

    const warning = MedicationChecker.checkBeersCriteria(name);

    const newMed: MedicationItem = {
      id: `med_${Date.now()}`,
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      timeOfDay: selectedSlots,
      foodRelation,
      instructions: instructions.trim() || undefined,
      prescribedBy: prescribedBy.trim() || undefined,
      beersWarning: warning?.rationale,
      takenSlots: [],
      takenToday: false,
      lastTakenDate: new Date().toISOString()
    };

    const updated = [...medications, newMed];
    HealthRepository.saveMedications(updated);
    const { queued } = await syncMedications(updated);
    setMedications(updated);

    // Reset Form
    setName('');
    setDosage('');
    setInstructions('');
    setPrescribedBy('');
    setSelectedSlots(['morning']);
    setDetectedWarning(null);
    setIsAddOpen(false);

    toast({
      title: queued ? '☁️ Medication Added — Saved to Cloud' : 'Medication Added',
      description: queued
        ? `${newMed.name} added and backed up to the cloud.`
        : `${newMed.name} added to the daily schedule.`,
    });
  };

  const handleToggleSlot = async (
    id: string,
    slot: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'sos'
  ) => {
    const updated = HealthRepository.toggleMedicationTaken(id, slot);
    await syncMedications(updated);
    setMedications(updated);
    const med = updated.find((m) => m.id === id);
    const isNowTaken = med?.takenSlots?.includes(slot);
    if (isNowTaken) {
      toast({
        title: 'Dose Recorded',
        description: `${med?.name} (${slot}) marked as taken today.`,
      });
    }
  };

  const handleToggleEntireMed = async (id: string) => {
    const updated = HealthRepository.toggleMedicationTaken(id);
    await syncMedications(updated);
    setMedications(updated);
  };

  const handleDeleteMed = async (id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    HealthRepository.saveMedications(updated);
    await syncMedications(updated);
    setMedications(updated);
    toast({
      title: 'Medication Removed',
      description: 'Medicine removed from schedule.',
    });
  };

  const filteredMeds = medications.filter((m) => {
    if (activeFilter === 'all') return true;
    return m.timeOfDay.includes(activeFilter);
  });

  // Dose Frequency Math: Denominator accounts for multiple daily doses
  const totalScheduledDoses = medications.reduce((sum, m) => sum + m.timeOfDay.length, 0);
  const completedDoses = medications.reduce(
    (sum, m) => sum + (m.takenSlots?.length || (m.takenToday ? m.timeOfDay.length : 0)),
    0
  );
  const doseAdherencePercentage =
    totalScheduledDoses > 0 ? Math.round((completedDoses / totalScheduledDoses) * 100) : 0;

  // Multi-drug Regimen Safety Evaluation (ACB Score & STOPP Interactions)
  const regimenEval = MedicationChecker.evaluateRegimen(medications);

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Pill className="w-4 h-4" />
            <span>Geriatric Medication Regimen</span>
          </div>
          <h1 className="text-3xl font-bold font-headline">Medication Reminders & Schedule</h1>
          <p className="text-muted-foreground text-sm">
            Dose-frequency tracking, daily adherence resets, and AGS Beers Criteria / ACB safety screening.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold text-xs shrink-0 shadow-md">
              <Plus className="w-4 h-4" />
              <span>Add Medication</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl">
            <form onSubmit={handleAddMedication}>
              <DialogHeader>
                <DialogTitle className="text-lg font-headline">Add Prescription Medicine</DialogTitle>
                <DialogDescription className="text-xs">
                  Enter dosage and timing details. We automatically screen for geriatric safety alerts.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="med-name" className="text-xs font-semibold">Medicine Brand / Generic Name</Label>
                  <Input
                    id="med-name"
                    placeholder="e.g. Telmisartan, Metformin, Combiflam..."
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="h-9 text-xs font-medium"
                  />
                </div>

                {/* Beers Warning Real-time Notice */}
                {detectedWarning && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Geriatric Caution (Beers Criteria Alert)</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {detectedWarning.rationale}
                    </p>
                    <p className="text-primary font-medium text-[11px]">
                      <strong>Safer Alternative:</strong> {detectedWarning.alternatives}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="med-dose" className="text-xs font-semibold">Dosage</Label>
                    <Input
                      id="med-dose"
                      placeholder="e.g. 500 mg, 1 tablet"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Once Daily" className="text-xs">Once Daily</SelectItem>
                        <SelectItem value="Twice Daily" className="text-xs">Twice Daily</SelectItem>
                        <SelectItem value="Thrice Daily" className="text-xs">Thrice Daily</SelectItem>
                        <SelectItem value="As Needed (SOS)" className="text-xs">As Needed (SOS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Scheduled Dose Times Today</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isSel = selectedSlots.includes(slot.key);
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => toggleSlotSelection(slot.key)}
                          className={`p-2 rounded-xl text-center border transition-all text-xs font-medium ${
                            isSel
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                              : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Food Relation</Label>
                    <Select value={foodRelation} onValueChange={(v: any) => setFoodRelation(v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="after" className="text-xs">After Food</SelectItem>
                        <SelectItem value="before" className="text-xs">Before Food (Empty Stomach)</SelectItem>
                        <SelectItem value="with" className="text-xs">With Meals</SelectItem>
                        <SelectItem value="any" className="text-xs">Anytime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="med-doc" className="text-xs font-semibold">Prescribing Doctor</Label>
                    <Input
                      id="med-doc"
                      placeholder="e.g. Dr. Arvind Sharma"
                      value={prescribedBy}
                      onChange={(e) => setPrescribedBy(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="med-notes" className="text-xs font-semibold">Special Instructions</Label>
                  <Input
                    id="med-notes"
                    placeholder="e.g. Take with warm water, check BP before taking..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="font-bold">
                  Save to Schedule
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Regimen Safety Alerts (ACB Score & STOPP Interactions) */}
      {regimenEval.warnings.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Cumulative Regimen Safety Review (ACB Score: {regimenEval.totalAcbScore})
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-800 dark:text-amber-300">
                STOPP/START Screen
              </Badge>
            </div>
            <CardDescription className="text-xs text-amber-900/80 dark:text-amber-300/80">
              {regimenEval.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-1 text-xs">
            {regimenEval.warnings.map((w, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-background/80 border border-amber-500/20 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-muted-foreground leading-relaxed">{w}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Daily Dose Adherence Summary */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Today&apos;s Dose Schedule & Adherence
            </CardTitle>
            <CardDescription className="text-xs">
              {completedDoses} of {totalScheduledDoses} scheduled doses administered today.
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {doseAdherencePercentage}% Completed
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Time-of-Day Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('all')}
          className="rounded-xl text-xs font-semibold shrink-0"
        >
          All ({medications.length} Meds)
        </Button>
        {TIME_SLOTS.map((slot) => {
          const count = medications.filter((m) => m.timeOfDay.includes(slot.key)).length;
          return (
            <Button
              key={slot.key}
              variant={activeFilter === slot.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(slot.key)}
              className="rounded-xl text-xs font-semibold shrink-0 gap-1.5"
            >
              <slot.icon className="w-3.5 h-3.5 text-primary" />
              <span>{slot.label}</span>
              <span className="font-mono text-[10px] opacity-75">({count})</span>
            </Button>
          );
        })}
      </div>

      {/* Medications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeds.length > 0 ? (
          filteredMeds.map((med) => {
            const warning = MedicationChecker.checkBeersCriteria(med.name);
            const isAllTaken = med.takenToday;

            return (
              <Card
                key={med.id}
                className={`flex flex-col justify-between border transition-all rounded-3xl overflow-hidden ${
                  isAllTaken
                    ? 'border-border bg-card/60 opacity-80'
                    : 'border-border bg-card hover:border-primary/40 shadow-xs'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-foreground">{med.name}</h3>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {med.dosage}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {med.frequency} • {med.foodRelation === 'after' ? 'After food' : med.foodRelation === 'before' ? 'Before food' : 'With meals'}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMed(med.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 flex-grow">
                  {/* Dose Slot Toggles */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Today&apos;s Dose Slots</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {med.timeOfDay.map((slot) => {
                        const isSlotTaken = med.takenSlots?.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleToggleSlot(med.id, slot)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              isSlotTaken
                                ? 'border-emerald-500/80 bg-emerald-500/15 text-emerald-900 dark:text-emerald-300'
                                : 'border-border bg-background hover:border-primary/50 text-foreground'
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSlotTaken ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-muted-foreground/40'
                              }`}
                            >
                              {isSlotTaken && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <span className="capitalize">{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Special Instructions & Prescriber */}
                  {(med.instructions || med.prescribedBy) && (
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-0.5">
                      {med.instructions && <p><strong>Notes:</strong> {med.instructions}</p>}
                      {med.prescribedBy && <p><strong>Prescribed by:</strong> {med.prescribedBy}</p>}
                    </div>
                  )}

                  {/* Beers Caution Notice */}
                  {warning && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{warning.drugClass}</span>
                      </div>
                      <p className="leading-relaxed opacity-90">{warning.recommendation}</p>
                    </div>
                  )}
                </CardContent>

                <CardContent className="pt-0 border-t border-border/40 mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {med.takenSlots?.length || 0} of {med.timeOfDay.length} taken
                  </span>
                  <Button
                    size="sm"
                    variant={isAllTaken ? 'outline' : 'default'}
                    onClick={() => handleToggleEntireMed(med.id)}
                    className="text-xs font-bold gap-1.5 h-8"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAllTaken ? 'All Doses Taken' : 'Mark All Today'}</span>
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-12 text-muted-foreground border border-dashed rounded-3xl">
            <Pill className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm font-medium">No medications in this time slot</p>
            <p className="text-xs">Click &quot;Add Medication&quot; above to schedule prescriptions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
