
'use client';

import { useState } from 'react';
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
import { ClipboardList, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';


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

interface VitalLog extends VitalLogFormValues {
  id: number;
}

export default function VitalLogsPage() {
  const [logs, setLogs] = useState<VitalLog[]>([]);
  const { toast } = useToast();

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
    const newLog: VitalLog = {
      id: Date.now(),
      ...data,
    };

    setLogs((prev) => [...prev, newLog].sort((a,b) => b.date.getTime() - a.date.getTime()));
    form.reset({
      ...form.getValues(),
      date: new Date(), 
      weight: '',
      pulse: '',
      bp: '',
      bloodSugar: '',
      notes: '',
    });
    toast({
      title: '✅ Log Saved',
      description: `Vital log for ${format(data.date, 'PPP')} has been successfully saved.`,
    });
  }

  function deleteLog(id: number) {
    setLogs(logs.filter(log => log.id !== id));
    toast({
      title: '🗑️ Log Deleted',
      description: 'The log has been removed.',
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Vital Signs Log</h1>
        <p className="text-muted-foreground">
          Track important health data for better care management and continuity.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Add New Log Entry</CardTitle>
            <CardDescription>Fill in the details for today's log.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="weight" render={({ field }) => (
                    <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input placeholder="e.g., 70.5" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="pulse" render={({ field }) => (
                    <FormItem><FormLabel>Pulse (bpm)</FormLabel><FormControl><Input placeholder="e.g., 72" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="bp" render={({ field }) => (
                    <FormItem><FormLabel>BP (Sys/Dia)</FormLabel><FormControl><Input placeholder="e.g., 120/80" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="bloodSugar" render={({ field }) => (
                    <FormItem><FormLabel>Blood Sugar</FormLabel><FormControl><Input placeholder="e.g., 95" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
                 <FormField
                  control={form.control}
                  name="sleep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sleep Quality</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select sleep quality" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
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
                      <FormLabel>Important Issues / Notes</FormLabel>
                      <FormControl><Textarea placeholder="e.g., Complained of headache in the morning. Seemed cheerful in the evening." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Save Log</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Historical Logs</CardTitle>
            <CardDescription>Review past vital sign entries.</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
                <div className="relative w-full overflow-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>Pulse</TableHead>
                            <TableHead>BP</TableHead>
                            <TableHead>Sugar</TableHead>
                            <TableHead>Sleep</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-medium">{format(log.date, 'dd-MMM-yy')}</TableCell>
                                <TableCell>{log.weight || 'N/A'}</TableCell>
                                <TableCell>{log.pulse || 'N/A'}</TableCell>
                                <TableCell>{log.bp || 'N/A'}</TableCell>
                                <TableCell>{log.bloodSugar || 'N/A'}</TableCell>
                                <TableCell className="capitalize">{log.sleep}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{log.notes || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                     <Button variant="ghost" size="icon" onClick={() => deleteLog(log.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                     </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 border rounded-md">
                <ClipboardList className="h-10 w-10 mb-4" />
                <p>No logs have been saved yet.</p>
                <p className="text-xs">Use the form to add the first entry.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
