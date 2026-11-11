'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { linkCareCircleAccountUids, linkCaregiverAccountUids, subscribeToAttendance, type AttendanceState } from '@/lib/firebase/clinical-sync/caregiver-attendance';
import { Users, Copy, ShieldCheck, Clock3 } from 'lucide-react';

export function CareCircleAttendanceAccess() {
  const { user } = useAuthUser();
  const { toast } = useToast();
  const [uids, setUids] = useState<string[]>([]);
  const [caregiverUids, setCaregiverUids] = useState<string[]>([]);
  const [entry, setEntry] = useState('');
  const [caregiverEntry, setCaregiverEntry] = useState('');
  const [familyUid, setFamilyUid] = useState('');
  const [familyStatus, setFamilyStatus] = useState<AttendanceState | null>(null);

  useEffect(() => {
    if (!user?.uid || !db) return;
    getDoc(doc(db, 'users', user.uid, 'careCircle', 'current')).then((snap) => {
      const list = snap.data()?.memberUids;
      if (Array.isArray(list)) setUids(list.filter((x): x is string => typeof x === 'string'));
      const caregivers = snap.data()?.caregiverUids;
      if (Array.isArray(caregivers)) setCaregiverUids(caregivers.filter((x): x is string => typeof x === 'string'));
    }).catch(() => {});
    const queryUid = new URLSearchParams(window.location.search).get('attendanceFor');
    if (queryUid && queryUid !== user.uid) {
      setFamilyUid(queryUid);
      return subscribeToAttendance(queryUid, setFamilyStatus);
    }
  }, [user?.uid]);

  const add = async () => {
    if (!user?.uid || !entry.trim()) return;
    const next = [...new Set([...uids, entry.trim()])];
    try { await linkCareCircleAccountUids(user.uid, next); setUids(next); setEntry(''); toast({ title: 'Family account linked', description: 'This account can now view attendance and the home point.' }); }
    catch (e) { toast({ variant: 'destructive', title: 'Could not link account', description: e instanceof Error ? e.message : 'Try again.' }); }
  };
  const remove = async (removeUid: string) => {
    if (!user?.uid) return;
    const next = uids.filter((uid) => uid !== removeUid);
    try { await linkCareCircleAccountUids(user.uid, next); setUids(next); } catch (e) { toast({ variant: 'destructive', title: 'Could not remove access', description: e instanceof Error ? e.message : 'Try again.' }); }
  };
  const addCaregiver = async () => {
    if (!user?.uid || !caregiverEntry.trim()) return;
    const next = [...new Set([...caregiverUids, caregiverEntry.trim()])];
    try { await linkCaregiverAccountUids(user.uid, next); setCaregiverUids(next); setCaregiverEntry(''); toast({ title: 'Caregiver attendance enabled', description: 'This account can record punches for this home.' }); }
    catch (e) { toast({ variant: 'destructive', title: 'Could not authorize caregiver', description: e instanceof Error ? e.message : 'Try again.' }); }
  };
  const removeCaregiver = async (removeUid: string) => {
    if (!user?.uid) return;
    const next = caregiverUids.filter((uid) => uid !== removeUid);
    try { await linkCaregiverAccountUids(user.uid, next); setCaregiverUids(next); } catch (e) { toast({ variant: 'destructive', title: 'Could not revoke caregiver access', description: e instanceof Error ? e.message : 'Try again.' }); }
  };

  if (familyUid) return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/>Shared caregiver attendance</CardTitle><CardDescription>Status from the caregiver&apos;s most recent punch; location is not monitored between updates.</CardDescription></CardHeader><CardContent>{familyStatus ? <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4"><div><div className="font-semibold">{familyStatus.caregiverName}</div><div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5"/>Updated {familyStatus.statusChangedAt ? new Date(familyStatus.statusChangedAt).toLocaleString() : '—'}</div></div><Badge className={familyStatus.status === 'at_home' ? 'bg-emerald-600 text-white' : familyStatus.status === 'temporarily_away' ? 'bg-amber-600 text-white' : ''} variant={familyStatus.status === 'off_duty' ? 'outline' : 'default'}>{familyStatus.status === 'at_home' ? 'At home' : familyStatus.status === 'temporarily_away' ? 'Temporarily away' : 'Off duty'}</Badge></div> : <p className="text-sm text-muted-foreground">No attendance has been recorded for this shift yet.</p>}</CardContent></Card>;

  if (!user?.uid) return null;
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/>Family attendance access</CardTitle><CardDescription>Link each relative’s signed-in account explicitly. They can then use the shared link to see attendance. Their account UID is shown on their own Care Circle page.</CardDescription></CardHeader><CardContent className="space-y-3">
    <div className="flex flex-col gap-2 sm:flex-row"><Input aria-label="Family member account UID" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Paste family member account UID"/><Button onClick={add} disabled={!entry.trim()}>Allow view access</Button></div>
    {uids.length > 0 && <div className="space-y-2">{uids.map((uid) => <div key={uid} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"><code>{uid}</code><Button variant="ghost" size="sm" onClick={() => remove(uid)}>Remove access</Button></div>)}</div>}
    <div className="border-t pt-3"><p className="mb-2 text-sm font-semibold">Caregiver punch access</p><p className="mb-2 text-xs text-muted-foreground">Only the owner and these accounts can record arrivals, temporary exits, returns, and shift end.</p><div className="flex flex-col gap-2 sm:flex-row"><Input aria-label="Caregiver account UID" value={caregiverEntry} onChange={(e) => setCaregiverEntry(e.target.value)} placeholder="Paste caregiver account UID"/><Button variant="secondary" onClick={addCaregiver} disabled={!caregiverEntry.trim()}>Authorize caregiver</Button></div>{caregiverUids.map((uid) => <div key={uid} className="mt-2 flex items-center justify-between rounded-lg border px-3 py-2 text-xs"><code>{uid}</code><Button variant="ghost" size="sm" onClick={() => removeCaregiver(uid)}>Revoke punch access</Button></div>)}</div>
    <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => { void navigator.clipboard?.writeText(user.uid); toast({ title: 'Account UID copied', description: 'Share this with the caregiver who manages the care circle.' }); }}><Copy className="mr-1.5 h-3.5 w-3.5"/>Copy my account UID</Button><Button variant="outline" size="sm" onClick={() => { const link = `${window.location.origin}/care-circle?attendanceFor=${encodeURIComponent(user.uid)}`; void navigator.clipboard?.writeText(link); toast({ title: 'Attendance link copied', description: 'Only family accounts linked above can open the shared status.' }); }}><Copy className="mr-1.5 h-3.5 w-3.5"/>Copy my family status link</Button></div>
    <Button variant="outline" size="sm" onClick={() => { const link = `${window.location.origin}/domiciliary?patientUid=${encodeURIComponent(user.uid)}`; void navigator.clipboard?.writeText(link); toast({ title: 'Caregiver punch link copied', description: 'Authorize the caregiver account above before sharing this link.' }); }}><Copy className="mr-1.5 h-3.5 w-3.5"/>Copy caregiver punch link</Button>
    <p className="text-xs text-muted-foreground">Status events are shared with linked accounts. Exact punch-time coordinates are not stored. Remove access here to revoke future reads.</p>
  </CardContent></Card>;
}
