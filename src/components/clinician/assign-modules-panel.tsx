'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { caregiverModules } from '@/lib/modules';
import { getTailoredModuleIds, GENERAL_MODULE_IDS } from '@/lib/modules-personalization';
import { assignModulesFor, getAssignedModulesFor, getPatientProfileFor } from '@/lib/firebase/clinical-sync';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AssignModulesPanelProps {
  patientUid: string;
  clinicianLabel?: string;
}

/**
 * Doctor-side module assignment for one roster patient's caregiver.
 * Pre-checks the comorbidity-suggested set (shared logic with the
 * caregiver's own /modules page — see modules-personalization.ts) and lets
 * the doctor add or remove from the full catalogue before assigning.
 */
export function AssignModulesPanel({ patientUid, clinicianLabel }: AssignModulesPanelProps) {
  const { toast } = useToast();
  const [suggestedIds, setSuggestedIds] = useState<Set<string>>(new Set());
  const [matchedLabels, setMatchedLabels] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previouslyAssignedIds, setPreviouslyAssignedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getPatientProfileFor(patientUid), getAssignedModulesFor(patientUid)]).then(
      ([profile, assigned]) => {
        if (cancelled) return;
        const { moduleIds, matchedLabels: labels } = getTailoredModuleIds(
          profile?.primaryConditions,
          profile?.katzAdl
        );
        setSuggestedIds(moduleIds);
        setMatchedLabels(labels);
        const initial = assigned?.moduleIds?.length ? new Set(assigned.moduleIds) : new Set(moduleIds);
        setSelectedIds(initial);
        setPreviouslyAssignedIds(new Set(assigned?.moduleIds || []));
        setIsLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [patientUid]);

  const toggleModule = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    setIsSaving(true);
    try {
      await assignModulesFor(patientUid, Array.from(selectedIds), clinicianLabel);
      setPreviouslyAssignedIds(new Set(selectedIds));
      toast({
        title: 'Modules Assigned',
        description: `${selectedIds.size} module${selectedIds.size === 1 ? '' : 's'} will now appear in the caregiver's learning curriculum.`
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Assign Modules',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const suggestedModules = caregiverModules.filter((m) => suggestedIds.has(m.id) && !GENERAL_MODULE_IDS.includes(m.id));
  const otherModules = caregiverModules.filter((m) => !suggestedIds.has(m.id) && !GENERAL_MODULE_IDS.includes(m.id));
  const hasChanges =
    selectedIds.size !== previouslyAssignedIds.size ||
    Array.from(selectedIds).some((id) => !previouslyAssignedIds.has(id));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Assign Learning Modules
        </CardTitle>
        <CardDescription className="text-xs">
          {matchedLabels.length > 0
            ? `Suggested from active conditions: ${matchedLabels.join(', ')}`
            : 'No comorbidity-based suggestions yet — pick manually below.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading suggestions…</p>
        ) : (
          <>
            {suggestedModules.length > 0 && (
              <div className="space-y-1.5">
                {suggestedModules.map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      'flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors',
                      selectedIds.has(m.id) ? 'border-primary/50 bg-primary/5' : 'border-border/60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleModule(m.id)}
                      className="mt-0.5 rounded-sm text-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{m.title}</p>
                      <p className="text-[10px] text-muted-foreground">{m.category}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAllModules(!showAllModules)}
              className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
            >
              {showAllModules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showAllModules ? 'Hide full catalogue' : `Browse all modules (${otherModules.length} more)`}
            </button>

            {showAllModules && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {otherModules.map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      'flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors',
                      selectedIds.has(m.id) ? 'border-primary/50 bg-primary/5' : 'border-border/60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleModule(m.id)}
                      className="mt-0.5 rounded-sm text-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{m.title}</p>
                      <p className="text-[10px] text-muted-foreground">{m.category}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <Badge variant="outline" className="text-[10px] font-mono">
                {selectedIds.size} selected
              </Badge>
              <Button
                size="sm"
                onClick={handleAssign}
                disabled={isSaving || !hasChanges}
                className="text-xs font-bold"
              >
                {isSaving ? 'Assigning…' : 'Assign Selected to Caregiver'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
