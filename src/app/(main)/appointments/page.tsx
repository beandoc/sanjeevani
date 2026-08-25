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
import { CalendarDays, Clock, Trash2, User, Hospital, CalendarCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HealthRepository, AppointmentRecord } from '@/lib/db/health-repository';
import { syncAppointment } from '@/lib/firebase/clinical-sync';

const appointmentSchema = z.object({
  department: z.string().min(1, { message: 'Department is required.' }),
  doctor: z.string().min(1, { message: 'Doctor name is required.' }),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

const departments = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Geriatrics & Memory Care',
  'Nephrology & Renal',
  'General Physician',
  'Ophthalmology',
  'Palliative Care',
  'Physical Therapy',
  'Dental'
];

export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setAppointments(HealthRepository.getAppointments());
  }, []);

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

    const newRecord = HealthRepository.addAppointment({
      date: date.toISOString(),
      department: data.department,
      doctor: data.doctor,
      notes: data.notes,
    });

    void syncAppointment(newRecord);

    setAppointments(HealthRepository.getAppointments());
    form.reset();
    toast({
      title: '✅ Appointment Scheduled',
      description: `Appointment with ${data.doctor} (${data.department}) on ${format(date, 'PPP')} has been scheduled.`,
    });
  }

  function deleteAppointment(id: string) {
    const appt = appointments.find((a) => a.id === id);
    HealthRepository.deleteAppointment(id);
    setAppointments(HealthRepository.getAppointments());
    if (appt) {
      void syncAppointment({ ...appt, status: 'cancelled' });
    }
    toast({
      title: '🗑️ Appointment Cancelled',
      description: 'The appointment has been removed from your calendar.',
    });
  }

  const upcomingAppointments = appointments.filter(
    (app) => new Date(app.date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
          <CalendarCheck className="w-4 h-4" />
          <span>Care Schedule & Follow-ups</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline">Clinical Appointments & Tele-OPD</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Coordinate consultations with geriatricians, specialists, and home-care visits.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border shadow-xs bg-card">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Schedule New Consultation</CardTitle>
            <CardDescription className="text-xs">
              Select a date on the calendar, then fill out the doctor and clinic details.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 grid gap-4 sm:gap-8 md:grid-cols-2">
            <div className="flex justify-center w-full overflow-x-auto">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-2xl border bg-background/50 shadow-xs max-w-full"
                modifiers={{
                  scheduled: appointments.map((app) => new Date(app.date)),
                }}
                modifiersStyles={{
                  scheduled: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    color: 'hsl(var(--primary))',
                  },
                }}
              />
            </div>
            <div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Specialty / Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept} className="text-xs">
                                {dept}
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
                        <FormLabel className="text-xs font-semibold">Doctor / Clinician Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Dr. Rajesh K." className="h-9 text-xs" {...field} />
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
                        <FormLabel className="text-xs font-semibold">Visit Purpose / Symptoms</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g. 3-month hypertension checkup, review blood work."
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
                    Confirm Appointment
                  </Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Upcoming Schedule</CardTitle>
              <CardDescription className="text-xs">Next upcoming consultations.</CardDescription>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {upcomingAppointments.length} Active
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-xl border border-border/80 bg-background/80 flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">{app.department}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {format(new Date(app.date), 'EEE, dd MMM')}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{app.doctor}</p>
                    {app.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{app.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => deleteAppointment(app.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12 border border-dashed rounded-xl">
                <CalendarDays className="h-10 w-10 mb-2 text-muted-foreground/60" />
                <p className="text-sm font-medium">No upcoming appointments</p>
                <p className="text-xs text-muted-foreground">Select a date on the calendar to book.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
