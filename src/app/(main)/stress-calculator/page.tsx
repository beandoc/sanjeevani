'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ZaritCalculator } from '@/components/stress/zarit-calculator';
import { ZaritResultsView } from '@/components/stress/zarit-results-view';
import { ZaritEvaluationResult } from '@/lib/zarit-scale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  HeartPulse,
  Brain,
  ShieldCheck,
  Award,
  Sparkles,
  BookOpen,
  Users,
  Stethoscope,
  History
} from 'lucide-react';
import Link from 'next/link';

import { HealthRepository } from '@/lib/db/health-repository';
import {
  syncZaritAssessment,
  recordZaritAssessmentFor,
  getZaritAssessmentsFor,
  getPatientProfileFor,
  getCaregiverAttributesFor
} from '@/lib/firebase/clinical-sync';
import { loadCohortRoster } from '@/lib/analytics/cohort';
import { useToast } from '@/hooks/use-toast';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useProfile } from '@/context/role-context';
import { SyncStatusBanner } from '@/components/shared/sync-status-banner';

interface DyadOption {
  id: string; // 'primary' or patientUid
  patientName: string;
  patientAge?: number;
  caregiverName: string;
  caregiverKinship: string;
  dyadTag: string;
  lastScore?: number | null;
  lastCompletedAt?: string | null;
  riskBand?: string;
}

function StressCalculatorContent() {
  const searchParams = useSearchParams();
  const urlPatientUid = searchParams.get('patientUid');
  const { user } = useAuthUser();
  const { role } = useProfile();
  const { toast } = useToast();

  const [dyads, setDyads] = useState<DyadOption[]>([]);
  const [selectedDyadId, setSelectedDyadId] = useState<string>('primary');
  const [currentResult, setCurrentResult] = useState<ZaritEvaluationResult | null>(null);
  const [history, setHistory] = useState<ZaritEvaluationResult[]>([]);
  const [isLoadingDyads, setIsLoadingDyads] = useState(true);
  const [showHistoryView, setShowHistoryView] = useState(false);

  // 1. Load Available Dyads (Primary + Cohort + Registered Patients)
  useEffect(() => {
    let cancelled = false;
    async function initDyads() {
      setIsLoadingDyads(true);
      try {
        const primaryPt = HealthRepository.getPatientProfile();
        const primaryCg = HealthRepository.getCaregiverAttributes();
        const primaryZarit = HealthRepository.getZaritAssessments();

        const primaryOption: DyadOption = {
          id: 'primary',
          patientName: primaryPt.name || 'Vishal gaurav',
          patientAge: primaryPt.age || 80,
          caregiverName: primaryCg.name || 'Abhishek Rai',
          caregiverKinship: primaryCg.kinship || 'sibling',
          dyadTag: '#DYAD_PRIMARY',
          lastScore: primaryZarit[0]?.totalScore ?? null,
          lastCompletedAt: primaryZarit[0]?.completedAt ?? null,
          riskBand: primaryZarit[0]?.severityBand
        };

        const cohortRows = await loadCohortRoster().catch(() => []);
        const registered = HealthRepository.getRegisteredPatients();

        const registeredOptions: DyadOption[] = registered.map((reg) => ({
          id: reg.patientUid,
          patientName: reg.patientName,
          patientAge: reg.patientAge,
          caregiverName: reg.caregiverName || reg.caregiverAttributes?.name || 'Primary Caregiver',
          caregiverKinship: reg.caregiverAttributes?.kinship || 'family',
          dyadTag: `#DYAD_${reg.patientUid.slice(0, 8).toUpperCase()}`,
          lastScore: null,
          lastCompletedAt: null
        }));

        const cohortOptions: DyadOption[] = cohortRows
          .filter((row) => row.patientUid !== 'primary' && !registered.some((r) => r.patientUid === row.patientUid))
          .map((row) => ({
            id: row.patientUid,
            patientName: row.displayName.replace(/\s*\(Dyad\s*#\w+\)/i, ''),
            caregiverName: row.caregiverName || 'Primary Caregiver',
            caregiverKinship: row.caregiverKinship || 'family',
            dyadTag: row.patientUid.startsWith('demo-')
              ? `Dyad #${row.patientUid.replace('demo-', '').toUpperCase()}`
              : `#DYAD_${row.patientUid.slice(0, 8).toUpperCase()}`,
            lastScore: row.latestBurdenPct !== null ? Math.round((row.latestBurdenPct / 100) * 88) : null,
            lastCompletedAt: row.latestCompletedAt,
            riskBand: row.riskBand
          }));

        const combinedMap = new Map<string, DyadOption>();
        combinedMap.set('primary', primaryOption);
        registeredOptions.forEach((o) => combinedMap.set(o.id, o));
        cohortOptions.forEach((o) => combinedMap.set(o.id, o));

        // If a specific patientUid was requested via query parameter that wasn't in roster yet
        if (urlPatientUid && !combinedMap.has(urlPatientUid)) {
          const [remotePt, remoteCg, remoteZarit] = await Promise.all([
            getPatientProfileFor(urlPatientUid).catch(() => null),
            getCaregiverAttributesFor(urlPatientUid).catch(() => null),
            getZaritAssessmentsFor(urlPatientUid).catch(() => [])
          ]);
          combinedMap.set(urlPatientUid, {
            id: urlPatientUid,
            patientName: remotePt?.name || 'Selected Patient',
            patientAge: remotePt?.age,
            caregiverName: remoteCg?.name || 'Primary Caregiver',
            caregiverKinship: remoteCg?.kinship || 'family',
            dyadTag: `#DYAD_${urlPatientUid.slice(0, 8).toUpperCase()}`,
            lastScore: remoteZarit[0]?.totalScore ?? null,
            lastCompletedAt: remoteZarit[0]?.completedAt ?? null,
            riskBand: remoteZarit[0]?.severityBand
          });
        }

        const list = Array.from(combinedMap.values());
        if (!cancelled) {
          setDyads(list);
          const initialId = urlPatientUid && combinedMap.has(urlPatientUid) ? urlPatientUid : 'primary';
          setSelectedDyadId(initialId);
        }
      } finally {
        if (!cancelled) setIsLoadingDyads(false);
      }
    }

    void initDyads();
    return () => {
      cancelled = true;
    };
  }, [urlPatientUid]);

  // 2. Load Assessment History whenever selectedDyadId changes
  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (selectedDyadId === 'primary') {
        const local = HealthRepository.getZaritAssessments();
        if (!cancelled) setHistory(local);
        if (user?.uid) {
          const cloud = await getZaritAssessmentsFor(user.uid).catch(() => []);
          if (!cancelled && cloud.length > 0) {
            const merged = HealthRepository.mergeZaritAssessments(cloud);
            setHistory(merged);
          }
        }
      } else {
        const local = HealthRepository.getZaritAssessmentsFor(selectedDyadId);
        if (!cancelled) setHistory(local);
        const cloud = await getZaritAssessmentsFor(selectedDyadId).catch(() => []);
        if (!cancelled && cloud.length > 0) {
          setHistory(cloud);
        }
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedDyadId, user]);

  const activeDyad = dyads.find((d) => d.id === selectedDyadId) || dyads[0] || {
    id: 'primary',
    patientName: 'Vishal gaurav',
    patientAge: 80,
    caregiverName: 'Abhishek Rai',
    caregiverKinship: 'sibling',
    dyadTag: '#DYAD_PRIMARY'
  };

  const handleSwitchDyad = (newId: string) => {
    setSelectedDyadId(newId);
    setCurrentResult(null);
    setShowHistoryView(false);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newId === 'primary') {
        url.searchParams.delete('patientUid');
      } else {
        url.searchParams.set('patientUid', newId);
      }
      window.history.replaceState(null, '', url.toString());
    }
  };

  const handleComplete = async (res: ZaritEvaluationResult) => {
    setCurrentResult(res);

    if (selectedDyadId === 'primary') {
      const updated = HealthRepository.saveZaritAssessment(res);
      setHistory(updated);
      const { queued } = await syncZaritAssessment(res);
      toast({
        title: queued ? '☁️ Assessment Saved to Cloud' : '📱 Assessment Saved Locally',
        description: `ZBI score (${res.totalScore}/${res.maxScore} pts) recorded for caregiver ${activeDyad.caregiverName}.`,
      });
    } else {
      HealthRepository.saveZaritAssessmentFor(selectedDyadId, res);
      await recordZaritAssessmentFor(selectedDyadId, res);
      const refreshed = await getZaritAssessmentsFor(selectedDyadId).catch(() => []);
      setHistory(refreshed.length > 0 ? refreshed : [res]);
      toast({
        title: '☁️ Assessment Recorded for Patient Dyad',
        description: `Saved to ${activeDyad.patientName} medical record • Caregiver: ${activeDyad.caregiverName} (${res.totalScore}/${res.maxScore} pts).`,
      });
    }

    // Update dyad option in dropdown
    setDyads((prev) =>
      prev.map((d) =>
        d.id === selectedDyadId
          ? {
              ...d,
              lastScore: res.totalScore,
              lastCompletedAt: res.completedAt,
              riskBand: res.severityBand
            }
          : d
      )
    );

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetake = () => {
    setCurrentResult(null);
    setShowHistoryView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const patientInitials = activeDyad.patientName
    .replace(/^(Smt\.|Shri|Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PT';

  const latestHistorical = history[0] || null;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl space-y-6">
      <SyncStatusBanner />

      {/* Top Clinical Breadcrumb / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            <span>Sanjeevani Clinical Care</span>
            <span>•</span>
            <span className="text-primary font-bold">Caregiver Fatigue & Burden Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <HeartPulse className="w-8 h-8 text-primary" />
            Caregiver Stress & Burden Gauge
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/assessment-guide">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <BookOpen className="w-4 h-4" /> Clinical Guide
            </Button>
          </Link>
          <Link href="/modules">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Brain className="w-4 h-4" /> Learning Modules
            </Button>
          </Link>
          {(role === 'doctor' || role === 'nurse' || role === 'professional') && (
            <Link href="/clinic/roster">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold text-primary border-primary/30">
                <Users className="w-4 h-4" /> Patient Roster
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Patient Dyad Selector Card */}
      <Card className="border-primary/30 bg-primary/5 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-primary/10 bg-primary/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-bold text-foreground">
                Patient & Caregiver Dyad Context
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                Active Assessment Target
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Select who you are evaluating to record longitudinal psychometrics under their file.
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Active Dyad Identity */}
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-base shadow-sm ring-2 ring-blue-500/20 shrink-0">
                {patientInitials}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-foreground truncate">
                    {activeDyad.patientName}
                  </span>
                  {activeDyad.patientAge && (
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {activeDyad.patientAge} Yrs
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] font-mono border-border">
                    {activeDyad.dyadTag}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-foreground/90">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Caregiver: <strong className="text-foreground">{activeDyad.caregiverName}</strong>
                    {activeDyad.caregiverKinship && ` (${activeDyad.caregiverKinship})`}
                  </span>
                  <span>•</span>
                  <span>
                    {latestHistorical
                      ? `Last ZBI: ${latestHistorical.totalScore}/88 (${latestHistorical.tier || 'ZBI'})`
                      : 'No prior assessment on record'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Dyad Selector Dropdown */}
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <div className="w-full sm:w-72">
                <label htmlFor="dyad-switcher" className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  Switch Person / Dyad
                </label>
                <Select value={selectedDyadId} onValueChange={handleSwitchDyad} disabled={isLoadingDyads}>
                  <SelectTrigger id="dyad-switcher" className="h-9 text-xs font-semibold bg-background">
                    <SelectValue placeholder={isLoadingDyads ? 'Loading dyads…' : 'Select patient dyad'} />
                  </SelectTrigger>
                  <SelectContent className="max-w-xs sm:max-w-sm">
                    {dyads.map((dyad) => (
                      <SelectItem key={dyad.id} value={dyad.id} className="text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-foreground">
                            {dyad.patientName} {dyad.patientAge ? `(${dyad.patientAge}y)` : ''}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Caregiver: {dyad.caregiverName} ({dyad.caregiverKinship})
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {history.length > 0 && !currentResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistoryView(!showHistoryView)}
                  className="h-9 text-xs font-semibold mt-4 gap-1.5 shrink-0"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{showHistoryView ? 'Hide Prior' : `Prior (${history.length})`}</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional View: In-Progress Calculator OR Completed Results OR Historical View */}
      {currentResult ? (
        <ZaritResultsView
          result={currentResult}
          onRetake={handleRetake}
          pastAssessments={history}
          patientName={activeDyad.patientName}
          caregiverName={activeDyad.caregiverName}
        />
      ) : showHistoryView && latestHistorical ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Prior Assessment Record for {activeDyad.patientName} & {activeDyad.caregiverName}
            </h3>
            <Button size="sm" onClick={() => setShowHistoryView(false)} className="text-xs font-bold gap-1.5">
              <HeartPulse className="w-3.5 h-3.5" /> Start New Reassessment
            </Button>
          </div>
          <ZaritResultsView
            result={latestHistorical}
            onRetake={handleRetake}
            pastAssessments={history}
            patientName={activeDyad.patientName}
            caregiverName={activeDyad.caregiverName}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Information & Clinical Background Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/80 bg-primary/5 shadow-xs">
              <CardContent className="p-5 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Standardized ZBI Psychometrics</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Evaluates multi-factorial caregiver strain based on the internationally validated Zarit Burden Interview.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-muted/20 shadow-xs">
              <CardContent className="p-5 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-muted text-muted-foreground mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Burnout Risk Recognition</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Early identification of high caregiver strain so the family or clinician can add support sooner.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-muted/20 shadow-xs">
              <CardContent className="p-5 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-muted text-muted-foreground mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Reviewable Support Suggestions</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Provides tailored respite, tele-consultation, and task-sharing suggestions for family and clinician review.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Calculator Engine with Dyad Context */}
          <ZaritCalculator
            onComplete={handleComplete}
            patientName={activeDyad.patientName}
            caregiverName={activeDyad.caregiverName}
          />
        </div>
      )}
    </div>
  );
}

export default function StressCalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-6 max-w-6xl space-y-6">
          <div className="h-16 bg-muted/40 rounded-2xl animate-pulse" />
          <div className="h-32 bg-muted/20 rounded-2xl animate-pulse" />
          <div className="h-96 bg-muted/20 rounded-3xl animate-pulse" />
        </div>
      }
    >
      <StressCalculatorContent />
    </Suspense>
  );
}
