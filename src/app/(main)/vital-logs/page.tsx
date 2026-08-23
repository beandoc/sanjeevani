'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardList, Trash2, CalendarIcon, HeartPulse, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { HealthRepository, VitalRecord } from '@/lib/db/health-repository';
import { ConsentManager } from '@/components/privacy/consent-manager';

const vitalLogSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  weight: z.string().optional(),
  pulse: z.string().optional(),
  bp: z.string().optional(),
  bloodSugar: z.string().optional(),
  sleep: z.enum(['good', 'average', 'poor']),
  notes: z.string().optional(),
});

type VitalLogFormValues = z.infer<typeof vitalLogSchema>;

export default function VitalLogsPage() {
  const [logs, setLogs] = useState<VitalRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setLogs(HealthRepository.getVitals());
  }, []);

  const form = useForm<VitalLogFormValues>({
    resolver: zodResolver(vitalLogSchema),
    defaultValues: {
      date: new Date(),
      weight: '',
      pulse: '',
      bp: '',
      bloodSugar: '',
      sleep: 'average',
      notes: '',
    },
  });

  function onSubmit(data: VitalLogFormValues) {
    const consent = HealthRepository.getConsent();
    if (!consent.hasConsented || !consent.vitalsTrackingConsent) {
      HealthRepository.saveConsent({ hasConsented: true, vitalsTrackingConsent: true });
    }

    const saved = HealthRepository.addVital({
      date: data.date.toISOString(),
      weight: data.weight,
      pulse: data.pulse,
      bp: data.bp,
      bloodSugar: data.bloodSugar,
      sleep: data.sleep,
      notes: data.notes,
    });

    setLogs(HealthRepository.getVitals());
    form.reset({
      date: new Date(),
      weight: '',
      pulse: '',
      bp: '',
      bloodSugar: '',
      sleep: 'average',
      notes: '',
    });

    toast({
      title: '✅ Log Saved',
      description: `Vital log for ${format(data.date, 'PPP')} has been successfully recorded.`,
    });
  }

  function deleteLog(id: string) {
    HealthRepository.deleteVital(id);
    setLogs(HealthRepository.getVitals());
    toast({
      title: '🗑️ Log Deleted',
      description: 'The log entry has been removed.',
    });
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
          <HeartPulse className="w-4 h-4" />
          <span>Clinical Tracking & Continuity</span>
        </div>
        <h1 className="text-3xl font-bold font-headline">Vital Signs & Parameters Log</h1>
        <p className="text-muted-foreground text-sm">
          Track blood pressure, pulse, glucose, and subjective sleep markers to share with your treating physician.
        </p>
      </div>

      <ConsentManager mode="banner" onConsentChange={() => setLogs(HealthRepository.getVitals())} />

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Add New Log Entry</CardTitle>
            <CardDescription className="text-xs">Fill in today&apos;s observed clinical parameters.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-semibold">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal text-xs h-9',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="bp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">BP (mmHg)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 120/80" className="h-9 text-xs font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pulse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Pulse (bpm)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 72" className="h-9 text-xs font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="bloodSugar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Sugar (mg/dL)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 110" className="h-9 text-xs font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Weight (kg)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 64.5" className="h-9 text-xs font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sleep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Sleep Quality</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select sleep quality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="good">Good (Restful 7+ hrs)</SelectItem>
                          <SelectItem value="average">Average (Interrupted)</SelectItem>
                          <SelectItem value="poor">Poor (Severe Insomnia / Restless)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Clinical Observations</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Mild dizziness after morning diuretic. Appetite normal."
                          className="text-xs resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full font-bold h-9 text-xs">
                  Save Vital Entry
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Historical Vitals Vault</CardTitle>
              <CardDescription className="text-xs">Chronological record of recent measurements.</CardDescription>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {logs.length} Entries
            </span>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <div className="relative w-full overflow-auto border rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead>Date</TableHead>
                      <TableHead>BP</TableHead>
                      <TableHead>Pulse</TableHead>
                      <TableHead>Sugar</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Sleep</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="text-xs">
                        <TableCell className="font-semibold">{format(new Date(log.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="font-mono">{log.bp || '—'}</TableCell>
                        <TableCell className="font-mono">{log.pulse ? `${log.pulse} bpm` : '—'}</TableCell>
                        <TableCell className="font-mono">{log.bloodSugar ? `${log.bloodSugar} mg/dL` : '—'}</TableCell>
                        <TableCell className="font-mono">{log.weight ? `${log.weight} kg` : '—'}</TableCell>
                        <TableCell className="capitalize">{log.sleep}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-muted-foreground">{log.notes || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteLog(log.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12 border border-dashed rounded-xl">
                <ClipboardList className="h-10 w-10 mb-3 text-muted-foreground/60" />
                <p className="font-medium text-sm">No vital entries recorded yet.</p>
                <p className="text-xs text-muted-foreground">Log your first observation using the form on the left.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
