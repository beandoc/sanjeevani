'use client';

import { useState, useEffect, Suspense } from 'react';
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
  HeartPulse,
  BrainCircuit,
  Activity,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Stethoscope,
  Eye,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/context/role-context';
import { caregiverModules, professionalModules, iconMap } from '@/lib/modules';
import { HealthRepository, PatientDependenceProfile } from '@/lib/db/health-repository';
import { getTailoredModuleIds, GENERAL_MODULE_IDS } from '@/lib/modules-personalization';
import { getAssignedModulesFor, getPatientProfileFor, getDyadInvite } from '@/lib/firebase/clinical-sync';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useTranslations } from 'next-intl';

type Module = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  isGeneral?: boolean;
  isTailored?: boolean;
};

const ModuleCard = ({ module, tag }: { module: Module; tag?: string }) => {
  const t = useTranslations('Modules.list');
  const tPage = useTranslations('Modules.page');
  const Icon = module.icon || ShieldAlert;

  const title = t.has(`${module.id}.title`) ? t(`${module.id}.title`) : module.title;
  const description = t.has(`${module.id}.description`) ? t(`${module.id}.description`) : module.description;

  return (
    <Card key={module.id} className="flex flex-col border-border/80 bg-card hover:border-primary/50 hover:shadow-lg transition-all relative overflow-hidden group">
      {tag && (
        <div className="absolute top-3 right-3">
          <Badge
            variant={tag === 'Matched Diagnosis' ? 'default' : tag === 'Assigned by Doctor' ? 'destructive' : tag === 'General Topic' ? 'secondary' : 'outline'}
            className={
              tag === 'Matched Diagnosis'
                ? 'bg-emerald-600 text-white text-[9px] font-mono'
                : tag === 'Assigned by Doctor'
                ? 'bg-primary text-white text-[9px] font-mono'
                : 'text-[9px] font-mono'
            }
          >
            {tag}
          </Badge>
        </div>
      )}
      <CardHeader className="pt-5 pb-3">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="font-headline text-base font-bold leading-tight pr-14">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-4">
        <CardDescription className="text-xs leading-relaxed line-clamp-3">{description}</CardDescription>
      </CardContent>
      <CardFooter className="pt-0 pb-4">
        <Button asChild className="w-full text-xs font-bold shadow-xs group-hover:bg-primary/90">
          <Link href={`/modules/${module.id}`}>
            {tPage('startModule')} <ArrowRight className="ml-2 h-4 w-4" />
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
  tag
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  modules: Module[];
  badgeText: string;
  tag?: string;
}) => {
  if (modules.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold tracking-tight text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs w-fit">
          {badgeText}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} tag={tag} />
        ))}
      </div>
    </div>
  );
};

const ModulesView = ({ modules, role }: { modules: Module[]; role: 'caregiver' | 'professional' }) => {
  const { caregivingScenario } = useProfile();
  const { user } = useAuthUser();
  const searchParams = useSearchParams();
  const dyadParam = searchParams?.get('dyad');

  const [patient, setPatient] = useState<PatientDependenceProfile | null>(null);
  const [caregiverName, setCaregiverName] = useState<string | null>(null);
  const [assignedModuleIds, setAssignedModuleIds] = useState<string[]>([]);
  const [assignedByLabel, setAssignedByLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveData() {
      // 1. If explicit dyad parameter in URL (e.g. Clinician Preview of Dyad)
      if (dyadParam) {
        const [prof, assigned] = await Promise.all([
          getPatientProfileFor(dyadParam),
          getAssignedModulesFor(dyadParam)
        ]);

        if (dyadParam.startsWith('dyad_')) {
          const inv = await getDyadInvite(dyadParam.replace('dyad_', ''));
          if (!cancelled && inv?.caregiverName) {
            setCaregiverName(inv.caregiverName);
          }
        }

        if (!cancelled && prof) {
          setPatient(prof);
          if (assigned) {
            setAssignedModuleIds(assigned.moduleIds);
            setAssignedByLabel(assigned.assignedByLabel || 'your doctor');
          }
          return;
        }
      }

      // 2. If logged in caregiver user
      if (user) {
        const [prof, assigned] = await Promise.all([
          getPatientProfileFor(user.uid),
          getAssignedModulesFor(user.uid)
        ]);
        if (!cancelled && prof) {
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
      }
    }

    void resolveData();

    return () => {
      cancelled = true;
    };
  }, [dyadParam, user]);

  const getCategorizedModules = () => {
    const { moduleIds: tailoredModuleIds, matchedLabels: activeDiagnosesLabels } = getTailoredModuleIds(
      patient?.primaryConditions,
      patient?.katzAdl
    );

    const generalModules = modules.filter((m) => GENERAL_MODULE_IDS.includes(m.id));
    const tailoredModules = modules.filter(
      (m) => tailoredModuleIds.has(m.id) && !GENERAL_MODULE_IDS.includes(m.id)
    );
    const assignedModules = modules.filter(
      (m) => assignedModuleIds.includes(m.id) && !GENERAL_MODULE_IDS.includes(m.id) && !tailoredModuleIds.has(m.id)
    );
    const exploreModules = modules.filter(
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
        <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 text-white shadow-xl border border-primary/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-wider uppercase border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Tailored Caregiver Learning Curriculum
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-headline tracking-tight text-white">
              Personalized for {patient.name || 'Your Loved One'} (Age {patient.age || 75})
              {caregiverName && <span className="text-white/80 font-normal text-sm ml-2">• Caregiver: {caregiverName}</span>}
            </h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Modules are dynamically prioritized based on active clinical diagnoses, medication requirements, and KATZ ADL independence level.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeDiagnosesLabels.length > 0 ? (
              activeDiagnosesLabels.map((lbl) => (
                <Badge key={lbl} className="bg-emerald-500/20 text-emerald-200 border-emerald-400/40 text-[10px] font-mono">
                  {lbl}
                </Badge>
              ))
            ) : (
              <Badge className="bg-white/15 text-white border-white/20 text-[10px] font-mono">
                {caregivingScenario || 'General Geriatric Care'}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* 1. General Baseline Topics for All Caregivers */}
      <CompetencySection
        title="1. General Core Topics (Universal for All Caregivers)"
        subtitle="Essential foundational topics every caregiver needs: aging physiology, daily routines, fall safety, and medication hygiene."
        icon={BookOpen}
        modules={generalModules}
        badgeText={`${generalModules.length} Core Modules`}
        tag="General Topic"
      />

      {/* 2. Specific Topics Tailored to Patient's Diagnoses */}
      {tailoredModules.length > 0 && (
        <CompetencySection
          title={`2. Specific Topics Tailored to ${patient?.name || 'Patient'}'s Active Diagnoses`}
          subtitle="Specific condition management prioritized for active chronic conditions and ADL support requirements."
          icon={UserCheck}
          modules={tailoredModules}
          badgeText={`${tailoredModules.length} Targeted Modules`}
          tag="Matched Diagnosis"
        />
      )}

      {/* 2b. Explicitly Assigned by Clinician */}
      {assignedModules.length > 0 && (
        <CompetencySection
          title={`Clinician Assigned Learning (Assigned by ${assignedByLabel || 'Physician'})`}
          subtitle="Learning priorities explicitly assigned by your consulting clinician for this dyad."
          icon={Stethoscope}
          modules={assignedModules}
          badgeText={`${assignedModules.length} Clinician Assigned`}
          tag="Assigned by Clinician"
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
      />
    </div>
  );
};

function ModulesContent() {
  const { role } = useProfile();
  const t = useTranslations('Modules.page');

  const getModulesForRole = (r: 'caregiver' | 'professional') => {
    const source = r === 'caregiver' ? caregiverModules : professionalModules;
    return source.map((m) => ({ ...m, icon: iconMap[m.category] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('subtitle')}
        </p>
      </div>

      <Tabs defaultValue={role} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="caregiver">{t('caregiverTab')}</TabsTrigger>
          <TabsTrigger value="professional">{t('professionalTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="caregiver" className="pt-4">
          <ModulesView modules={getModulesForRole('caregiver')} role="caregiver" />
        </TabsContent>
        <TabsContent value="professional" className="pt-4">
          <ModulesView modules={getModulesForRole('professional')} role="professional" />
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
