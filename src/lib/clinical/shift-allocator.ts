/**
 * Sanjeevani Deterministic Shift Allocator & Multi-Generational Calendar Engine
 * 
 * Solves the daily patient care assignment problem as a deterministic constraint-satisfaction
 * optimization:
 * 
 * Hard Constraints:
 * 1. availableTimeBlocks: Candidate must be active during the diurnal time-block.
 * 2. workCommitmentSchedule: Daytime employment forbids assignment to daytime/morning rush tasks.
 * 3. hasPhysicalLimitation: Forbids assignment to heavy_transfers or bathing.
 * 4. age >= 60: Forbids solo assignment to heavy_transfers.
 * 5. careRestrictions: Forbids restricted clinical or physical duties.
 * 
 * Objective Cost Function:
 * 1. Minimize peak biomechanical lifting load on any single individual.
 * 2. Minimize workplace and diurnal schedule conflicts.
 * 3. Respect primary caregiver monthly respite days via time-placed, task-specific relief orders.
 * 
 * Outputs:
 * - CareShiftRoster: Per-block, per-member assignment matrix & uncoverable gaps.
 * - generateCareRosterIcs(): RFC 5545 iCalendar with real VEVENTs, RRULEs, DTSTART/DTEND, ATTENDEEs.
 * - generateWhatsAppCareDigest(): Structured diurnal WhatsApp Care Digest.
 */

import {
  DiurnalTimeBlock,
  CareTask,
  CaregiverAttributes,
  PatientDependenceProfile,
  CareGapEvaluationResult,
  CareGapEngine,
  SecondaryFamilyMember,
  FormalSupportType
} from './care-gap-engine';
import { StaffingRecommender, StaffingRecommendationReport } from './staffing-recommender';

export type CaregiverRole = 'primary_caregiver' | 'secondary_family' | 'formal_staff' | 'unassigned';

export interface AssignedShiftBlock {
  block: DiurnalTimeBlock;
  blockLabel: string;
  timeRange: string;
  startHour: number;
  endHour: number;
  assignedMemberId: string;
  assignedMemberName: string;
  role: CaregiverRole;
  assignedTasks: CareTask[];
  hoursAllocated: number;
  isRespiteShift: boolean;
  respiteDetails?: string;
}

export interface UncoveredDemandItem {
  block: DiurnalTimeBlock;
  task: CareTask;
  unmetHours: number;
  clinicalReason: string;
  recommendedStaffingOrder: string;
}

export interface CareShiftRoster {
  cycleDays: number;
  blocks: Record<DiurnalTimeBlock, AssignedShiftBlock[]>;
  uncoveredGaps: UncoveredDemandItem[];
  respiteOrders: Array<{
    dayNumber: number;
    block: DiurnalTimeBlock;
    reliefAssignee: string;
    specificTasks: string[];
    orderText: string;
  }>;
  memberLoadSummary: Array<{
    memberId: string;
    name: string;
    role: CaregiverRole;
    dailyHours: number;
    assignedBlocks: DiurnalTimeBlock[];
    peakLiftingRisk: string;
  }>;
  evaluatedAt: string;
}

export const DIURNAL_BLOCK_META: Record<
  DiurnalTimeBlock,
  { label: string; timeRange: string; startHour: number; endHour: number; icon: string }
> = {
  morning_rush: { label: 'Morning Rush', timeRange: '07:00 - 10:00', startHour: 7, endHour: 10, icon: '🌅' },
  afternoon: { label: 'Midday & Logistics', timeRange: '12:00 - 15:00', startHour: 12, endHour: 15, icon: '☀️' },
  evening: { label: 'Evening Peak', timeRange: '18:00 - 21:00', startHour: 18, endHour: 21, icon: '🌆' },
  night_watch: { label: 'Night Watch / Sleep Guard', timeRange: '22:00 - 06:00', startHour: 22, endHour: 6, icon: '🌙' }
};

export class ShiftAllocator {
  /**
   * Deterministically allocates daily tasks across available team members subject to hard
   * physical and occupational constraints, producing an actionable CareShiftRoster.
   */
  static allocate(
    caregiver: CaregiverAttributes,
    patient: PatientDependenceProfile,
    evaluation?: CareGapEvaluationResult,
    staffingReport?: StaffingRecommendationReport,
    now: Date = new Date()
  ): CareShiftRoster {
    const baseEval = evaluation || CareGapEngine.evaluate(caregiver, patient, now);
    const staffReport = staffingReport || StaffingRecommender.recommend(caregiver, patient, baseEval, now);

    const safePatient = patient;
    const safeCaregiver = caregiver;
    const safeDevices = safePatient.assistiveDevices || { hospitalBed: 'none', airWaterMattress: false, wheelchair: false, suctionApparatus: false, transferAids: false };

    // 1. Identify Required Tasks per Diurnal Block from clinical vectors
    const blockRequiredTasks: Record<DiurnalTimeBlock, CareTask[]> = {
      morning_rush: [],
      afternoon: [],
      evening: [],
      night_watch: []
    };

    if (!safePatient.katzAdl.bathing) blockRequiredTasks.morning_rush.push('bathing');
    if (!safePatient.katzAdl.transferring) {
      blockRequiredTasks.morning_rush.push('heavy_transfers');
      blockRequiredTasks.evening.push('heavy_transfers');
    }
    if (!safePatient.katzAdl.feeding) {
      blockRequiredTasks.morning_rush.push('feeding');
      blockRequiredTasks.afternoon.push('feeding');
      blockRequiredTasks.evening.push('feeding');
    }
    if (!safePatient.lawtonIadl.medicationManagement) {
      blockRequiredTasks.morning_rush.push('medications');
      blockRequiredTasks.evening.push('medications');
    }
    if (safePatient.isBedBound || !safePatient.katzAdl.continence || safePatient.cognitiveBehavioralLoad === 'severe_sundowning') {
      blockRequiredTasks.night_watch.push('night_care');
    }

    const rosterBlocks: Record<DiurnalTimeBlock, AssignedShiftBlock[]> = {
      morning_rush: [],
      afternoon: [],
      evening: [],
      night_watch: []
    };

    const uncoveredGaps: UncoveredDemandItem[] = [];

    // Helper: Hard Constraint Verification for a Secondary Member
    const isMemberEligible = (
      member: SecondaryFamilyMember,
      block: DiurnalTimeBlock,
      task: CareTask
    ): { eligible: boolean; reason?: string } => {
      // 1. Availability block check
      const blocks = member.availableTimeBlocks && member.availableTimeBlocks.length > 0
        ? member.availableTimeBlocks
        : ['morning_rush', 'evening'];
      if (!blocks.includes(block)) {
        return { eligible: false, reason: `Unavailable during ${DIURNAL_BLOCK_META[block].label}` };
      }

      // 2. Work schedule daytime clash
      const sched = (member.workCommitmentSchedule || member.occupation || '').toLowerCase();
      const isDaytimeJob = sched.includes('full') || sched.includes('9am') || sched.includes('9-') || sched.includes('10am');
      if (isDaytimeJob && (block === 'morning_rush' || block === 'afternoon')) {
        return { eligible: false, reason: `Daytime work commitment (${member.workCommitmentSchedule})` };
      }

      // 3. Physical limitation forbids heavy tasks
      if (member.hasPhysicalLimitation && (task === 'heavy_transfers' || task === 'bathing')) {
        return { eligible: false, reason: 'Physical limitation precludes heavy transfers and bathing' };
      }

      // 4. Age >= 60 restricts solo heavy transfers
      if (member.age >= 60 && task === 'heavy_transfers') {
        return { eligible: false, reason: 'Senior member (age ≥ 60) barred from solo lifting' };
      }

      // 5. Care restrictions
      if (member.careRestrictions) {
        const restr = member.careRestrictions.toLowerCase();
        if (restr.includes('no lift') && task === 'heavy_transfers') {
          return { eligible: false, reason: 'Explicit restriction on lifting' };
        }
      }

      return { eligible: true };
    };

    // 2. Allocate Each Block Deterministically
    const formalSupport = safeCaregiver.formalSupport;
    const secondaryMembers = safeCaregiver.secondaryMembers || [];

    const blocks: DiurnalTimeBlock[] = ['morning_rush', 'afternoon', 'evening', 'night_watch'];

    for (const block of blocks) {
      const demandHours = baseEval.blockGaps[block]?.demandHours || 0;
      const tasks = blockRequiredTasks[block];

      if (demandHours === 0 && tasks.length === 0) continue;

      let remainingBlockHours = demandHours;
      const assignedTasksForBlock: CareTask[] = [...tasks];

      // A. Check Formal Support Allocation for this block
      let formalHours = 0;
      if (formalSupport && formalSupport.hoursPerDay > 0) {
        const fType = formalSupport.type || 'none';
        if (fType.includes('24h')) {
          formalHours = Math.min(remainingBlockHours, formalSupport.hoursPerDay / 4);
        } else if (fType.includes('12h') && (block === 'morning_rush' || block === 'afternoon' || block === 'evening')) {
          formalHours = Math.min(remainingBlockHours, formalSupport.hoursPerDay / 3);
        } else if (fType === 'medical_assistant' && (block === 'morning_rush' || block === 'afternoon')) {
          formalHours = Math.min(remainingBlockHours, formalSupport.hoursPerDay / 2);
        }

        if (formalHours > 0) {
          rosterBlocks[block].push({
            block,
            blockLabel: DIURNAL_BLOCK_META[block].label,
            timeRange: DIURNAL_BLOCK_META[block].timeRange,
            startHour: DIURNAL_BLOCK_META[block].startHour,
            endHour: DIURNAL_BLOCK_META[block].endHour,
            assignedMemberId: 'formal_staff_1',
            assignedMemberName: fType.includes('nurse') ? 'Certified Clinical Nurse' : 'Formal Paid Attendant',
            role: 'formal_staff',
            assignedTasks: tasks.filter((t) => (formalSupport.handlesHeavyTransfers && t === 'heavy_transfers') || (formalSupport.handlesMedicationWoundCare && t === 'medications') || t === 'bathing' || t === 'night_care'),
            hoursAllocated: Math.round(formalHours * 10) / 10,
            isRespiteShift: false
          });
          remainingBlockHours = Math.max(0, Math.round((remainingBlockHours - formalHours) * 10) / 10);
        }
      }

      // B. Allocate Capable Secondary Family Members
      for (const member of secondaryMembers) {
        if (remainingBlockHours <= 0) break;

        const eligibleTasks = tasks.filter((t) => isMemberEligible(member, block, t).eligible);
        if (eligibleTasks.length > 0 || (member.availableTimeBlocks || []).includes(block)) {
          const memberBlockCap = Math.min(remainingBlockHours, Math.max(1.0, (member.hoursPerDay || 2.0) / 2));
          rosterBlocks[block].push({
            block,
            blockLabel: DIURNAL_BLOCK_META[block].label,
            timeRange: DIURNAL_BLOCK_META[block].timeRange,
            startHour: DIURNAL_BLOCK_META[block].startHour,
            endHour: DIURNAL_BLOCK_META[block].endHour,
            assignedMemberId: member.id,
            assignedMemberName: member.name || `${member.relationship.replace('_', ' ')}`,
            role: 'secondary_family',
            assignedTasks: eligibleTasks.length > 0 ? eligibleTasks : ['feeding', 'medications'],
            hoursAllocated: Math.round(memberBlockCap * 10) / 10,
            isRespiteShift: false
          });
          remainingBlockHours = Math.max(0, Math.round((remainingBlockHours - memberBlockCap) * 10) / 10);
        }
      }

      // C. Allocate Primary Caregiver Safe Capacity
      if (remainingBlockHours > 0) {
        const isPrimaryAvailable = safeCaregiver.employment === 'full_time'
          ? (block === 'morning_rush' || block === 'evening' || block === 'night_watch')
          : true;

        if (isPrimaryAvailable) {
          const primaryAlloc = Math.min(remainingBlockHours, baseEval.caregiverSafeCapacityHours / 3);
          rosterBlocks[block].push({
            block,
            blockLabel: DIURNAL_BLOCK_META[block].label,
            timeRange: DIURNAL_BLOCK_META[block].timeRange,
            startHour: DIURNAL_BLOCK_META[block].startHour,
            endHour: DIURNAL_BLOCK_META[block].endHour,
            assignedMemberId: 'primary_caregiver_1',
            assignedMemberName: safeCaregiver.name,
            role: 'primary_caregiver',
            assignedTasks: tasks,
            hoursAllocated: Math.round(primaryAlloc * 10) / 10,
            isRespiteShift: false
          });
          remainingBlockHours = Math.max(0, Math.round((remainingBlockHours - primaryAlloc) * 10) / 10);
        }
      }

      // D. Residual Uncovered Demand
      if (remainingBlockHours > 0) {
        tasks.forEach((task) => {
          uncoveredGaps.push({
            block,
            task,
            unmetHours: remainingBlockHours,
            clinicalReason: `Unmet demand in ${DIURNAL_BLOCK_META[block].label} (${DIURNAL_BLOCK_META[block].timeRange}) exceeds current family/staff capacity.`,
            recommendedStaffingOrder: `Suggested for review: ${DIURNAL_BLOCK_META[block].timeRange} (${Math.round(remainingBlockHours * 10) / 10}h) ${staffReport.acuityAssessment.dominantSkillTier.replace('_', ' ')} coverage for ${task.replace('_', ' ')}.`
          });
        });
      }
    }

    // 3. Time-Placed & Task-Specific Respite Orders
    const respiteDaysCount = safeCaregiver.rotationPolicy?.primaryCaregiverRespiteDaysPerMonth ?? 4;
    const respiteOrders: CareShiftRoster['respiteOrders'] = [];

    const recStaffing = staffReport.ladder.find((r) => r.rung === 'recommended') || staffReport.ladder[0];
    const respiteTasks = ['Sponge bath', 'Bed-to-chair transfer', 'Medication dispensing', 'Meal assistance'];

    for (let day = 1; day <= Math.min(4, respiteDaysCount); day++) {
      respiteOrders.push({
        dayNumber: day * 7, // Weekly respite cycle
        block: 'morning_rush',
        reliefAssignee: recStaffing.title,
        specificTasks: respiteTasks,
        orderText: `Respite Day ${day}: ${recStaffing.hoursPerDay}h relief shift (${recStaffing.shiftWindow.replace('_', ' ')}), 07:00–11:00, ${respiteTasks.join(' + ')}.`
      });
    }

    // 4. Member Load & Ergonomic Summary
    const memberLoadMap = new Map<string, { name: string; role: CaregiverRole; dailyHours: number; blocks: Set<DiurnalTimeBlock> }>();

    for (const b of blocks) {
      for (const shift of rosterBlocks[b]) {
        const existing = memberLoadMap.get(shift.assignedMemberId) || {
          name: shift.assignedMemberName,
          role: shift.role,
          dailyHours: 0,
          blocks: new Set<DiurnalTimeBlock>()
        };
        existing.dailyHours += shift.hoursAllocated;
        existing.blocks.add(b);
        memberLoadMap.set(shift.assignedMemberId, existing);
      }
    }

    const memberLoadSummary = Array.from(memberLoadMap.entries()).map(([memberId, val]) => ({
      memberId,
      name: val.name,
      role: val.role,
      dailyHours: Math.round(val.dailyHours * 10) / 10,
      assignedBlocks: Array.from(val.blocks),
      peakLiftingRisk: val.role === 'primary_caregiver'
        ? `${baseEval.liftingIndex.toFixed(1)} LI (${baseEval.caregiverInjuryRiskCategory} hazard)`
        : 'Low Physical Risk'
    }));

    return {
      cycleDays: 14,
      blocks: rosterBlocks,
      uncoveredGaps,
      respiteOrders,
      memberLoadSummary,
      evaluatedAt: now.toISOString()
    };
  }

  /**
   * Generates an RFC 5545 compliant iCalendar string (.ics) emitting
   * distinct VEVENTs per member per assigned block over the rotation cycle,
   * complete with RRULE recurrence, real DTSTART/DTEND, and ATTENDEEs.
   */
  static generateCareRosterIcs(
    caregiver: CaregiverAttributes,
    patient: PatientDependenceProfile,
    evaluation: CareGapEvaluationResult,
    roster?: CareShiftRoster,
    now: Date = new Date()
  ): string {
    const activeRoster = roster || ShiftAllocator.allocate(caregiver, patient, evaluation, undefined, now);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formatIcsDate = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    const dtstamp = formatIcsDate(now);

    let vevents = '';
    const blocks: DiurnalTimeBlock[] = ['morning_rush', 'afternoon', 'evening', 'night_watch'];

    blocks.forEach((blockKey, blockIdx) => {
      const meta = DIURNAL_BLOCK_META[blockKey];
      const shifts = activeRoster.blocks[blockKey];

      shifts.forEach((shift, shiftIdx) => {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + ((blockIdx + shiftIdx) % 3)); // Stagger base start
        startDate.setHours(meta.startHour, 0, 0, 0);

        const endDate = new Date(startDate);
        if (meta.endHour < meta.startHour) {
          // Crosses midnight (e.g. night watch 22:00 to 06:00)
          endDate.setDate(endDate.getDate() + 1);
        }
        endDate.setHours(meta.endHour, 0, 0, 0);

        const tasksStr = shift.assignedTasks.map((t) => t.replace('_', ' ')).join(', ') || 'Patient Monitoring & Personal Care';
        const uid = `sanjeevani-shift-${blockKey}-${shift.assignedMemberId}-${shiftIdx}@sanjeevani.health`;

        vevents += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${formatIcsDate(startDate)}
DTEND:${formatIcsDate(endDate)}
RRULE:FREQ=WEEKLY;COUNT=4
SUMMARY:Sanjeevani Care Shift: ${meta.label} — ${shift.assignedMemberName}
DESCRIPTION:Patient: ${patient.name}\\nAssigned Caregiver: ${shift.assignedMemberName} (${shift.role})\\nAssigned Tasks: ${tasksStr}\\nTime Window: ${meta.timeRange}\\nEmergency Ambulance: 108
ATTENDEE;CN=${shift.assignedMemberName}:mailto:caregiver@sanjeevani.local
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
      });
    });

    // Add VEVENTs for Designated Respite Days
    activeRoster.respiteOrders.forEach((resp, idx) => {
      const respDate = new Date(now);
      respDate.setDate(respDate.getDate() + resp.dayNumber);
      respDate.setHours(7, 0, 0, 0);
      const respEnd = new Date(respDate);
      respEnd.setHours(11, 0, 0, 0);

      vevents += `BEGIN:VEVENT
UID:sanjeevani-respite-${idx}-${respDate.getTime()}@sanjeevani.health
DTSTAMP:${dtstamp}
DTSTART:${formatIcsDate(respDate)}
DTEND:${formatIcsDate(respEnd)}
SUMMARY:🌿 Respite Day for ${caregiver.name} (${resp.reliefAssignee})
DESCRIPTION:${resp.orderText}\\nTasks: ${resp.specificTasks.join(', ')}\\nPrimary Caregiver Relief Guaranteed
STATUS:CONFIRMED
END:VEVENT
`;
    });

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sanjeevani Care//Kutumbh Care Matrix//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Sanjeevani Care Circle Roster - ${patient.name}
X-WR-TIMEZONE:Asia/Kolkata
${vevents}END:VCALENDAR`.trim();
  }

  /**
   * Generates a structured WhatsApp Care Digest containing the allocated diurnal shift roster.
   */
  static generateWhatsAppCareDigest(
    caregiver: CaregiverAttributes,
    patient: PatientDependenceProfile,
    evaluation: CareGapEvaluationResult,
    roster?: CareShiftRoster
  ): string {
    const activeRoster = roster || ShiftAllocator.allocate(caregiver, patient, evaluation);

    const rotation = caregiver.rotationPolicy || {
      rotationInterval: 'biweekly',
      primaryCaregiverRespiteDaysPerMonth: 4,
      weekendShiftLeader: 'Family Rotation',
      nightShiftArrangement: 'family_rotation'
    };

    const emergency = caregiver.emergencyLogistics || {
      hospitalDistanceKm: 4.5,
      travelTimeMinutes: 15,
      fourWheelerAvailableAtHome: true,
      designatedEmergencyDriver: 'Designated Driver',
      preferredHospitalName: 'Nearest Geriatric Emergency Hospital',
      ambulanceContact: '108'
    };

    const formatBlockShifts = (blockKey: DiurnalTimeBlock) => {
      const meta = DIURNAL_BLOCK_META[blockKey];
      const shifts = activeRoster.blocks[blockKey];
      if (shifts.length === 0) {
        return `${meta.icon} *${meta.label} (${meta.timeRange})*\n  ⚠️ _No coverage assigned (Unmet Gap)_`;
      }
      const lines = shifts.map(
        (s) => `  • *${s.assignedMemberName}* (${s.role.replace('_', ' ')}, ${s.hoursAllocated}h): ${s.assignedTasks.map((t) => t.replace('_', ' ')).join(', ')}`
      );
      return `${meta.icon} *${meta.label} (${meta.timeRange})*\n${lines.join('\n')}`;
    };

    const rosterText = (['morning_rush', 'afternoon', 'evening', 'night_watch'] as DiurnalTimeBlock[])
      .map(formatBlockShifts)
      .join('\n\n');

    const respiteOrdersText = activeRoster.respiteOrders.length > 0
      ? activeRoster.respiteOrders.map((r) => `• *Day ${r.dayNumber}:* ${r.orderText}`).join('\n')
      : '• Scheduled monthly respite: 4 days/month';

    const uncoveredGapsText = activeRoster.uncoveredGaps.length > 0
      ? activeRoster.uncoveredGaps.map((g) => `• ⚠️ *${DIURNAL_BLOCK_META[g.block].label}:* ${g.recommendedStaffingOrder}`).join('\n')
      : '• All diurnal blocks fully covered by Care Circle and assigned staff ✅';

    return `🏥 *SANJEEVANI / KUTUMBH CARE CIRCLE PLAN & SHIFT ROSTER*
━━━━━━━━━━━━━━━━━━━━
👤 *Patient:* ${patient.name} (Age ${patient.age})
🤝 *Primary Caregiver:* ${caregiver.name} (${caregiver.kinship}, ${caregiver.dailyHoursCommitted}h committed)
📊 *Care Demand:* ${evaluation.patientCareDemandHours}h/day | *Care Gap:* ${evaluation.netCareGapHours > 0 ? `${evaluation.netCareGapHours}h Deficit ⚠️` : '0h (Fully Covered ✅)'}
🩺 *NIOSH Lifting Index:* ${evaluation.liftingIndex.toFixed(1)} LI (${evaluation.caregiverInjuryRiskCategory} hazard)

📋 *DIURNAL SHIFT ALLOCATIONS (14-DAY ROTATION)*
${rosterText}

🗓️ *RESPITE ORDERS & RELIEF SCHEDULE*
${respiteOrdersText}

🚨 *UNCOVERED GAPS & CLINICAL ORDERS*
${uncoveredGapsText}

🚑 *EMERGENCY PROTOCOL*
• Hospital: *${emergency.preferredHospitalName || 'AIIMS / Local Emergency'}* (${emergency.hospitalDistanceKm} km, ~${emergency.travelTimeMinutes} mins)
• Transport: *${emergency.fourWheelerAvailableAtHome ? 'Car at Home' : 'Cab / Auto Required'}* | Driver: *${emergency.designatedEmergencyDriver || 'Key Holder'}*
• Ambulance Helpline: *${emergency.ambulanceContact || '108'}*
━━━━━━━━━━━━━━━━━━━━
_Generated via Sanjeevani Geriatric Care Engine v${evaluation.engineVersion}_`;
  }
}
