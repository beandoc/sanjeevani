
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
import { Calendar } from '@/components/ui/calendar';
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
import { CalendarDays, Clock, Trash2, User, Hospital } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const appointmentSchema = z.object({
  department: z.string().min(1, { message: 'Department is required.' }),
  doctor: z.string().min(1, { message: 'Doctor name is required.' }),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface Appointment extends AppointmentFormValues {
  id: number;
  date: Date;
}

const departments = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Geriatrics',
  'Nephrology',
  'General Physician',
  'Ophthalmology',
  'Dental',
];

export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { toast } = useToast();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      department: '',
      doctor: '',
      notes: '',
    },
  });

  function onSubmit(data: AppointmentFormValues) {
    if (!date) {
      toast({
        variant: 'destructive',
        title: 'No Date Selected',
        description: 'Please select a date for the appointment.',
      });
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now(),
      date,
      ...data,
    };

    setAppointments((prev) => [...prev, newAppointment].sort((a,b) => a.date.getTime() - b.date.getTime()));
    form.reset();
    toast({
      title: '✅ Appointment Added',
      description: `Appointment with ${data.doctor} on ${format(date, 'PPP')} has been scheduled.`,
    });
  }

  function deleteAppointment(id: number) {
    setAppointments(appointments.filter(app => app.id !== id));
    toast({
      title: '🗑️ Appointment Deleted',
      description: 'The appointment has been removed from your calendar.',
    });
  }
  
  const upcomingAppointments = appointments.filter(
    (app) => app.date >= new Date()
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Appointment Calendar</h1>
        <p className="text-muted-foreground">
          Manage and track upcoming medical appointments.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Add New Appointment</CardTitle>
            <CardDescription>
              Select a date on the calendar, then fill out the details below.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                modifiers={{
                  scheduled: appointments.map(app => app.date)
                }}
                modifiersStyles={{
                  scheduled: {
                    color: 'hsl(var(--primary-foreground))',
                    backgroundColor: 'hsl(var(--primary))'
                  }
                }}
              />
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dep) => (
                            <SelectItem key={dep} value={dep}>
                              {dep}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="doctor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dr. Sachin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Follow-up for blood pressure check, bring recent reports."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={!date}>Add Appointment</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              Your next scheduled visits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((app) => (
                <div key={app.id} className="relative rounded-lg border p-4 pr-10 space-y-2">
                   <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => deleteAppointment(app.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                   </Button>
                   <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{format(app.date, 'PPP')}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{app.doctor}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <Hospital className="h-4 w-4 text-muted-foreground" />
                      <span>{app.department}</span>
                   </div>
                   {app.notes && (
                      <p className="text-sm text-muted-foreground pt-2">{app.notes}</p>
                   )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                <CalendarDays className="h-10 w-10 mb-4" />
                <p>No upcoming appointments.</p>
                <p className="text-xs">Use the form to add a new one.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
