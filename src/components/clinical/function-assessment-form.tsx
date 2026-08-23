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
import { ClipboardPlus } from 'lucide-react';
import { BARTHEL_ITEMS, LAWTON_ITEMS, calculateFunctionScore } from '@/lib/clinical/function-scale';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';
import { cn } from '@/lib/utils';

interface FunctionAssessmentFormProps {
  onComplete: (result: FunctionEvaluationResult) => void | Promise<void>;
  trigger?: React.ReactNode;
}

/**
 * Barthel ADL + Lawton IADL intake, administered by the clinician (or
 * caregiver) at an OPD visit. Mirrors the same "clamp to nearest legal
 * value, default missing to 0" behavior as calculateFunctionScore itself —
 * the form just needs to supply a complete responses map before scoring.
 */
export function FunctionAssessmentForm({ onComplete, trigger }: FunctionAssessmentFormProps) {
  const [open, setOpen] = useState(false);
  const [barthelResponses, setBarthelResponses] = useState<Record<string, number>>({});
  const [lawtonResponses, setLawtonResponses] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const totalItems = BARTHEL_ITEMS.length + LAWTON_ITEMS.length;
  const answeredItems = Object.keys(barthelResponses).length + Object.keys(lawtonResponses).length;

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const result = calculateFunctionScore(barthelResponses, lawtonResponses);
      await onComplete(result);
      setOpen(false);
      setBarthelResponses({});
      setLawtonResponses({});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5 text-xs font-bold">
            <ClipboardPlus className="w-3.5 h-3.5" /> Record Function Assessment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Barthel ADL + Lawton IADL</DialogTitle>
          <DialogDescription>
            {answeredItems} of {totalItems} items answered. Unanswered items default to 0 (fully dependent) when saved.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-5 my-2">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Barthel Index (ADLs)</p>
            {BARTHEL_ITEMS.map((item) => (
              <div key={item.id} className="space-y-1.5 p-3 rounded-2xl border border-border/70 bg-card shadow-2xs">
                <Label className="text-xs font-semibold">{item.text.en}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                  {item.options.map((opt) => {
                    const isSelected = barthelResponses[item.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBarthelResponses((prev) => ({ ...prev, [item.id]: opt.value }))}
                        className={cn(
                          'flex items-center gap-1.5 p-2 rounded-xl border text-xs text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 font-bold text-primary shadow-xs ring-1 ring-primary/30'
                            : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                        )}
                      >
                        <span className="font-mono text-[10px] opacity-70">({opt.value} pts)</span>
                        <span className="truncate">{opt.label.en}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 pt-2 border-t border-border/60">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lawton IADL</p>
            {LAWTON_ITEMS.map((item) => (
              <div key={item.id} className="space-y-1.5 p-3 rounded-2xl border border-border/70 bg-card shadow-2xs">
                <Label className="text-xs font-semibold">{item.text.en}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {item.options.map((opt) => {
                    const isSelected = lawtonResponses[item.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLawtonResponses((prev) => ({ ...prev, [item.id]: opt.value }))}
                        className={cn(
                          'flex items-center gap-1.5 p-2 rounded-xl border text-xs text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 font-bold text-primary shadow-xs ring-1 ring-primary/30'
                            : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                        )}
                      >
                        <span className="font-mono text-[10px] opacity-70">({opt.value} pt)</span>
                        <span className="truncate">{opt.label.en}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSaving} className="font-bold">
            {isSaving ? 'Saving…' : 'Save Assessment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
