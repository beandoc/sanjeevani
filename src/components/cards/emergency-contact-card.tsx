import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, User, Hospital, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export const EmergencyContactCard = () => {
  const t = useTranslations('Dashboard');

  return (
    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/5 rounded-full -mr-12 -mt-12 blur-2xl" />
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-destructive/10 p-1.5 rounded-lg">
            <Phone className="h-4 w-4 text-destructive" />
          </div>
          <CardTitle className="font-headline text-xl">{t('emergencyCare')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="group flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-secondary/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <User className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('primaryCaregiver')}</p>
            <p className="text-sm font-semibold truncate">Babulal Jadhav</p>
            <p className="text-xs text-primary font-medium">(555) 123-4567</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary/5 text-primary">
            <Phone className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="group flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-secondary/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <Stethoscope className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('doctorClinic')}</p>
            <p className="text-sm font-semibold truncate">Dr. Sachin</p>
            <p className="text-xs text-primary font-medium">(555) 987-6543</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary/5 text-primary">
            <Phone className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="group flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-secondary/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <Hospital className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('primaryHospital')}</p>
            <p className="text-sm font-semibold truncate">Kidney Care Hospital</p>
            <p className="text-xs text-primary font-medium">Pune, India</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary/5 text-primary">
            <Phone className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
