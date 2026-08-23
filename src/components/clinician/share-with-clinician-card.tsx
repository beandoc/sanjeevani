'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Share2, X, Copy, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthUser } from '@/hooks/use-auth-user';
import {
  grantClinicianAccess,
  revokeClinicianAccess,
  listMyGrants,
  type ClinicianGrant
} from '@/lib/firebase/clinical-sync';

/**
 * Caregiver-side consent UI (Phase E). Only the caregiver can grant or
 * revoke a clinician's access — consent can never be issued from the
 * clinician side. Every shared assessment is aggregate-only by construction
 * (see clinical-sync.ts / zarit-scale.ts), so there is no item-level ZBI
 * response for this grant to expose.
 */
export function ShareWithClinicianCard() {
  const { user } = useAuthUser();
  const { toast } = useToast();
  const [clinicianCode, setClinicianCode] = useState('');
  const [grants, setGrants] = useState<ClinicianGrant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setGrants(await listMyGrants());
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleGrant = async () => {
    if (!clinicianCode.trim()) return;
    setIsLoading(true);
    try {
      await grantClinicianAccess(clinicianCode.trim());
      setClinicianCode('');
      await refresh();
      toast({
        title: 'Access Shared',
        description: 'Your doctor can now see your burden trend and function scores on their dashboard.'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Share',
        description: err instanceof Error ? err.message : 'Check the code and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (clinicianUid: string) => {
    await revokeClinicianAccess(clinicianUid);
    await refresh();
    toast({ title: 'Access Revoked', description: 'That clinician can no longer see your data.' });
  };

  if (!user) {
    return (
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" /> Share With Your Doctor
          </CardTitle>
          <CardDescription className="text-xs">Sign in to share your burden trend with a clinician.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary" /> Share With Your Doctor
        </CardTitle>
        <CardDescription className="text-xs">
          Your doctor sees your assessment scores, trend, and factor breakdown — never your individual
          question answers. You can revoke access at any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 text-[11px] text-muted-foreground">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Ask your clinician for their Clinic Code (shown on their dashboard) and paste it below.</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Paste your doctor's Clinic Code"
            value={clinicianCode}
            onChange={(e) => setClinicianCode(e.target.value)}
            className="h-9 text-xs font-mono"
          />
          <Button size="sm" className="h-9 text-xs font-bold gap-1.5 shrink-0" onClick={handleGrant} disabled={isLoading}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>

        {grants.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/60">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Currently Shared With</Label>
            {grants.map((g) => (
              <div key={g.clinicianUid} className="flex items-center justify-between p-2.5 rounded-lg border border-border/60">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant={g.revokedAt ? 'outline' : 'default'} className="text-[10px] shrink-0">
                    {g.revokedAt ? 'Revoked' : 'Active'}
                  </Badge>
                  <span className="text-xs font-mono truncate">{g.clinicianLabel || g.clinicianUid}</span>
                </div>
                {!g.revokedAt && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRevoke(g.clinicianUid)}>
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
