'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Brain,
  ShieldAlert,
  Wind,
  Droplets,
  Moon,
  Pill,
  HeartPulse,
  LayoutDashboard,
  Bed,
  ClipboardList,
  Activity,
  CalendarDays,
  Users,
  Sparkles,
  FileText,
  GraduationCap,
  Bot,
  Stethoscope,
  BookMarked,
  Video,
  Mic,
  Computer,
  AlertTriangle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CaregiverTroubleshootingModal, SCENARIOS, Scenario } from './caregiver-troubleshooting-modal';

/* ─── Navigation Items Data ─────────────────────────────────────── */
type NavItem = {
  title: string;
  category: 'Overview' | 'Daily Care' | 'Clinical Assessment' | 'Education & Sims' | 'Knowledge';
  href: string;
  icon: React.ElementType;
  keywords: string[];
  badge?: string;
};

const ALL_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard Overview',
    category: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    keywords: ['dashboard', 'home', 'overview', 'cohort', 'patient', 'stats', 'alerts'],
  },
  {
    title: 'Bedside Companion',
    category: 'Daily Care',
    href: '/domiciliary',
    icon: Bed,
    keywords: ['domiciliary', 'bedside', 'turning clock', 'repositioning', 'skin care', 'pressure ulcer', 'hygiene'],
    badge: 'Bedside',
  },
  {
    title: 'Medication Schedule & Beers Warning',
    category: 'Daily Care',
    href: '/medications',
    icon: ClipboardList,
    keywords: ['medication', 'drugs', 'beers criteria', 'prescriptions', 'pill', 'dose', 'polypharmacy'],
    badge: 'Beers',
  },
  {
    title: 'Vital Signs Logger',
    category: 'Daily Care',
    href: '/vital-logs',
    icon: Activity,
    keywords: ['vitals', 'bp', 'blood pressure', 'spo2', 'pulse', 'temperature', 'sugar', 'glucose', 'weight'],
  },
  {
    title: 'Appointments Schedule',
    category: 'Daily Care',
    href: '/appointments',
    icon: CalendarDays,
    keywords: ['appointments', 'doctor', 'visit', 'telehealth', 'clinic', 'calendar'],
  },
  {
    title: 'Care Circle Contacts',
    category: 'Daily Care',
    href: '/care-circle',
    icon: Users,
    keywords: ['care circle', 'family', 'physician', 'emergency contact', 'caregiver', 'nurse', 'team'],
  },
  {
    title: 'Clinical Onboarding Wizard',
    category: 'Clinical Assessment',
    href: '/onboarding',
    icon: Sparkles,
    keywords: ['onboarding', 'intake', 'patient profile', 'wizard', 'setup', 'dyad', 'clinical intake'],
    badge: 'Wizard',
  },
  {
    title: 'Zarit Caregiver Burden Gauge',
    category: 'Clinical Assessment',
    href: '/stress-calculator',
    icon: HeartPulse,
    keywords: ['zarit', 'stress', 'burden', 'burnout', 'fatigue', 'mental health', 'score'],
    badge: 'Zarit',
  },
  {
    title: 'Clinical Reports & Summary Brief',
    category: 'Clinical Assessment',
    href: '/reports',
    icon: FileText,
    keywords: ['reports', 'summary', 'export', 'pdf', 'clinical brief', 'physician share'],
  },
  {
    title: 'Geriatric Learning Modules',
    category: 'Education & Sims',
    href: '/modules',
    icon: GraduationCap,
    keywords: ['modules', 'learning', 'education', 'guides', 'courses', 'dementia', 'stroke', 'fall'],
  },
  {
    title: 'Interactive Case Simulations',
    category: 'Education & Sims',
    href: '/simulations',
    icon: Bot,
    keywords: ['simulations', 'cases', 'scenarios', 'roleplay', 'practice', 'interactive', '21 sims'],
    badge: '21 Sims',
  },
  {
    title: '4Ms Geriatric Assessment Guide',
    category: 'Education & Sims',
    href: '/assessment-guide',
    icon: Stethoscope,
    keywords: ['4ms', 'mind', 'medication', 'mobility', 'what matters', 'geriatric guide', 'clinical assessment'],
  },
  {
    title: 'Geriatric Clinical Resources',
    category: 'Knowledge',
    href: '/resources',
    icon: BookMarked,
    keywords: ['resources', 'icmr', 'ags', 'guidelines', 'articles', 'research', 'docs'],
  },
  {
    title: 'Video Demonstrations',
    category: 'Knowledge',
    href: '/videos',
    icon: Video,
    keywords: ['videos', 'demo', 'bedmaking', 'transfer', 'dressing', 'feeding', 'tutorials'],
  },
  {
    title: 'Caregiver Podcasts',
    category: 'Knowledge',
    href: '/podcasts',
    icon: Mic,
    keywords: ['podcasts', 'audio', 'interviews', 'caregiver stories', 'expert advice'],
  },
  {
    title: 'SeHAT Teleconsultation',
    category: 'Knowledge',
    href: '/sehat-opd',
    icon: Computer,
    keywords: ['sehat', 'teleconsultation', 'opd', 'online doctor', 'video call', 'esanjeevani'],
  },
];

/* ─── Beers Drug Safety Quick Data ──────────────────────────── */
type BeersDrug = {
  name: string;
  category: string;
  risk: string;
  severity: 'high' | 'medium';
};

const BEERS_DRUGS: BeersDrug[] = [
  {
    name: 'Alprazolam / Clonazepam (Benzodiazepines)',
    category: 'Sedatives / Anxiolytics',
    risk: 'High risk of falls, severe ataxia, confusion, and paradoxical delirium in elderly.',
    severity: 'high',
  },
  {
    name: 'Zolpidem / Zopiclone (Z-drugs)',
    category: 'Sleep Aids',
    risk: 'Increased risk of nighttime falls, nocturnal wandering, and motor incoordination.',
    severity: 'high',
  },
  {
    name: 'Diclofenac / Ibuprofen (NSAIDs)',
    category: 'Analgesics',
    risk: 'High risk of acute renal failure, fluid retention, and GI bleeding in seniors >70y.',
    severity: 'high',
  },
  {
    name: 'Amitriptyline / Imipramine (TCAs)',
    category: 'Antidepressants',
    risk: 'Strong anticholinergic side-effects: urinary retention, constipation, dry mouth, delirium.',
    severity: 'high',
  },
  {
    name: 'Haloperidol / Risperidone (Antipsychotics)',
    category: 'Antipsychotics',
    risk: 'Black box warning: increased mortality in dementia patients; extrapyramidal symptoms.',
    severity: 'medium',
  },
  {
    name: 'Glibenclamide / Glyburide (Sulfonylurea)',
    category: 'Antidiabetics',
    risk: 'Prolonged, severe hypoglycemia due to age-related decline in renal clearance.',
    severity: 'high',
  },
];

/* ─── Component Props ─────────────────────────────────────────── */
export type GlobalCommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GlobalCommandPalette({ isOpen, onClose }: GlobalCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTroubleshootingScenario, setActiveTroubleshootingScenario] = useState<string | null>(null);

  // Clear query on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const filteredNav = ALL_NAV_ITEMS.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const filteredBeers = BEERS_DRUGS.filter((drug) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      drug.name.toLowerCase().includes(q) ||
      drug.category.toLowerCase().includes(q) ||
      drug.risk.toLowerCase().includes(q)
    );
  });

  const filteredScenarios = SCENARIOS.filter((scenario) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      scenario.title.toLowerCase().includes(q) ||
      scenario.subtitle.toLowerCase().includes(q)
    );
  });

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleOpenTroubleshooting = (scenarioId: string) => {
    setActiveTroubleshootingScenario(scenarioId);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0 gap-0 rounded-2xl border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl flex flex-col">
          {/* Header Search Input */}
          <DialogHeader className="p-4 border-b border-border/40 shrink-0">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, medications, emergency triage protocols... (e.g. Zarit, Fall, Delirium, Zolpidem)"
                className="pl-10 pr-12 h-11 text-sm bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/30"
                autoFocus
              />
              <kbd className="absolute right-3.5 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
          </DialogHeader>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* 🚨 Section 1: Acute Caregiver Troubleshooting Walkthroughs */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
                  Acute Caregiver Troubleshooting (1-Click Triage)
                </span>
                <span className="text-[10px] font-medium text-muted-foreground font-mono">5 Scenarios</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredScenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => handleOpenTroubleshooting(scenario.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-xs active:scale-[0.99]',
                      scenario.bgColor
                    )}
                  >
                    <div className="h-8 w-8 rounded-lg bg-background/80 flex items-center justify-center shrink-0 border border-border/40">
                      <scenario.icon className={cn('h-4 w-4', scenario.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{scenario.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{scenario.subtitle}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* 💊 Section 2: Beers Criteria Medication Safety Lookup */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5" />
                  Beers Criteria Drug Safety Warning Card
                </span>
                <span className="text-[10px] font-medium text-muted-foreground font-mono">Geriatric Safety</span>
              </div>
              <div className="space-y-2">
                {filteredBeers.slice(0, 3).map((drug, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">{drug.name}</span>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider border-amber-500/40 text-amber-600 bg-amber-500/10">
                        {drug.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      {drug.risk}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 🚀 Section 3: Navigation Jump List */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" />
                  Quick Navigation Tools ({filteredNav.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredNav.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:bg-primary/5 hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <item.icon className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.category}</p>
                      </div>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0">
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-muted/20 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground px-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="font-mono rounded border bg-muted px-1 text-[10px]">↑</kbd>
                <kbd className="font-mono rounded border bg-muted px-1 text-[10px]">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono rounded border bg-muted px-1 text-[10px]">↵</kbd>
                Select
              </span>
            </div>
            <span className="font-medium text-primary">Sanjeevani Global Omnibar</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded Caregiver Troubleshooting Modal */}
      {activeTroubleshootingScenario && (
        <CaregiverTroubleshootingModal
          isOpen={true}
          onClose={() => setActiveTroubleshootingScenario(null)}
          initialScenarioId={activeTroubleshootingScenario}
        />
      )}
    </>
  );
}
