'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Home,
  Bed,
  Pill,
  Moon,
  XCircle
} from 'lucide-react';
import {
  HomeReadinessEngine,
  HomeReadinessInput,
  Day0Blocker
} from '@/lib/clinical/discharge-home-os';

interface Props {
  patientName?: string;
  onStatusChange?: (isReady: boolean) => void;
}

export function HomeReadinessSafetyGate({
  patientName = 'Smt. Savitri Sharma',
  onStatusChange
}: Props) {
  // Input state
  const [patientIsBedBound] = useState(true);
  const [patientFallRiskHigh] = useState(true);

  // Infrastructure
  const [hasGroundFloorOrLift, setHasGroundFloorOrLift] = useState(true);
  const [hasAttachedOrNearbyBathroom, setHasAttachedOrNearbyBathroom] = useState(true);
  const [hasPowerBackupForEquipment, setHasPowerBackupForEquipment] = useState(true);

  // Equipment
  const [hospitalBedDelivered, setHospitalBedDelivered] = useState(true);
  const [airOrWaterMattressInflated, setAirOrWaterMattressInflated] = useState(true);
  const [transferAidsAvailable] = useState(true);
  const [wheelchairOrCommodeAvailable, setWheelchairOrCommodeAvailable] = useState(true);

  // Medication
  const [allDischargeMedsAcquired, setAllDischargeMedsAcquired] = useState(true);
  const [firstHomeDoseTimetableConfirmed, setFirstHomeDoseTimetableConfirmed] = useState(true);

  // Caregiver Night
  const [isOvernightPresent, setIsOvernightPresent] = useState(true);
  const [hasPhysicalCapacityForTransfers, setHasPhysicalCapacityForTransfers] = useState(true);
  const [hasReceivedBedsideHandover, setHasReceivedBedsideHandover] = useState(true);

  const evaluationInput: HomeReadinessInput = useMemo(
    () => ({
      patientName,
      patientIsBedBound,
      patientFallRiskHigh,
      requiresSkilledNursing: false,
      requiresNightRepositioning: patientIsBedBound,
      infrastructure: {
        hasGroundFloorOrLift,
        hasAttachedOrNearbyBathroom,
        hasContinuousWaterSupply: true,
        hasPowerBackupForEquipment,
        hasReliableMobileNetwork: true,
        distanceToHospitalKm: 5,
        ambulanceAccessConfirmed: true
      },
      equipment: {
        hospitalBedDelivered,
        airOrWaterMattressInflated,
        wheelchairOrCommodeAvailable,
        transferAidsAvailable
      },
      medications: {
        allDischargeMedsAcquired,
        firstHomeDoseTimetableConfirmed,
        refrigerationAvailableIfRequired: true,
        specializedSuppliesInHand: true
      },
      nightCaregiver: {
        confirmedCaregiverName: 'Pankaj Sharma (Son)',
        relationship: 'child',
        isOvernightPresent,
        hasPhysicalCapacityForTransfers,
        hasReceivedBedsideHandover
      },
      verifiedBy: 'Staff Nurse Sunita (Geriatric Discharge Coordinator)'
    }),
    [
      patientName,
      patientIsBedBound,
      patientFallRiskHigh,
      hasGroundFloorOrLift,
      hasAttachedOrNearbyBathroom,
      hasPowerBackupForEquipment,
      hospitalBedDelivered,
      airOrWaterMattressInflated,
      wheelchairOrCommodeAvailable,
      transferAidsAvailable,
      allDischargeMedsAcquired,
      firstHomeDoseTimetableConfirmed,
      isOvernightPresent,
      hasPhysicalCapacityForTransfers,
      hasReceivedBedsideHandover
    ]
  );

  const evaluation = useMemo(() => {
    const result = HomeReadinessEngine.evaluate(evaluationInput);
    if (onStatusChange) {
      onStatusChange(result.canSafelyAdmitTonight);
    }
    return result;
  }, [evaluationInput, onStatusChange]);

  return (
    <div className="space-y-6">
      {/* Header Banner: Medically Cleared vs Home Safety */}
      <div className="bg-muted/40 border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary font-bold">
                Safety Protocol Phase 0
              </Badge>
              <span className="text-xs text-muted-foreground">• Doctor Clearance Accepted</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Home className="w-6 h-6 text-primary" />
              Home Readiness & Day 0 Safety Gate
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A patient may be medically discharge-ready, but not safe to arrive home. This safety gate prevents Day 0 readmissions.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Badge
              className={`text-xs px-3 py-1 font-bold ${
                evaluation.status === 'safe_to_transition'
                  ? 'bg-emerald-600 text-white'
                  : evaluation.status === 'caution_remediation_needed'
                  ? 'bg-amber-500 text-white'
                  : 'bg-destructive text-white animate-pulse'
              }`}
            >
              {evaluation.status === 'safe_to_transition' && 'SAFE TO TRANSITION HOME'}
              {evaluation.status === 'caution_remediation_needed' && 'CONDITIONAL TRANSITION'}
              {evaluation.status === 'safety_blocked' && 'CRITICAL HOME SAFETY BLOCK'}
            </Badge>
          </div>
        </div>

        {/* Status Callout */}
        {evaluation.status === 'safety_blocked' && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3.5">
            <ShieldAlert className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-destructive">
                DO NOT DISPATCH PATIENT: Critical Day 0 Blockers Unresolved
              </h4>
              <p className="text-xs text-destructive/90 leading-relaxed">
                {evaluation.clinicalEscalationRecommendation}
              </p>
            </div>
          </div>
        )}

        {evaluation.status === 'caution_remediation_needed' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Remediation Needed Before Vehicle Departure
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {evaluation.clinicalEscalationRecommendation}
              </p>
            </div>
          </div>
        )}

        {evaluation.status === 'safe_to_transition' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                All Systems Cleared for Domestic Admission Tonight
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Equipment confirmed in-situ, night caregiver verified, and discharge medicines reconciled.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4 Interactive Verification Quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quadrant 1: Night 1 Caregiver Presence */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                Night 1 Coverage & Transfer Safety
              </CardTitle>
              {isOvernightPresent && hasPhysicalCapacityForTransfers ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                  Verified
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px]">
                  Blocker
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Who is staying bedside tonight, and can they physically support the patient?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <Label htmlFor="night-present" className="cursor-pointer font-medium">
                Confirmed Overnight Caregiver Present Tonight
              </Label>
              <Switch
                id="night-present"
                checked={isOvernightPresent}
                onCheckedChange={setIsOvernightPresent}
              />
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <Label htmlFor="night-physical" className="cursor-pointer font-medium">
                Physically Able to Perform Bedside Repositioning / Turns
              </Label>
              <Switch
                id="night-physical"
                checked={hasPhysicalCapacityForTransfers}
                onCheckedChange={setHasPhysicalCapacityForTransfers}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="night-handover" className="cursor-pointer font-medium">
                Received Ward Nurse Hands-On Bedside Handover
              </Label>
              <Switch
                id="night-handover"
                checked={hasReceivedBedsideHandover}
                onCheckedChange={setHasReceivedBedsideHandover}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quadrant 2: Equipment Setup */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bed className="w-4 h-4 text-blue-500" />
                Medical Equipment in the Room
              </CardTitle>
              {hospitalBedDelivered && airOrWaterMattressInflated ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                  Delivered
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px]">
                  Missing
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Prescribed assistive devices verified installed before ambulance departs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <Label htmlFor="eq-bed" className="cursor-pointer font-medium">
                Motorized / Multi-Channel Hospital Bed Delivered
              </Label>
              <Switch
                id="eq-bed"
                checked={hospitalBedDelivered}
                onCheckedChange={setHospitalBedDelivered}
              />
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <Label htmlFor="eq-mattress" className="cursor-pointer font-medium">
                Alternating Pressure Air/Water Mattress Inflated & Running
              </Label>
              <Switch
                id="eq-mattress"
                checked={airOrWaterMattressInflated}
                onCheckedChange={setAirOrWaterMattressInflated}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="eq-commode" className="cursor-pointer font-medium">
                Wheelchair or Bedside Commode Chair Available
              </Label>
              <Switch
                id="eq-commode"
                checked={wheelchairOrCommodeAvailable}
                onCheckedChange={setWheelchairOrCommodeAvailable}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quadrant 3: Discharge Medications In-Hand */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-500" />
                Discharge Meds & First Home Dose
              </CardTitle>
              {allDischargeMedsAcquired && firstHomeDoseTimetableConfirmed ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                  In Hand
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px]">
                  Delay Risk
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Avoid the &quot;first dose gap&quot; where families don&apos;t know what to give on Day 0.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <Label htmlFor="med-acquired" className="cursor-pointer font-medium">
                Full 72-Hour Medication Kit Physically In Hand
              </Label>
              <Switch
                id="med-acquired"
                checked={allDischargeMedsAcquired}
                onCheckedChange={setAllDischargeMedsAcquired}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="med-first-dose" className="cursor-pointer font-medium">
                Exact Clock Time of First Home Dose Written & Explained
              </Label>
              <Switch
                id="med-first-dose"
                checked={firstHomeDoseTimetableConfirmed}
                onCheckedChange={setFirstHomeDoseTimetableConfirmed}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quadrant 4: Infrastructure & Access */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Home className="w-4 h-4 text-purple-500" />
                Home Infrastructure & Access
              </CardTitle>
              {hasGroundFloorOrLift && hasAttachedOrNearbyBathroom ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                  Accessible
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px]">
                  Hazard
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Stairs, bathroom transfers, and electrical reliability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <Label htmlFor="infra-lift" className="cursor-pointer font-medium">
                Ground Floor Room or Operational Lift (No Manual Stair Carry)
              </Label>
              <Switch
                id="infra-lift"
                checked={hasGroundFloorOrLift}
                onCheckedChange={setHasGroundFloorOrLift}
              />
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <Label htmlFor="infra-bath" className="cursor-pointer font-medium">
                Attached or Level Bathroom Access
              </Label>
              <Switch
                id="infra-bath"
                checked={hasAttachedOrNearbyBathroom}
                onCheckedChange={setHasAttachedOrNearbyBathroom}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="infra-power" className="cursor-pointer font-medium">
                Inverter / Battery Power Backup for Air Mattress & Monitors
              </Label>
              <Switch
                id="infra-power"
                checked={hasPowerBackupForEquipment}
                onCheckedChange={setHasPowerBackupForEquipment}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blockers & Remediation List */}
      {evaluation.blockers.length > 0 && (
        <Card className="border-destructive/40 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Active Day 0 Blockers Requiring Resolution ({evaluation.blockers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {evaluation.blockers.map((blocker: Day0Blocker) => (
              <div
                key={blocker.id}
                className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    {blocker.severity === 'critical_blocker' ? (
                      <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    {blocker.title}
                  </span>
                  <Badge
                    variant={blocker.severity === 'critical_blocker' ? 'destructive' : 'outline'}
                    className="text-[10px] uppercase font-bold"
                  >
                    {blocker.severity === 'critical_blocker' ? 'Day 0 Blocker' : 'High Caution'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{blocker.description}</p>
                <div className="text-xs text-primary font-medium bg-primary/5 p-2 rounded-lg border border-primary/15 mt-1">
                  <strong>Required Action:</strong> {blocker.remediationAction}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
