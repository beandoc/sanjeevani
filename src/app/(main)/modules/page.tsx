'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Activity,
  BookOpen,
  UserCheck,
  Stethoscope,
  Eye,
  ArrowLeft,
  Search,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/context/role-context';
import { caregiverModules, professionalModules, iconMap } from '@/lib/modules';
import { HealthRepository, PatientDependenceProfile } from '@/lib/db/health-repository';
import { getTailoredModuleIds, GENERAL_MODULE_IDS } from '@/lib/modules-personalization';
import {
  getAssignedModulesFor,
  getPatientProfileFor,
  getDyadInvite,
  listMyRoster
} from '@/lib/firebase/clinical-sync';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Module = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  isGeneral?: boolean;
  isTailored?: boolean;
};

const ModuleCard = ({
  module,
  tag,
  progress = 0
}: {
  module: Module;
  tag?: string;
  progress?: number;
}) => {
  const t = useTranslations('Modules.list');
  const tPage = useTranslations('Modules.page');
  const Icon = module.icon || ShieldAlert;

  const title = t.has(`${module.id}.title`) ? t(`${module.id}.title`) : module.title;
  const description = t.has(`${module.id}.description`) ? t(`${module.id}.description`) : module.description;

  const isCompleted = progress >= 100;
  const inProgress = progress > 0 && progress < 100;

  return (
    <Card
      key={module.id}
      className="flex flex-col border-border/70 bg-card hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden group rounded-2xl"
    >
      {/* Top Accent Gradient Line */}
      <div
        className={cn(
          'h-1 w-full',
          tag === 'Matched Diagnosis'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
            : tag === 'Assigned by Clinician'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-500'
            : 'bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800'
        )}
      />

      {tag && (
        <div className="absolute top-3.5 right-3.5">
          <Badge
            className={cn(
              'text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 shadow-xs',
              tag === 'Matched Diagnosis'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : tag === 'Assigned by Clinician'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-muted/80 text-muted-foreground border-border/80'
            )}
          >
            {tag}
          </Badge>
        </div>
      )}

      <CardHeader className="pt-5 pb-3">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0 group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all shadow-xs">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 pr-12">
            <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground border-border/60 py-0 mb-1">
              {module.category}
            </Badge>
            <CardTitle className="font-headline text-base font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow pb-4 space-y-3">
        <CardDescription className="text-xs leading-relaxed line-clamp-3 text-muted-foreground">
          {description}
        </CardDescription>

        {progress > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
              <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' : 'text-primary'}>
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                  </>
                ) : (
                  `${progress}% Completed`
                )}
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">Lesson Uptake</span>
            </div>
            <Progress value={progress} className={cn('h-1.5', isCompleted ? '[&>div]:bg-emerald-600' : '[&>div]:bg-primary')} />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <Button
          asChild
          className={cn(
            'w-full text-xs font-bold shadow-xs transition-all',
            isCompleted
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : inProgress
              ? 'bg-primary hover:bg-primary/90 text-white'
              : 'bg-primary/10 hover:bg-primary text-primary hover:text-white'
          )}
        >
          <Link href={`/modules/${module.id}`}>
            {isCompleted ? 'Review Module' : inProgress ? `Continue (${progress}%)` : tPage('startModule')}
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const CompetencySection = ({
  title,
  subtitle,
  icon: Icon,
  modules,
  badgeText,
  tag,
  progressMap
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  modules: Module[];
  badgeText: string;
  tag?: string;
  progressMap?: { [id: string]: number };
}) => {
  if (modules.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-xs">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold tracking-tight text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs w-fit border-border/80 px-2.5 py-0.5">
          {badgeText}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            tag={tag}
            progress={progressMap?.[module.id] || 0}
          />
        ))}
      </div>
    </div>
  );
};

const ModulesView = ({ modules }: { modules: Module[] }) => {
  const { caregivingScenario, moduleProgress } = useProfile();
  const { user } = useAuthUser();
  const searchParams = useSearchParams();
  const dyadParam = searchParams?.get('dyad');

  const [patient, setPatient] = useState<PatientDependenceProfile | null>(null);
  const [caregiverName, setCaregiverName] = useState<string | null>(null);
  const [assignedModuleIds, setAssignedModuleIds] = useState<string[]>([]);
  const [assignedByLabel, setAssignedByLabel] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function resolveData() {
      // 1. If explicit dyad parameter in URL (e.g. Clinician Preview of Dyad)
      let targetPatientUid = dyadParam || '';

      // 2. If not specified via param, resolve through active dyad / roster
      if (!targetPatientUid && user?.uid) {
        try {
          const roster = await listMyRoster();
          if (roster && roster.length > 0 && roster[0].patientUid) {
            targetPatientUid = roster[0].patientUid;
          }
        } catch {}
        if (!targetPatientUid) {
          const registered = HealthRepository.getRegisteredPatients();
          if (registered && registered.length > 0 && registered[0].patientUid) {
            targetPatientUid = registered[0].patientUid;
          }
        }
        if (!targetPatientUid) {
          targetPatientUid = user.uid;
        }
      }

      if (targetPatientUid) {
        const [prof, assigned] = await Promise.all([
          getPatientProfileFor(targetPatientUid),
          getAssignedModulesFor(targetPatientUid)
        ]);

        if (targetPatientUid.startsWith('dyad_')) {
          const inv = await getDyadInvite(targetPatientUid.replace('dyad_', ''));
          if (!cancelled && inv?.caregiverName) {
            setCaregiverName(inv.caregiverName);
          }
        }

        if (!cancelled && prof) {
          HealthRepository.savePatientProfile(prof);
          setPatient(prof);
        }
        if (!cancelled && assigned) {
          setAssignedModuleIds(assigned.moduleIds);
          setAssignedByLabel(assigned.assignedByLabel || 'your doctor');
        }
        if (prof) return;
      }

      // 3. Fallback to local storage profile
      if (!cancelled && typeof window !== 'undefined') {
        const local = HealthRepository.getPatientProfile();
        setPatient(local);
        const cg = HealthRepository.getCaregiverAttributes();
        if (cg?.name && !cg.name.includes('(You)')) {
          setCaregiverName(cg.name);
        }
      }
    }

    void resolveData();

    return () => {
      cancelled = true;
    };
  }, [dyadParam, user]);

  const filteredModules = useMemo(() => {
    if (!searchFilter.trim()) return modules;
    const q = searchFilter.toLowerCase();
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [modules, searchFilter]);

  const getCategorizedModules = () => {
    const { moduleIds: tailoredModuleIds, matchedLabels: activeDiagnosesLabels } = getTailoredModuleIds(
      patient?.primaryConditions,
      patient?.katzAdl
    );

    const generalModules = filteredModules.filter((m) => GENERAL_MODULE_IDS.includes(m.id));
    const tailoredModules = filteredModules.filter(
      (m) => tailoredModuleIds.has(m.id) && !GENERAL_MODULE_IDS.includes(m.id)
    );
    const assignedModules = filteredModules.filter(
      (m) => assignedModuleIds.includes(m.id) && !GENERAL_MODULE_IDS.includes(m.id) && !tailoredModuleIds.has(m.id)
    );
    const exploreModules = filteredModules.filter(
      (m) => !GENERAL_MODULE_IDS.includes(m.id) && !tailoredModuleIds.has(m.id) && !assignedModuleIds.includes(m.id)
    );

    return { activeDiagnosesLabels, generalModules, tailoredModules, assignedModules, exploreModules };
  };

  const { activeDiagnosesLabels, generalModules, tailoredModules, assignedModules, exploreModules } =
    getCategorizedModules();

  return (
    <div className="space-y-8">
      {/* Clinician Preview Header Banner if viewing via doctor portal */}
      {dyadParam && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Clinician Preview Mode:</strong> Viewing curriculum tailored for{' '}
              <strong>{caregiverName || 'Caregiver'}</strong> ({patient?.name || 'Patient'}).
            </span>
          </div>
          <Link href={`/clinic/dyad/${dyadParam}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-amber-500/40 text-amber-900 dark:text-amber-200">
              <ArrowLeft className="w-3 h-3" /> Back to Dyad
            </Button>
          </Link>
        </div>
      )}

      {/* Patient Specific Customized Banner */}
      {patient && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-xl border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold tracking-wider uppercase border border-emerald-400/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Tailored Caregiver Learning Curriculum
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-headline tracking-tight text-white">
              Personalized for {patient.name || 'Vishal gaurav'} (Age {patient.age || 80})
              {caregiverName && <span className="text-emerald-200/90 font-normal text-sm ml-2">• Caregiver: {caregiverName}</span>}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Curriculum dynamically prioritized according to Vishal&apos;s active clinical diagnoses, medication needs, and KATZ ADL independence score.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeDiagnosesLabels.length > 0 ? (
              activeDiagnosesLabels.map((lbl) => (
                <Badge key={lbl} className="bg-emerald-500/25 text-emerald-200 border-emerald-400/40 text-[11px] font-mono px-2.5 py-0.5">
                  {lbl}
                </Badge>
              ))
            ) : (
              <Badge className="bg-white/15 text-white border-white/20 text-[11px] font-mono">
                {caregivingScenario || 'General Geriatric Frailty'}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Quick Search Omnibar for Modules */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search modules by keyword, condition, or skill..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="pl-10 h-10 text-xs rounded-xl bg-card border-border/80 shadow-2xs"
        />
        {searchFilter && (
          <button
            onClick={() => setSearchFilter('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      {/* 1. General Baseline Topics for All Caregivers */}
      <CompetencySection
        title="1. General Core Topics (Universal for All Caregivers)"
        subtitle="Essential foundational topics every caregiver needs: aging physiology, daily routines, fall safety, and medication hygiene."
        icon={BookOpen}
        modules={generalModules}
        badgeText={`${generalModules.length} Core Modules`}
        tag="General Topic"
        progressMap={moduleProgress}
      />

      {/* 2. Specific Topics Tailored to Patient's Diagnoses */}
      {tailoredModules.length > 0 && (
        <CompetencySection
          title={`2. Specific Topics Tailored to ${patient?.name || 'Vishal gaurav'}'s Active Diagnoses`}
          subtitle="Specific condition management prioritized for active chronic conditions, dementia care, and ADL support requirements."
          icon={UserCheck}
          modules={tailoredModules}
          badgeText={`${tailoredModules.length} Targeted Modules`}
          tag="Matched Diagnosis"
          progressMap={moduleProgress}
        />
      )}

      {/* 2b. Explicitly Assigned by Clinician */}
      {assignedModules.length > 0 && (
        <CompetencySection
          title={`Clinician Assigned Learning (Assigned by ${assignedByLabel || 'Dr. Vivek'})`}
          subtitle="Learning priorities explicitly assigned by your consulting clinician for this dyad."
          icon={Stethoscope}
          modules={assignedModules}
          badgeText={`${assignedModules.length} Clinician Assigned`}
          tag="Assigned by Clinician"
          progressMap={moduleProgress}
        />
      )}

      {/* 3. Additional Topics */}
      <CompetencySection
        title="3. Explore Additional Clinical Topics"
        subtitle="Browse additional geriatric skillsets, specialized rehabilitation guides, and professional clinical references."
        icon={Activity}
        modules={exploreModules}
        badgeText={`${exploreModules.length} Additional Topics`}
        tag="Clinical Topic"
        progressMap={moduleProgress}
      />
    </div>
  );
};

function ModulesContent() {
  const { role } = useProfile();
  const t = useTranslations('Modules.page');

  // Safely default to 'professional' if doctor, otherwise 'caregiver' (including nurse or caregiver)
  const initialTab: 'caregiver' | 'professional' =
    role === 'doctor' || role === 'professional' ? 'professional' : 'caregiver';
  const [activeTab, setActiveTab] = useState<'caregiver' | 'professional'>(initialTab);

  const getModulesForRole = (r: 'caregiver' | 'professional') => {
    const source = r === 'caregiver' ? caregiverModules : professionalModules;
    return source.map((m) => ({ ...m, icon: iconMap[m.category] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
              <GraduationCap className="w-3 h-3 mr-1" /> Kutumbh Learning Academy
            </Badge>
            {role === 'nurse' && (
              <Badge variant="outline" className="text-[10px] font-mono border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10">
                Staff View
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-headline tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'caregiver' | 'professional')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-10 p-1 bg-muted/70 rounded-xl border border-border/50">
          <TabsTrigger value="caregiver" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">{t('caregiverTab')}</TabsTrigger>
          <TabsTrigger value="professional" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">{t('professionalTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="caregiver" className="pt-4 outline-none">
          <ModulesView modules={getModulesForRole('caregiver')} />
        </TabsContent>
        <TabsContent value="professional" className="pt-4 outline-none">
          <ModulesView modules={getModulesForRole('professional')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ModulesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground p-6">Loading curriculum…</p>}>
      <ModulesContent />
    </Suspense>
  );
}
