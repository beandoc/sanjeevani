import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Clock, Sparkles, Radio, Headphones, Bell, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const upcomingEpisodes = [
  {
    id: 1,
    title: "Navigating Dementia & Cognitive Decline in Indian Households",
    guest: "Dr. Prabha S. (Geriatric Neurologist)",
    duration: "45 min",
    category: "Dementia Care",
    status: "Scripting & Clinical Review",
    topics: "Communication strategies, wandering prevention, managing nighttime agitation."
  },
  {
    id: 2,
    title: "Preventing Caregiver Burnout & Practical Respite Scheduling",
    guest: "Clinical Psychologist Panel",
    duration: "35 min",
    category: "Mental Health",
    status: "Recording in Progress",
    topics: "Zarit score management, emotional fatigue boundaries, family task delegation."
  },
  {
    id: 3,
    title: "Safe Home Nursing: Bed-Bound Care, Transfers & Pressure Sore Hazards",
    guest: "Senior Palliative Nursing Specialist",
    duration: "40 min",
    category: "Practical Skills",
    status: "Production Pipeline",
    topics: "Ergonomics for caregivers, 2-hourly turning routines, catheter hygiene."
  },
  {
    id: 4,
    title: "Polypharmacy Safety & Spotting Prescribing Cascades",
    guest: "Clinical Pharmacologist",
    duration: "30 min",
    category: "Medication Safety",
    status: "Production Pipeline",
    topics: "Drug interaction checklists, managing blister packs, talking to prescribers."
  },
];

export default function PodcastsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/15 via-background to-secondary/30 border border-primary/20 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider">
              Audio Series
            </Badge>
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" /> Coming Soon
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground font-headline flex items-center gap-3">
            <Headphones className="w-8 h-8 text-primary" />
            Sanjeevani Audio & Podcast Series
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We are currently recording and clinically vetting expert-led audio guides tailored for family caregivers and community health workers on the go.
          </p>
        </div>
      </div>

      {/* Production Notice */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Episodes are in Active Production</h4>
            <p className="text-xs text-muted-foreground">
              In the meantime, explore our interactive training modules and video demonstrations.
            </p>
          </div>
        </div>
        <Link href="/modules">
          <Button size="sm" variant="outline" className="font-bold text-xs shrink-0">
            Browse Modules <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Upcoming Curriculum List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Upcoming Audio Curriculum
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            {upcomingEpisodes.length} Episodes Slated
          </span>
        </div>

        <div className="space-y-3">
          {upcomingEpisodes.map((ep) => (
            <Card key={ep.id} className="border-border/80 bg-card/60 overflow-hidden shadow-sm hover:border-primary/40 transition-colors">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-mono shrink-0 mt-0.5">
                    EP {ep.id}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-foreground">{ep.title}</h3>
                      <Badge variant="secondary" className="text-[10px]">{ep.category}</Badge>
                    </div>
                    <p className="text-xs font-medium text-primary">{ep.guest}</p>
                    <p className="text-xs text-muted-foreground">{ep.topics}</p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                  <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground border-border">
                    {ep.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> Est. {ep.duration}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
