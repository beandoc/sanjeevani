'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, CircleCheck, Clock3, LogOut, Coffee, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getHomePoint, saveHomePoint, recordAttendanceEvent, subscribeToAttendance, type AttendanceState, type AttendanceEventType, type HomePoint } from '@/lib/firebase/clinical-sync/caregiver-attendance';

function distanceMeters(a: GeolocationCoordinates, home: HomePoint) {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(home.latitude - a.latitude), dLng = rad(home.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(home.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function CaregiverAttendancePanel() {
  const { user } = useAuthUser();
  const { toast } = useToast();
  const [home, setHome] = useState<HomePoint | null>(null);
  const [state, setState] = useState<AttendanceState | null>(null);
  const [busy, setBusy] = useState(false);
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patientUid, setPatientUid] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const targetUid = new URLSearchParams(window.location.search).get('patientUid') || user.uid;
    setPatientUid(targetUid);
    let live = true;
    void getHomePoint(targetUid).then((p) => { if (live) { setHome(p); setLoading(false); } });
    const stop = subscribeToAttendance(targetUid, setState);
    return () => { live = false; stop(); };
  }, [user?.uid]);

  const getPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('This device does not support location.')); return; }
    navigator.geolocation.getCurrentPosition(resolve, (error) => reject(new Error(error.code === 1 ? 'Location permission was denied.' : 'Could not get a reliable location. Try again outdoors.')), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });

  const captureHome = async () => {
    setBusy(true);
    try {
      const p = await getPosition();
      if (p.coords.accuracy > 100) throw new Error('GPS accuracy is too low. Move near a window or outdoors and try again.');
      const point = { latitude: p.coords.latitude, longitude: p.coords.longitude, radiusMeters: 150 };
      await saveHomePoint(point); setHome(point);
      toast({ title: 'Home map point saved', description: 'This is the geofence reference for caregiver attendance.' });
    } catch (e) { toast({ variant: 'destructive', title: 'Could not save home point', description: e instanceof Error ? e.message : 'Try again.' }); }
    finally { setBusy(false); }
  };

  const punch = async (type: AttendanceEventType) => {
    if (!user?.uid || !home || !consented) return;
    setBusy(true);
    try {
      const p = await getPosition();
      const distance = distanceMeters(p.coords, home);
      if (p.coords.accuracy > 100) throw new Error('GPS accuracy is too low to confirm this punch. Try again near a window or outdoors.');
      if ((type === 'arrived' || type === 'returned') && distance + p.coords.accuracy > home.radiusMeters) throw new Error(`You appear about ${Math.round(distance)} m from the home point. Attendance can only be started or resumed within ${home.radiusMeters} m.`);
      if (type === 'left_temporarily' && distance - p.coords.accuracy > home.radiusMeters) throw new Error('Please record the temporary departure while still at the home location.');
      if (type === 'departed' && distance - p.coords.accuracy < home.radiusMeters) throw new Error('You still appear to be near the home location. Move outside the attendance radius, then punch out.');
      await recordAttendanceEvent(patientUid || user.uid, { type, caregiverName: user.displayName || user.email || 'Caregiver', distanceMeters: distance, accuracyMeters: p.coords.accuracy });
      toast({ title: 'Attendance updated', description: 'The family care circle can see the latest status.' });
    } catch (e) { toast({ variant: 'destructive', title: 'Punch not recorded', description: e instanceof Error ? e.message : 'Try again.' }); }
    finally { setBusy(false); }
  };

  const statusLabel = state?.status === 'at_home' ? 'At home' : state?.status === 'temporarily_away' ? 'Temporarily away' : 'Off duty';
  const active = state?.status === 'at_home' || state?.status === 'temporarily_away';

  return <Card className="overflow-hidden rounded-2xl border-border/80">
    <CardHeader className="border-b bg-muted/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5 text-primary"/>Caregiver Attendance</CardTitle><CardDescription>Location is checked only when a punch is made.</CardDescription></div>
        <Badge className={state?.status === 'at_home' ? 'bg-emerald-600 text-white' : state?.status === 'temporarily_away' ? 'bg-amber-600 text-white' : ''} variant={state?.status === 'off_duty' || !state ? 'outline' : 'default'}><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-current"/>{statusLabel}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4 p-4 sm:p-5">
      {!user?.uid ? <p className="text-sm text-muted-foreground">Sign in to record and share attendance.</p> : <>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} className="mt-0.5"/><span><ShieldCheck className="mr-1 inline h-3.5 w-3.5"/>I agree to save the home location once and use one-time location checks for attendance punches. Attendance time and geofence result are shared with linked family accounts; location is not tracked between punches.</span></label>
        {!home && <div className="rounded-xl border border-dashed p-4"><p className="mb-3 text-sm font-medium">Set the home geofence point</p><p className="mb-3 text-xs text-muted-foreground">Stand at the patient’s home and save its GPS point. This one-time home point is stored; punch-time coordinates are not.</p>{patientUid === user.uid ? <Button size="sm" onClick={captureHome} disabled={busy || !consented}><Navigation className="mr-2 h-4 w-4"/>{busy ? 'Getting location…' : 'Save current location as home'}</Button> : <p className="text-xs text-muted-foreground">The account owner must first set the home map point.</p>}</div>}
        {home && <>
          <p className="text-xs text-muted-foreground">Status reflects the most recent punch. Location is not monitored between updates.</p>
          <div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-muted/50 p-3"><div className="text-xs text-muted-foreground">Shift started</div><div className="mt-1 flex items-center gap-1 font-semibold"><Clock3 className="h-3.5 w-3.5"/>{formatTime(state?.shiftStartedAt)}</div></div><div className="rounded-xl bg-muted/50 p-3"><div className="text-xs text-muted-foreground">Last update</div><div className="mt-1 font-semibold">{formatTime(state?.statusChangedAt)}</div></div></div>
          {active && <div className="flex flex-wrap gap-2">
            {state?.status === 'at_home' && <Button variant="outline" size="sm" onClick={() => punch('left_temporarily')} disabled={busy}><Coffee className="mr-1.5 h-4 w-4"/>Leaving temporarily</Button>}
            {state?.status === 'temporarily_away' && <Button size="sm" onClick={() => punch('returned')} disabled={busy}><RotateCcw className="mr-1.5 h-4 w-4"/>I’ve returned</Button>}
            <Button variant="outline" size="sm" onClick={() => punch('departed')} disabled={busy}><LogOut className="mr-1.5 h-4 w-4"/>End shift & punch out</Button>
          </div>}
          {!active && <Button onClick={() => punch('arrived')} disabled={busy}><CircleCheck className="mr-2 h-4 w-4"/>Arrived & start shift</Button>}
        </>}
        {loading && <p className="text-xs text-muted-foreground">Loading attendance…</p>}
      </>}
    </CardContent>
  </Card>;
}
