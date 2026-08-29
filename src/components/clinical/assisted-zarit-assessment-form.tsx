'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { HeartHandshake, Sparkles, Activity } from 'lucide-react';
import {
  calculateZaritScore,
  getItemsForTier,
  LIKERT_OPTIONS,
  type ZaritEvaluationResult,
  type ZbiTier
} from '@/lib/zarit-scale';
import { cn } from '@/lib/utils';

interface AssistedZaritAssessmentFormProps {
  caregiverName?: string | null;
  patientName?: string;
  onComplete: (result: ZaritEvaluationResult) => void | Promise<void>;
  trigger?: React.ReactNode;
}

export function AssistedZaritAssessmentForm({
  caregiverName,
  patientName,
  onComplete,
  trigger
}: AssistedZaritAssessmentFormProps) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<ZbiTier>('ZBI12');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [assessmentDate, setAssessmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const items = getItemsForTier(tier);
  const answeredCount = items.filter((item) => responses[item.id] !== undefined).length;
  const isComplete = answeredCount === items.length;

  const handleTierChange = (newTier: ZbiTier) => {
    setTier(newTier);
    // keep responses for overlapping questions
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const result = calculateZaritScore(responses, tier);
      const dateObj = new Date(assessmentDate);
      const now = new Date();
      dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      result.completedAt = dateObj.toISOString();

      await onComplete(result);
      setOpen(false);
      setResponses({});
      setAssessmentDate(new Date().toISOString().split('T')[0]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10">
            <HeartHandshake className="w-3.5 h-3.5" /> Assess Caregiver Strain (ZBI)
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
              Assisted Caregiver Burden Assessment
            </DialogTitle>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleTierChange('ZBI4')}
                className={cn(
                  'px-2.5 py-0.5 text-xs font-semibold rounded-md transition-all',
                  tier === 'ZBI4' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                ZBI-4 (Rapid)
              </button>
              <button
                type="button"
                onClick={() => handleTierChange('ZBI12')}
                className={cn(
                  'px-2.5 py-0.5 text-xs font-semibold rounded-md transition-all',
                  tier === 'ZBI12' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                ZBI-12 (Standard)
              </button>
              <button
                type="button"
                onClick={() => handleTierChange('ZBI22')}
                className={cn(
                  'px-2.5 py-0.5 text-xs font-semibold rounded-md transition-all',
                  tier === 'ZBI22' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                ZBI-22 (Full)
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1.5">
            <DialogDescription className="text-xs">
              Administer directly with <strong>{caregiverName || 'the caregiver'}</strong> for {patientName || 'this patient'}.
              Unanswered questions default to 0 (Never).
            </DialogDescription>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground shrink-0">Assessment Date:</span>
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="h-7 text-xs px-2.5 rounded-lg border border-input bg-background font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 my-2">
          {items.map((item, idx) => (
            <div key={item.id} className="space-y-2 p-3.5 rounded-2xl border border-border/70 bg-card shadow-2xs">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-primary font-mono shrink-0 mt-0.5 bg-primary/10 px-1.5 py-0.5 rounded">
                  Q{idx + 1}
                </span>
                <Label className="text-xs font-semibold text-foreground leading-relaxed">
                  {item.text.en}
                </Label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                {LIKERT_OPTIONS.map((opt) => {
                  const isSelected = responses[item.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setResponses((prev) => ({ ...prev, [item.id]: opt.value }))}
                      className={cn(
                        'flex items-center gap-1.5 p-2 rounded-xl border text-xs text-left transition-all',
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10 font-bold text-rose-700 dark:text-rose-300 shadow-xs ring-1 ring-rose-500/30'
                          : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                      )}
                    >
                      <span className="font-mono text-[10px] opacity-70">({opt.value})</span>
                      <span className="truncate">{opt.label.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {answeredCount} of {items.length} answered
            </Badge>
          </div>
          <Button onClick={handleSubmit} disabled={isSaving} className="font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white">
            {isSaving ? 'Saving Assessment…' : 'Save Caregiver Strain Score'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
