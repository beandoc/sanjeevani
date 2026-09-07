'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  Bot,
  ShieldAlert,
  Pill,
  Stethoscope,
  HeartHandshake,
  Brain,
  Sparkles,
  LayoutGrid,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Activity,
  UserRound,
  RotateCcw,
  Check,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { simulationsData, SimulationCase } from '@/lib/simulations-data';

interface CategoryConfig {
  icon: React.ElementType;
  badgeClass: string;
  stripe: string;
  accentBg: string;
}

const categoryStyles: Record<string, CategoryConfig> = {
  'Emergency & Safety': {
    icon: ShieldAlert,
    badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/20',
    stripe: 'from-rose-500 via-red-500 to-rose-600',
    accentBg: 'bg-rose-500/5 dark:bg-rose-950/20',
  },
  'Medication Safety': {
    icon: Pill,
    badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',
    stripe: 'from-amber-500 via-orange-500 to-amber-600',
    accentBg: 'bg-amber-500/5 dark:bg-amber-950/20',
  },
  'Clinical Care': {
    icon: Stethoscope,
    badgeClass: 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/20',
    stripe: 'from-blue-500 via-cyan-500 to-indigo-600',
    accentBg: 'bg-blue-500/5 dark:bg-blue-950/20',
  },
  'Practical Nursing': {
    icon: HeartHandshake,
    badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    stripe: 'from-emerald-500 via-teal-500 to-emerald-600',
    accentBg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
  },
  'Dementia Care': {
    icon: Brain,
    badgeClass: 'text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/20',
    stripe: 'from-purple-500 via-violet-500 to-purple-600',
    accentBg: 'bg-purple-500/5 dark:bg-purple-950/20',
  },
  'Caregiver Wellness': {
    icon: Sparkles,
    badgeClass: 'text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/20',
    stripe: 'from-teal-500 via-emerald-500 to-cyan-600',
    accentBg: 'bg-teal-500/5 dark:bg-teal-950/20',
  },
};

const defaultCategoryStyle: CategoryConfig = {
  icon: Activity,
  badgeClass: 'text-primary bg-primary/10 border-primary/20',
  stripe: 'from-primary to-blue-600',
  accentBg: 'bg-primary/5',
};

const categories = [
  'All',
  'Emergency & Safety',
  'Medication Safety',
  'Clinical Care',
  'Practical Nursing',
  'Dementia Care',
  'Caregiver Wellness',
] as const;

function parsePatientProfile(profile: string) {
  const match = profile.match(/^([^(]+)\s*\((.+)\)$/);
  if (match) {
    return {
      name: match[1].trim(),
      details: match[2].trim(),
    };
  }
  return {
    name: profile,
    details: '',
  };
}

export default function SimulationsListPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedCases, setCompletedCases] = useState<Record<string, { isCorrect: boolean }>>({});

  const allSlugs = Object.keys(simulationsData);

  // Load completed case progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sanjeevani_simulations_progress');
      if (saved) {
        setCompletedCases(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allSlugs.length };
    allSlugs.forEach((slug) => {
      const cat = simulationsData[slug]?.category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [allSlugs]);

  // Filtered simulations
  const filteredSlugs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allSlugs.filter((slug) => {
      const sim = simulationsData[slug];
      if (!sim) return false;

      const matchesCategory =
        selectedCategory === 'All' || sim.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!query) return true;

      return (
        sim.title.toLowerCase().includes(query) ||
        sim.patientProfile.toLowerCase().includes(query) ||
        sim.condition.toLowerCase().includes(query) ||
        sim.scenario.toLowerCase().includes(query) ||
        slug.toLowerCase().includes(query)
      );
    });
  }, [allSlugs, selectedCategory, searchQuery]);

  const totalCompleted = Object.keys(completedCases).length;
  const totalCases = allSlugs.length;
  const completionPercentage = Math.round((totalCompleted / totalCases) * 100);

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 pb-16">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-primary/10 via-card/80 to-blue-600/5 p-6 sm:p-10 shadow-sm backdrop-blur-sm">
        {/* Decorative ambient glowing accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Top Live Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <Bot className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase text-[10px] font-bold">
              Interactive Clinical Decision Lab
            </span>
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground font-headline leading-tight">
              21 Clinical{' '}
              <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Geriatric Care
              </span>{' '}
              Simulations
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Realistic, culturally authentic clinical scenarios calibrated for Indian family caregiving, multimorbidity triage, and emergency response.
            </p>
          </div>

          {/* Key Metric Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-card/70 border border-border/60 shadow-2xs backdrop-blur-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground font-headline leading-none">21</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Clinical Cases</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-card/70 border border-border/60 shadow-2xs backdrop-blur-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground font-headline leading-none">6</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Specialized Tracks</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-card/70 border border-border/60 shadow-2xs backdrop-blur-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground font-headline leading-none">84</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Decision Nodes</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-card/70 border border-border/60 shadow-2xs backdrop-blur-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground font-headline leading-none">100%</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Evidence-Based</p>
              </div>
            </div>
          </div>

          {/* Progress Banner (shows when at least 1 case has been completed) */}
          {totalCompleted > 0 && (
            <div className="pt-2">
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">
                      Your Simulation Progress:{' '}
                    </span>
                    <span className="text-muted-foreground">
                      {totalCompleted} of {totalCases} scenarios completed ({completionPercentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full sm:w-48 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="space-y-4">
        {/* Search input & Result counter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by condition, patient name, or symptom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 rounded-2xl bg-card border-border/80 text-xs shadow-2xs focus-visible:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-muted-foreground self-center sm:self-auto">
            Showing <span className="text-foreground font-bold">{filteredSlugs.length}</span> of {allSlugs.length} simulations
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-touch">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            const CategoryIcon =
              cat === 'All'
                ? LayoutGrid
                : categoryStyles[cat]?.icon || Activity;

            return (
              <Button
                key={cat}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-2xl text-xs font-semibold shrink-0 gap-1.5 transition-all px-3.5 h-9 ${
                  isSelected
                    ? 'shadow-md ring-2 ring-primary/30'
                    : 'bg-card/70 border-border/80 hover:bg-muted/70 hover:border-primary/30'
                }`}
              >
                <CategoryIcon className="w-3.5 h-3.5" />
                <span>{cat}</span>
                <span
                  className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Grid of Simulation Scenario Cards */}
      {filteredSlugs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card/50 space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">No Simulations Found</h3>
            <p className="text-xs text-muted-foreground">
              No clinical cases matched your search &quot;{searchQuery}&quot; in{' '}
              {selectedCategory === 'All' ? 'any category' : selectedCategory}.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Search & Filters</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSlugs.map((slug) => {
            const sim = simulationsData[slug];
            const catStyle = categoryStyles[sim.category] || defaultCategoryStyle;
            const CategoryIcon = catStyle.icon;
            const patient = parsePatientProfile(sim.patientProfile);
            const status = completedCases[slug];

            return (
              <Card
                key={slug}
                className="group relative flex flex-col justify-between border-border/70 bg-card hover:border-primary/50 transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 rounded-3xl overflow-hidden"
              >
                {/* Top Category Accent Line */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${catStyle.stripe}`} />

                <div>
                  <CardHeader className="pb-3 pt-4 px-5 sm:px-6">
                    {/* Header Row: Category Badge & Case Number */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${catStyle.badgeClass}`}
                      >
                        <CategoryIcon className="w-3 h-3" />
                        <span>{sim.category}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {status && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              status.isCorrect
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            {status.isCorrect ? 'Mastered' : 'Attempted'}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md">
                          #{slug}
                        </span>
                      </div>
                    </div>

                    {/* Simulation Title */}
                    <CardTitle className="font-headline text-lg sm:text-xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {sim.title}
                    </CardTitle>

                    {/* Patient Profile Demographics Box */}
                    <div className="mt-3 rounded-2xl bg-muted/30 border border-border/60 p-3 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <UserRound className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {patient.name}
                        </p>
                        {patient.details && (
                          <p className="text-[11px] text-muted-foreground font-medium leading-snug">
                            {patient.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0 pb-4 px-5 sm:px-6">
                    {/* Clinical Condition / Vulnerability Highlight */}
                    {sim.condition && (
                      <div className="rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 p-2.5 flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-relaxed">
                          <span className="font-bold text-amber-800 dark:text-amber-300">
                            Clinical Vulnerability:{' '}
                          </span>
                          <span className="text-amber-900/85 dark:text-amber-200/90 font-medium">
                            {sim.condition}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Scenario Narrative Excerpt */}
                    <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed italic">
                        &ldquo;{sim.scenario}&rdquo;
                      </p>
                    </div>
                  </CardContent>
                </div>

                {/* Card Action Footer */}
                <div className="p-5 sm:p-6 pt-0 mt-auto">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pb-3 border-t border-border/40 pt-3">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                      {sim.options.length} Decision Choices
                    </span>
                    <span className="text-muted-foreground/80">Evidence Triage</span>
                  </div>

                  <Button
                    asChild
                    className="w-full font-bold text-xs rounded-xl shadow-xs group-hover:shadow-md transition-all group-hover:bg-primary group-hover:text-primary-foreground h-10"
                    variant="secondary"
                  >
                    <Link href={`/simulations/${slug}`} className="flex items-center justify-center">
                      <span>Launch Clinical Case</span>
                      <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
