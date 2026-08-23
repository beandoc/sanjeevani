'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Bot, ShieldAlert, Sparkles, Filter, Activity, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { simulationsData } from '@/lib/simulations-data';

const categories = [
  'All',
  'Emergency & Safety',
  'Medication Safety',
  'Clinical Care',
  'Practical Nursing',
  'Dementia Care',
  'Caregiver Wellness'
];

export default function SimulationsListPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const allSlugs = Object.keys(simulationsData);

  const filteredSlugs = allSlugs.filter((slug) => {
    if (selectedCategory === 'All') return true;
    return simulationsData[slug]?.category === selectedCategory;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Hero Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          <Bot className="w-4 h-4" />
          <span>Interactive Clinical Decision Lab</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-headline">
          21 Clinical Geriatric Care Simulations
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          Realistic, culturally authentic clinical scenarios calibrated for Indian family caregiving, multimorbidity triage, and emergency response.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="rounded-xl text-xs font-semibold shrink-0"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Grid of Simulation Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSlugs.map((slug) => {
          const sim = simulationsData[slug];
          return (
            <Card
              key={slug}
              className="flex flex-col justify-between border-border/80 bg-card hover:border-primary/50 transition-all shadow-sm rounded-3xl overflow-hidden hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                    {sim.category}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">Case #{slug}</span>
                </div>
                <CardTitle className="font-headline text-lg font-bold text-foreground leading-snug">
                  {sim.title}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-primary/90 mt-1">
                  {sim.patientProfile}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 flex-grow">
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {sim.scenario}
                </p>
              </CardContent>

              <CardContent className="pt-0">
                <Button asChild className="w-full font-bold text-xs rounded-xl shadow-xs" variant="secondary">
                  <Link href={`/simulations/${slug}`}>
                    <span>Launch Clinical Case</span>
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
