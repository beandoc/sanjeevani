'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Download, Trash2, AlertTriangle, CheckCircle2, Lock, FileJson } from 'lucide-react';
import { HealthRepository, UserConsentPreferences } from '@/lib/db/health-repository';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConsentManagerProps {
  mode?: 'full' | 'banner' | 'dialog';
  onConsentChange?: (consent: UserConsentPreferences) => void;
}

export function ConsentManager({ mode = 'full', onConsentChange }: ConsentManagerProps) {
  const [consent, setConsent] = useState<UserConsentPreferences>(HealthRepository.getConsent());
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setConsent(HealthRepository.getConsent());
  }, []);

  const handleToggleVitals = (checked: boolean) => {
    const updated = HealthRepository.saveConsent({
      vitalsTrackingConsent: checked,
      hasConsented: checked || consent.psychometricConsent
    });
    setConsent(updated);
    onConsentChange?.(updated);
    toast({
      title: checked ? 'Vitals Consent Granted' : 'Vitals Consent Revoked',
      description: checked ? 'Health and vitals logging is now active.' : 'Vitals tracking has been paused.',
    });
  };

  const handleTogglePsychometrics = (checked: boolean) => {
    const updated = HealthRepository.saveConsent({
      psychometricConsent: checked,
      hasConsented: checked || consent.vitalsTrackingConsent
    });
    setConsent(updated);
    onConsentChange?.(updated);
    toast({
      title: checked ? 'Assessment Consent Granted' : 'Assessment Consent Revoked',
      description: checked ? 'Zarit burden scale tracking is now active.' : 'Assessment logging has been paused.',
    });
  };

  const handleGrantAll = () => {
    const updated = HealthRepository.saveConsent({
      hasConsented: true,
      vitalsTrackingConsent: true,
      psychometricConsent: true
    });
    setConsent(updated);
    onConsentChange?.(updated);
    toast({
      title: 'Consent Acknowledged',
      description: 'You have enabled health logging in accordance with DPDP Act 2023 guidelines.',
    });
  };

  const handleExportData = () => {
    try {
      setIsExporting(true);
      const data = HealthRepository.exportAllUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sanjeevani_health_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Health Data Exported',
        description: 'Your portable JSON archive has been downloaded successfully.',
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Could not generate the data archive.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAll = () => {
    HealthRepository.deleteAllUserData();
    const resetConsent = HealthRepository.getConsent();
    setConsent(resetConsent);
    onConsentChange?.(resetConsent);
    toast({
      variant: 'destructive',
      title: 'Health Records Erased',
      description: 'All local health records, vitals, assessments, and progress have been permanently wiped.',
    });
  };

  if (mode === 'banner' && !consent.hasConsented) {
    return (
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-foreground">Health Data Consent (DPDP Act 2023)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sanjeevani stores your vitals and assessments securely on your device. We require your explicit permission to log health parameters.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={handleGrantAll} className="font-bold text-xs">
            Accept & Enable Logging
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border bg-card/70 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-headline">DPDP Act 2023 Consent & Data Rights</CardTitle>
              <CardDescription className="text-xs">
                Manage your explicit consent preferences, download your health records, or exercise your Right to Erasure.
              </CardDescription>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
            Version 2026.1
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Consent Toggles */}
        <div className="space-y-4 rounded-xl p-4 bg-background border border-border/70">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="vitals-consent" className="text-sm font-bold text-foreground cursor-pointer">
                Vitals & Clinical Parameter Logging
              </Label>
              <p className="text-xs text-muted-foreground">
                Authorize storing blood pressure, pulse, blood glucose, and sleep tracking entries.
              </p>
            </div>
            <Switch
              id="vitals-consent"
              checked={consent.vitalsTrackingConsent}
              onCheckedChange={handleToggleVitals}
            />
          </div>

          <div className="border-t border-border/50 pt-3 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="psycho-consent" className="text-sm font-bold text-foreground cursor-pointer">
                Psychometric & Zarit Burden Assessments
              </Label>
              <p className="text-xs text-muted-foreground">
                Authorize saving Zarit scale evaluation responses and calculated burden severity metrics.
              </p>
            </div>
            <Switch
              id="psycho-consent"
              checked={consent.psychometricConsent}
              onCheckedChange={handleTogglePsychometrics}
            />
          </div>
        </div>

        {/* User Rights Actions (Export & Delete) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full sm:w-auto gap-2 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export My Health Data (JSON)</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full sm:w-auto gap-2 text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Erase All My Health Data</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <div className="flex items-center gap-2 text-destructive font-bold text-base">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Right to Erasure (DPDP Act 2023)</span>
                </div>
                <AlertDialogTitle className="text-lg">Permanently Delete All Health Records?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs leading-relaxed">
                  This action is irreversible. All recorded vitals, scheduled appointments, Zarit psychometric assessments, and learning module section completions will be permanently wiped from your device.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl text-xs font-medium">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} className="rounded-xl text-xs font-bold bg-destructive hover:bg-destructive/90">
                  Yes, Erase Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
