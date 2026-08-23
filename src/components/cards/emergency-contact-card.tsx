'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, HeartPulse, ShieldAlert, PhoneCall, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export const EmergencyContactCard = () => {
  const t = useTranslations('Dashboard');

  const emergencyServices = [
    {
      id: 'elderline',
      title: 'Elder Line (Senior Citizens)',
      number: '14567',
      telUrl: 'tel:14567',
      subtitle: 'Ministry of Social Justice & Empowerment',
      badge: '24x7 Toll-Free',
      iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    },
    {
      id: 'erss',
      title: 'National Emergency (ERSS)',
      number: '112',
      telUrl: 'tel:112',
      subtitle: 'All-in-One Police, Fire & Medical Crisis',
      badge: 'Emergency',
      iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
    },
    {
      id: 'telemanas',
      title: 'Tele-MANAS (Mental Health)',
      number: '14416',
      telUrl: 'tel:14416',
      subtitle: 'National Psychological Distress Support',
      badge: 'MoHFW Free',
      iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
    }
  ];

  return (
    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/5 rounded-full -mr-12 -mt-12 blur-2xl" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-destructive/10 p-1.5 rounded-lg text-destructive">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <CardTitle className="font-headline text-lg sm:text-xl">National Emergency Services</CardTitle>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            India Helplines
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {emergencyServices.map((service) => (
          <div
            key={service.id}
            className="group flex items-center justify-between p-3 rounded-2xl bg-background/80 border border-border/60 hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${service.iconBg}`}>
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground truncate">{service.title}</p>
                </div>
                <p className="text-xs text-muted-foreground truncate">{service.subtitle}</p>
                <span className="text-xs font-bold text-primary font-mono">{service.number}</span>
              </div>
            </div>

            <a href={service.telUrl} aria-label={`Call ${service.title} at ${service.number}`}>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-9 px-3 gap-1.5 font-bold border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm shrink-0"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call</span>
              </Button>
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
