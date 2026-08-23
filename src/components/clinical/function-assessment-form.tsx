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
        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-5">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Barthel Index (ADLs)</p>
              {BARTHEL_ITEMS.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <Label className="text-sm font-semibold">{item.text.en}</Label>
                  <RadioGroup
                    value={String(barthelResponses[item.id] ?? '')}
                    onValueChange={(v) => setBarthelResponses((prev) => ({ ...prev, [item.id]: Number(v) }))}
                    className="space-y-1"
                  >
                    {item.options.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={String(opt.value)} id={`${item.id}-${opt.value}`} />
                        <Label htmlFor={`${item.id}-${opt.value}`} className="text-xs font-normal cursor-pointer">
                          {opt.label.en} ({opt.value})
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
            <div className="space-y-4 pt-2 border-t border-border/60">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lawton IADL</p>
              {LAWTON_ITEMS.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <Label className="text-sm font-semibold">{item.text.en}</Label>
                  <RadioGroup
                    value={String(lawtonResponses[item.id] ?? '')}
                    onValueChange={(v) => setLawtonResponses((prev) => ({ ...prev, [item.id]: Number(v) }))}
                    className="space-y-1"
                  >
                    {item.options.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={String(opt.value)} id={`${item.id}-${opt.value}`} />
                        <Label htmlFor={`${item.id}-${opt.value}`} className="text-xs font-normal cursor-pointer">
                          {opt.label.en} ({opt.value})
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSaving} className="font-bold">
            {isSaving ? 'Saving…' : 'Save Assessment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
