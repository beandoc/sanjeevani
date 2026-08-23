'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ShieldAlert,
  CalendarCheck,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  HeartPulse,
  Info
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
import { MedicationChecker, BeersWarning } from '@/lib/clinical/medication-checker';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function MedicationsPage() {
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'bedtime'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();

  // Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once Daily');
  const [timeSlots, setTimeSlots] = useState<('morning' | 'afternoon' | 'evening' | 'bedtime')[]>(['morning']);
  const [foodRelation, setFoodRelation] = useState<'before' | 'after' | 'with' | 'any'>('after');
  const [instructions, setInstructions] = useState('');
  const [detectedWarning, setDetectedWarning] = useState<BeersWarning | null>(null);

  useEffect(() => {
    setMedications(HealthRepository.getMedications());
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const warning = MedicationChecker.checkBeersCriteria(val);
    setDetectedWarning(warning);
  };

  const toggleTimeSlot = (slot: 'morning' | 'afternoon' | 'evening' | 'bedtime') => {
    if (timeSlots.includes(slot)) {
      if (timeSlots.length > 1) {
        setTimeSlots(timeSlots.filter((s) => s !== slot));
      }
    } else {
      setTimeSlots([...timeSlots, slot]);
    }
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Required Fields Missing',
        description: 'Please provide the medicine name and dosage.',
      });
      return;
    }

    const newMed: MedicationItem = {
      id: `med_${Date.now()}`,
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      timeOfDay: timeSlots,
      foodRelation,
      instructions: instructions.trim() || undefined,
      beersWarning: detectedWarning ? detectedWarning.rationale : undefined,
      takenToday: false,
    };

    const updated = [newMed, ...medications];
    HealthRepository.saveMedications(updated);
    setMedications(updated);

    // Reset Form
    setName('');
    setDosage('');
    setInstructions('');
    setDetectedWarning(null);
    setIsAddOpen(false);

    toast({
      title: 'Medication Added',
      description: `${newMed.name} has been added to the active schedule.`,
    });
  };

  const handleToggleTaken = (id: string) => {
    const updated = HealthRepository.toggleMedicationTaken(id);
    setMedications(updated);
    const med = updated.find((m) => m.id === id);
    if (med?.takenToday) {
      toast({
        title: '✅ Dose Recorded',
        description: `Marked ${med.name} as taken for today.`,
      });
    }
  };

  const handleDeleteMed = (id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    HealthRepository.saveMedications(updated);
    setMedications(updated);
    toast({
      title: '🗑️ Medication Removed',
      description: 'Medicine removed from schedule.',
    });
  };

  const filteredMeds = medications.filter((m) => {
    if (activeFilter === 'all') return true;
    return m.timeOfDay.includes(activeFilter);
  });

  const takenCount = medications.filter((m) => m.takenToday).length;
  const adherencePercentage = medications.length > 0 ? Math.round((takenCount / medications.length) * 100) : 0;

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
            Track daily dosages, adhere to timing, and monitor Beers criteria safety warnings.
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
                    <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed text-[11px]">
                      {detectedWarning.rationale}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Recommendation: {detectedWarning.recommendation}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="med-dose" className="text-xs font-semibold">Dosage</Label>
                    <Input
                      id="med-dose"
                      placeholder="e.g. 40 mg, 1 tablet"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Food Relation</Label>
                    <Select value={foodRelation} onValueChange={(v: any) => setFoodRelation(v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before" className="text-xs">Before Food (Empty Stomach)</SelectItem>
                        <SelectItem value="after" className="text-xs">After Food</SelectItem>
                        <SelectItem value="with" className="text-xs">With Meals</SelectItem>
                        <SelectItem value="any" className="text-xs">Anytime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Time of Day Multi-select */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Scheduled Times of Day</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'morning', label: 'Morning', icon: Sun },
                      { key: 'afternoon', label: 'Noon', icon: Sun },
                      { key: 'evening', label: 'Evening', icon: Sunset },
                      { key: 'bedtime', label: 'Night', icon: Moon },
                    ].map((slot) => {
                      const isSelected = timeSlots.includes(slot.key as any);
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => toggleTimeSlot(slot.key as any)}
                          className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-background text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          <slot.icon className="w-3.5 h-3.5" />
                          <span>{slot.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="med-instructions" className="text-xs font-semibold">Special Instructions</Label>
                  <Input
                    id="med-instructions"
                    placeholder="e.g. Check pulse before taking; drink 1 full glass of water."
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

      {/* Adherence Overview Banner */}
      <Card className="border-border bg-card/60 shadow-sm overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-primary" /> Today&apos;s Adherence Progress
              </span>
              <h3 className="text-xl font-extrabold text-foreground">
                {takenCount} of {medications.length} Doses Recorded
              </h3>
              <p className="text-xs text-muted-foreground">
                Regular adherence prevents emergency readmissions and blood pressure spikes.
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5 min-w-[180px]">
              <span className="text-2xl font-black font-mono text-primary">{adherencePercentage}%</span>
              <Progress value={adherencePercentage} className="h-2.5 w-full bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time-of-Day Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Doses' },
          { key: 'morning', label: 'Morning (08:00 AM)', icon: Sun },
          { key: 'afternoon', label: 'Afternoon (01:00 PM)', icon: Sun },
          { key: 'evening', label: 'Evening (06:00 PM)', icon: Sunset },
          { key: 'bedtime', label: 'Bedtime (09:00 PM)', icon: Moon },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(tab.key as any)}
            className="rounded-xl text-xs font-semibold shrink-0 gap-1.5"
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Medication Cards List */}
      <div className="space-y-3">
        {filteredMeds.length > 0 ? (
          filteredMeds.map((med) => {
            const warning = MedicationChecker.checkBeersCriteria(med.name);
            return (
              <Card
                key={med.id}
                className={`border transition-all overflow-hidden ${
                  med.takenToday
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-card border-border hover:border-primary/40'
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-base text-foreground">{med.name}</h4>
                      <Badge variant="outline" className="font-mono text-xs">
                        {med.dosage}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {med.foodRelation === 'before'
                          ? 'Empty Stomach'
                          : med.foodRelation === 'after'
                          ? 'After Food'
                          : med.foodRelation === 'with'
                          ? 'With Meals'
                          : 'Anytime'}
                      </Badge>
                      {warning && (
                        <Badge variant="destructive" className="text-[10px] font-bold gap-1">
                          <AlertTriangle className="w-3 h-3" /> Beers Caution
                        </Badge>
                      )}
                    </div>

                    {med.instructions && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{med.instructions}</span>
                      </p>
                    )}

                    {warning && (
                      <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive text-[11px] leading-relaxed">
                        <strong>Clinical Alert:</strong> {warning.rationale}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      size="sm"
                      variant={med.takenToday ? 'default' : 'outline'}
                      onClick={() => handleToggleTaken(med.id)}
                      className={`gap-1.5 font-bold text-xs rounded-xl h-10 px-4 transition-all ${
                        med.takenToday
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'border-primary/40 text-primary hover:bg-primary/10'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{med.takenToday ? 'Taken Today' : 'Mark as Taken'}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMed(med.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16 border border-dashed rounded-3xl">
            <Pill className="w-12 h-12 mb-3 text-muted-foreground/50" />
            <h4 className="font-bold text-base text-foreground">No Medications for this Filter</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Add a new prescription or switch tabs to view the complete schedule.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
