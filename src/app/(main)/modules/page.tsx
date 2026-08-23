
'use client';

import { useState, useEffect } from 'react';
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
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/context/role-context';
import { caregiverModules, professionalModules, iconMap } from '@/lib/modules';
import { HealthRepository } from '@/lib/db/health-repository';
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
            variant={tag === 'Matched Diagnosis' ? 'default' : tag === 'General Topic' ? 'secondary' : 'outline'}
            className={tag === 'Matched Diagnosis' ? 'bg-emerald-600 text-white text-[9px] font-mono' : 'text-[9px] font-mono'}
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
  badgeText?: string;
  tag?: string;
}) => {
  if (modules.length === 0) return null;

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-headline tracking-tight">{title}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {badgeText && (
          <Badge variant="outline" className="text-xs font-mono bg-primary/5 text-primary border-primary/20">
            {badgeText}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} tag={tag} />
        ))}
      </div>
    </div>
  );
};

const ModulesView = ({ modules, role }: { modules: Module[]; role: 'caregiver' | 'professional' }) => {
  const { caregivingScenario } = useProfile();
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const profile = HealthRepository.getPatientProfile();
      setPatient(profile);
    }
  }, []);

  const getCategorizedModules = () => {
    const generalModuleIds = [
      'caregiver-foundations',
      'caregiver-roles-responsibilities',
      'daily-caregiving-routine',
      'medication-management-caregiver',
      'fall-prevention',
      'nutrition-caregiver',
      'oral-health-caregiver',
      'elderly-garments-adaptive-dressing'
    ];

    const tailoredModuleIds = new Set<string>();
    const activeDiagnosesLabels: string[] = [];

    if (patient?.diagnoses) {
      const d = patient.diagnoses;
      if (d.hypertension) {
        tailoredModuleIds.add('hypertension-caregiver');
        tailoredModuleIds.add('hypertension-professional');
        activeDiagnosesLabels.push('Hypertension');
      }
      if (d.ischemicHeartDisease || d.heartFailure) {
        tailoredModuleIds.add('ischaemic-heart-disease-caregiver');
        tailoredModuleIds.add('ischaemic-heart-disease-professional');
        tailoredModuleIds.add('heart-failure');
        activeDiagnosesLabels.push('Heart Disease');
      }
      if (d.alzheimersDementia) {
        tailoredModuleIds.add('alzheimers-caregiver');
        tailoredModuleIds.add('dementia-care');
        tailoredModuleIds.add('alzheimers-professional');
        tailoredModuleIds.add('dementia-care-professional');
        activeDiagnosesLabels.push('Alzheimer’s / Dementia');
      }
      if (d.parkinsonsDisease) {
        tailoredModuleIds.add('parkinsonism-care');
        tailoredModuleIds.add('parkinsonism-care-professional');
        activeDiagnosesLabels.push('Parkinson’s Disease');
      }
      if (d.stroke) {
        tailoredModuleIds.add('stroke-rehab');
        activeDiagnosesLabels.push('Stroke Rehab');
      }
      if (d.benignProstaticHyperplasia) {
        tailoredModuleIds.add('benign-prostate-care');
        tailoredModuleIds.add('benign-prostate-professional');
        activeDiagnosesLabels.push('BPH & Bladder');
      }
      if (d.constipation) {
        tailoredModuleIds.add('constipation-caregiver');
        tailoredModuleIds.add('constipation-professional');
        activeDiagnosesLabels.push('Constipation');
      }
      if (d.lungInfectionsCopd) {
        tailoredModuleIds.add('lung-infections-caregiver');
        tailoredModuleIds.add('lung-infections-professional');
        activeDiagnosesLabels.push('Pneumonia / Respiratory');
      }
      if (d.visionProblemsCataract) {
        tailoredModuleIds.add('vision-problems-caregiver');
        tailoredModuleIds.add('vision-problems-professional');
        activeDiagnosesLabels.push('Vision Impairment');
      }
      if (d.jointProblemsOsteoarthritis) {
        tailoredModuleIds.add('joint-problems-caregiver');
        tailoredModuleIds.add('joint-problems-professional');
        activeDiagnosesLabels.push('Arthritis & Joint Pain');
      }
    }

    if (patient?.katzAdl && (!patient.katzAdl.transferring || !patient.katzAdl.bathing)) {
      tailoredModuleIds.add('bed-bound-care');
      tailoredModuleIds.add('sensory-hygiene-bedmaking');
      activeDiagnosesLabels.push('High ADL Dependence');
    }

    const generalModules = modules.filter((m) => generalModuleIds.includes(m.id));
    const tailoredModules = modules.filter(
      (m) => tailoredModuleIds.has(m.id) && !generalModuleIds.includes(m.id)
    );
    const exploreModules = modules.filter(
      (m) => !generalModuleIds.includes(m.id) && !tailoredModuleIds.has(m.id)
    );

    return { activeDiagnosesLabels, generalModules, tailoredModules, exploreModules };
  };

  const { activeDiagnosesLabels, generalModules, tailoredModules, exploreModules } = getCategorizedModules();

  return (
    <div className="space-y-8">
      {/* Patient Specific Customized Banner */}
      {patient && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 text-white shadow-xl border border-primary/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-wider uppercase border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Tailored Caregiver Learning Curriculum
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-headline tracking-tight text-white">
              Personalized for {patient.name || 'Your Loved One'} (Age {patient.age || 75})
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
          badgeText={`${tailoredModules.length} Matched Topics`}
          tag="Matched Diagnosis"
        />
      )}

      {/* 3. Explore All Other Clinical Modules */}
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

export default function ModulesPage() {
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
