/**
 * Sanjeevani Deterministic Shift Allocator & Multi-Generational Calendar Engine
 *
 * Solves the daily patient care assignment problem as a deterministic constraint-satisfaction
 * optimization:
 *
 * Hard Constraints:
 * 1. availableTimeBlocks: Candidate must be active during the diurnal time-block.
 * 2. workCommitmentSchedule: Daytime employment forbids daytime assignment, but only when the
 *    member has not explicitly declared availability for that block (an explicit declaration by
 *    the family always wins over a free-text schedule heuristic).
 * 3. hasPhysicalLimitation: Forbids assignment to heavy_transfers or bathing.
 * 4. age >= 60: Forbids solo assignment to heavy_transfers.
 * 5. careRestrictions: Forbids restricted clinical or physical duties.
 * 6. Designated responsibilities: a member is only rostered for tasks they were actually mapped
 *    to, unless nobody else in the circle can legally perform the task.
 * 7. Daily and per-block capacity: nobody is scheduled beyond their committed hours per day, and
 *    no single person can supply more hours in a block than the block is long.
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
  MonthlyRotationPolicy
} from './care-gap-engine';
import { resolveSupportTypes, performsHeavyTransfers, performsMedicationOrWoundCare } from './formal-support';
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
  /**
   * `unowned_task` — nobody in the circle is both available and permitted to do this task.
   * `residual_hours` — every task has an owner, but the block's demand exceeds their committed
   * hours. The two need different remedies, so they are reported distinctly rather than both
   * appearing as an uncovered task.
   */
  kind: 'unowned_task' | 'residual_hours';
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

/** Real wall-clock length of each diurnal block, in hours. */
export const BLOCK_DURATION_HOURS: Record<DiurnalTimeBlock, number> = {
  morning_rush: 3,
  afternoon: 3,
  evening: 3,
  night_watch: 8
};

/** Length of one full rota cycle implied by the family's rotation interval. */
const ROTATION_CYCLE_DAYS: Record<MonthlyRotationPolicy['rotationInterval'], number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 28
};

/** Task fallen back to when a block carries residual demand but no named task. */
const BLOCK_FALLBACK_TASK: Record<DiurnalTimeBlock, CareTask> = {
  morning_rush: 'bathing',
  afternoon: 'feeding',
  evening: 'feeding',
  night_watch: 'night_care'
};

/** Minimum billable presence for anyone holding at least one task in a block. */
const MIN_PRESENCE_HOURS = 0.5;

type CandidateSource = 'formal' | 'secondary' | 'primary';

interface ShiftCandidate {
  id: string;
  name: string;
  role: CaregiverRole;
  source: CandidateSource;
  /** Tasks this candidate was explicitly mapped to by the family / clinician. */
  designatedTasks: CareTask[];
  /** Tasks this candidate is clinically and physically permitted to perform. */
  capableTasks: CareTask[];
  availableBlocks: DiurnalTimeBlock[];
  remainingDailyHours: number;
  /**
   * Per-block ceiling reserving this person's committed hours across the blocks they actually
   * cover. Without it the first block processed consumes a whole day's capacity, and someone
   * available morning-and-night silently disappears from the night watch.
   */
  fairShareHours: number;
  member?: SecondaryFamilyMember;
}

const ALL_TASKS: CareTask[] = [
  'heavy_transfers',
  'bathing',
  'medications',
  'feeding',
  'night_care',
  'logistics_errands'
];

/** RFC 5545 §3.3.11 text escaping — a comma or semicolon in a name must not split a property. */
function icsEscape(value: string): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Stable, address-safe token for a member id, used for UIDs and ATTENDEE addresses. */
function icsSlug(value: string): string {
  const slug = String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'member';
}

/** RFC 5545 §3.1 content-line folding at 75 octets, with the trailing CRLF each line needs. */
function icsFold(block: string): string {
  return block
    .split('\n')
    .map((line) => {
      if (line.length <= 75) return line;
      const parts: string[] = [line.slice(0, 75)];
      for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
      return parts.join('\r\n');
    })
    .join('\r\n') + '\r\n';
}

export class ShiftAllocator {
  /**
   * Deterministically allocates daily tasks across available team members subject to hard
   * physical and occupational constraints, producing an actionable CareShiftRoster.
   *
   * Allocation is task-driven, not hours-driven: every clinically required task in a block is
   * given a named, eligible owner before residual hours are distributed. A member is never
   * rostered for work they are not permitted to do, and never beyond their committed hours.
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

    const rotation: MonthlyRotationPolicy = safeCaregiver.rotationPolicy || {
      rotationInterval: 'biweekly',
      primaryCaregiverRespiteDaysPerMonth: 4,
      nightShiftArrangement: 'family_rotation'
    };
    const cycleDays = ROTATION_CYCLE_DAYS[rotation.rotationInterval] ?? 14;

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
    // Errands are a real, schedulable midday responsibility whenever the patient can no longer
    // shop, travel to OPD, or prepare meals unaided.
    if (
      !safePatient.lawtonIadl.shopping ||
      !safePatient.lawtonIadl.transportation ||
      !safePatient.lawtonIadl.mealPreparation
    ) {
      blockRequiredTasks.afternoon.push('logistics_errands');
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

    // 2. Build the candidate pool once, with real daily capacity ceilings.
    const candidates = ShiftAllocator.buildCandidates(safeCaregiver, baseEval);

    const blocks: DiurnalTimeBlock[] = ['morning_rush', 'afternoon', 'evening', 'night_watch'];

    // Blocks that actually need staffing today; a candidate's day is reserved across these only.
    const activeBlocks = blocks.filter(
      (b) => (baseEval.blockGaps[b]?.demandHours ?? 0) > 0 || blockRequiredTasks[b].length > 0
    );
    for (const cand of candidates) {
      const covered = activeBlocks.filter((b) => cand.availableBlocks.includes(b)).length;
      cand.fairShareHours = covered > 0 ? cand.remainingDailyHours / covered : cand.remainingDailyHours;
    }

    for (const block of blocks) {
      const tasks = blockRequiredTasks[block];
      const duration = BLOCK_DURATION_HOURS[block];
      const demandHours = Math.max(0, baseEval.blockGaps[block]?.demandHours ?? 0);

      if (demandHours <= 0 && tasks.length === 0) continue;

      const available = candidates
        .filter((c) => c.availableBlocks.includes(block) && c.remainingDailyHours > 0.05)
        .sort((a, b) => ShiftAllocator.candidateOrder(a, b, block, rotation));

      // 2a. Task coverage pass — every required task gets a named, permitted owner.
      const held = new Map<string, CareTask[]>();
      const unassignedTasks: CareTask[] = [];

      for (const task of tasks) {
        const owner = ShiftAllocator.pickOwner(available, task, held, (c) =>
          ShiftAllocator.blockRank(c, block, rotation)
        );
        if (owner) {
          const current = held.get(owner.id) || [];
          current.push(task);
          held.set(owner.id, current);
        } else {
          unassignedTasks.push(task);
        }
      }

      // 2b. Hours pass — distribute the block's demand over the people actually working it,
      //     capped by block length (nobody supplies 12h inside a 3h window) and by the hours
      //     each person committed for the whole day.
      const participants = available.filter((c) => (held.get(c.id) || []).length > 0);
      let remaining = demandHours;

      for (const cand of participants) {
        const ceiling = Math.min(duration, cand.remainingDailyHours, Math.max(cand.fairShareHours, MIN_PRESENCE_HOURS));
        if (ceiling <= 0) continue;
        const wanted = remaining > 0 ? Math.min(ceiling, remaining) : 0;
        const hours = Math.max(Math.min(MIN_PRESENCE_HOURS, ceiling), wanted);
        const rounded = Math.round(hours * 10) / 10;

        rosterBlocks[block].push({
          block,
          blockLabel: DIURNAL_BLOCK_META[block].label,
          timeRange: DIURNAL_BLOCK_META[block].timeRange,
          startHour: DIURNAL_BLOCK_META[block].startHour,
          endHour: DIURNAL_BLOCK_META[block].endHour,
          assignedMemberId: cand.id,
          assignedMemberName: cand.name,
          role: cand.role,
          assignedTasks: held.get(cand.id) || [],
          hoursAllocated: rounded,
          isRespiteShift: false
        });

        cand.remainingDailyHours = Math.max(0, Math.round((cand.remainingDailyHours - rounded) * 10) / 10);
        remaining = Math.max(0, Math.round((remaining - rounded) * 10) / 10);
      }

      // 2c. Residual demand that no task-holder could absorb — offer it to anyone still free in
      //     this block. They pick up whatever is still unowned; if every task already has an
      //     owner they come in as extra presence rather than being listed as a second owner of
      //     work someone else is doing, which is what made delegation look like it changed
      //     nothing on the roster.
      const ownedTasks = new Set<CareTask>(Array.from(held.values()).flat());
      if (remaining > 0.05) {
        for (const cand of available) {
          if (remaining <= 0.05) break;
          if ((held.get(cand.id) || []).length > 0) continue;
          // Extra presence is only useful from someone permitted to do this block's work at all;
          // a member barred from every task here (e.g. an explicit "no night duty") must not be
          // pulled in as a warm body.
          if (tasks.length > 0 && !tasks.some((t) => cand.capableTasks.includes(t))) continue;
          const unowned = tasks.filter((t) => !ownedTasks.has(t));
          const coverable = unowned.filter((t) => cand.capableTasks.includes(t));
          // Someone who cannot do any of the work still outstanding is no help here.
          if (unowned.length > 0 && coverable.length === 0) continue;

          const ceiling = Math.min(duration, cand.remainingDailyHours, Math.max(cand.fairShareHours, MIN_PRESENCE_HOURS));
          if (ceiling <= 0.05) continue;
          const rounded = Math.round(Math.min(ceiling, remaining) * 10) / 10;

          rosterBlocks[block].push({
            block,
            blockLabel: DIURNAL_BLOCK_META[block].label,
            timeRange: DIURNAL_BLOCK_META[block].timeRange,
            startHour: DIURNAL_BLOCK_META[block].startHour,
            endHour: DIURNAL_BLOCK_META[block].endHour,
            assignedMemberId: cand.id,
            assignedMemberName: cand.name,
            role: cand.role,
            assignedTasks: coverable,
            hoursAllocated: rounded,
            isRespiteShift: false
          });
          coverable.forEach((t) => ownedTasks.add(t));

          cand.remainingDailyHours = Math.max(0, Math.round((cand.remainingDailyHours - rounded) * 10) / 10);
          remaining = Math.max(0, Math.round((remaining - rounded) * 10) / 10);
        }
      }

      // 2d. Residual Uncovered Demand — reported once per genuinely unowned task, with the
      //     shortfall split across them rather than repeated in full for each.
      const tier = staffReport.acuityAssessment.dominantSkillTier.replace(/_/g, ' ');
      if (unassignedTasks.length > 0) {
        const per = Math.round((Math.max(remaining, MIN_PRESENCE_HOURS) / unassignedTasks.length) * 10) / 10;
        unassignedTasks.forEach((task) => {
          uncoveredGaps.push({
            block,
            task,
            kind: 'unowned_task',
            unmetHours: per,
            clinicalReason: `No member of the care circle is both available and permitted to perform ${task.replace(/_/g, ' ')} during ${DIURNAL_BLOCK_META[block].label} (${DIURNAL_BLOCK_META[block].timeRange}).`,
            recommendedStaffingOrder: `Suggested for review: ${DIURNAL_BLOCK_META[block].timeRange} (${per}h) ${tier} coverage for ${task.replace(/_/g, ' ')}.`
          });
        });
      } else if (remaining > 0.05) {
        const task = tasks[0] ?? BLOCK_FALLBACK_TASK[block];
        uncoveredGaps.push({
          block,
          task,
          kind: 'residual_hours',
          unmetHours: Math.round(remaining * 10) / 10,
          clinicalReason: `Tasks are owned, but ${Math.round(remaining * 10) / 10}h of ${DIURNAL_BLOCK_META[block].label} demand exceeds the committed hours of everyone rostered.`,
          recommendedStaffingOrder: `Suggested for review: ${DIURNAL_BLOCK_META[block].timeRange} (${Math.round(remaining * 10) / 10}h) ${tier} top-up coverage.`
        });
      }
    }

    // 3. Time-Placed & Task-Specific Respite Orders — honours the full prescribed count,
    //    spread evenly across the month, in the block the primary caregiver actually carries.
    const respiteOrders = ShiftAllocator.buildRespiteOrders(rotation, rosterBlocks, staffReport);

    // 4. Member Load & Ergonomic Summary
    const memberLoadMap = new Map<string, { name: string; role: CaregiverRole; dailyHours: number; blocks: Set<DiurnalTimeBlock>; lifts: boolean }>();

    for (const b of blocks) {
      for (const shift of rosterBlocks[b]) {
        const existing = memberLoadMap.get(shift.assignedMemberId) || {
          name: shift.assignedMemberName,
          role: shift.role,
          dailyHours: 0,
          blocks: new Set<DiurnalTimeBlock>(),
          lifts: false
        };
        existing.dailyHours += shift.hoursAllocated;
        existing.blocks.add(b);
        if (shift.assignedTasks.includes('heavy_transfers')) existing.lifts = true;
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
        : val.lifts
        ? 'Shares manual-handling load — brief on transfer technique'
        : 'Low Physical Risk'
    }));

    return {
      cycleDays,
      blocks: rosterBlocks,
      uncoveredGaps,
      respiteOrders,
      memberLoadSummary,
      evaluatedAt: now.toISOString()
    };
  }

  /**
   * Builds the ordered candidate pool: formal staff, mapped secondary family, then the primary
   * caregiver as the fallback of last resort. Capacity ceilings come from the care-gap engine so
   * the roster can never promise more hours than the engine believes exist.
   */
  private static buildCandidates(
    caregiver: CaregiverAttributes,
    baseEval: CareGapEvaluationResult
  ): ShiftCandidate[] {
    const candidates: ShiftCandidate[] = [];
    const formalSupport = caregiver.formalSupport;
    // Reads the multi-select `types[]` the onboarding and profiler surfaces write, falling back
    // to the legacy single `type`. Previously only `.type` was read here, so a caregiver with a
    // combined team was rostered as if only the first hire existed.
    const selectedTypes = resolveSupportTypes(formalSupport);

    if (selectedTypes.length > 0 && (baseEval.formalSupportAbsorbedHours ?? 0) > 0) {
      const coversNight = selectedTypes.some((t) => t.includes('24h'));
      const coversDay = selectedTypes.some((t) => t.includes('12h') || t.includes('24h'));
      const assistantOnly = selectedTypes.every((t) => t === 'medical_assistant' || t === 'multi_family_rotation' || t === 'none');

      const availableBlocks: DiurnalTimeBlock[] = coversNight
        ? ['morning_rush', 'afternoon', 'evening', 'night_watch']
        : coversDay
        ? ['morning_rush', 'afternoon', 'evening']
        : assistantOnly
        ? ['morning_rush', 'afternoon']
        : ['morning_rush', 'evening'];

      const capable = new Set<CareTask>();
      for (const t of selectedTypes) {
        if (t.startsWith('trained_nurse_')) {
          ['heavy_transfers', 'bathing', 'medications', 'feeding', 'night_care'].forEach((x) => capable.add(x as CareTask));
        } else if (t.startsWith('paid_attendant_')) {
          ['heavy_transfers', 'bathing', 'feeding', 'night_care', 'logistics_errands'].forEach((x) => capable.add(x as CareTask));
        } else if (t === 'medical_assistant') {
          capable.add('medications');
        }
        if (performsHeavyTransfers(t)) capable.add('heavy_transfers');
        if (performsMedicationOrWoundCare(t)) capable.add('medications');
      }
      // The clinician's explicit scope toggles override the type defaults.
      if (formalSupport?.handlesHeavyTransfers === false) capable.delete('heavy_transfers');
      if (formalSupport?.handlesMedicationWoundCare === false) capable.delete('medications');

      const capableTasks = Array.from(capable);
      candidates.push({
        id: 'formal_staff_1',
        name: selectedTypes.some((t) => t.includes('nurse')) ? 'Certified Clinical Nurse' : 'Formal Paid Attendant',
        role: 'formal_staff',
        source: 'formal',
        designatedTasks: capableTasks,
        capableTasks,
        availableBlocks,
        remainingDailyHours: baseEval.formalSupportAbsorbedHours,
        fairShareHours: baseEval.formalSupportAbsorbedHours
      });
    }

    for (const member of caregiver.secondaryMembers || []) {
      const hours = Math.max(0, member.hoursPerDay || 0);
      if (hours <= 0) continue;
      const availableBlocks = ShiftAllocator.memberBlocks(member);
      const capableTasks = ALL_TASKS.filter((t) => ShiftAllocator.isMemberEligible(member, t).eligible);
      candidates.push({
        id: member.id,
        name: member.name || member.relationship.replace(/_/g, ' '),
        role: 'secondary_family',
        source: 'secondary',
        designatedTasks: (member.assignedTasks || []).filter((t) => capableTasks.includes(t)),
        capableTasks,
        availableBlocks,
        remainingDailyHours: hours,
        fairShareHours: hours,
        member
      });
    }

    const primaryBlocks: DiurnalTimeBlock[] = caregiver.employment === 'full_time'
      ? ['morning_rush', 'evening', 'night_watch']
      : ['morning_rush', 'afternoon', 'evening', 'night_watch'];

    if (baseEval.caregiverSafeCapacityHours > 0) {
      candidates.push({
        id: 'primary_caregiver_1',
        name: caregiver.name,
        role: 'primary_caregiver',
        source: 'primary',
        designatedTasks: [],
        capableTasks: ALL_TASKS,
        availableBlocks: primaryBlocks,
        remainingDailyHours: baseEval.caregiverSafeCapacityHours,
        fairShareHours: baseEval.caregiverSafeCapacityHours
      });
    }

    return candidates;
  }

  /** Blocks a member is available for, honouring an explicit declaration over the default. */
  private static memberBlocks(member: SecondaryFamilyMember): DiurnalTimeBlock[] {
    return member.availableTimeBlocks && member.availableTimeBlocks.length > 0
      ? member.availableTimeBlocks
      : (['morning_rush', 'evening'] as DiurnalTimeBlock[]);
  }

  /**
   * Hard Constraint Verification for a Secondary Member. Block availability is checked by the
   * caller; this covers the physical and occupational constraints that apply to a given task.
   */
  static isMemberEligible(
    member: SecondaryFamilyMember,
    task: CareTask
  ): { eligible: boolean; reason?: string } {
    // 1. Physical limitation forbids heavy tasks
    if (member.hasPhysicalLimitation && (task === 'heavy_transfers' || task === 'bathing')) {
      return { eligible: false, reason: 'Physical limitation precludes heavy transfers and bathing' };
    }

    // 2. Age >= 60 restricts solo heavy transfers
    if (member.age >= 60 && task === 'heavy_transfers') {
      return { eligible: false, reason: 'Senior member (age ≥ 60) barred from solo lifting' };
    }

    // 3. Declared functional limitation
    if (member.functionalStatus === 'has_limitations' && (task === 'heavy_transfers' || task === 'bathing')) {
      return { eligible: false, reason: 'Declared functional limitation precludes heavy personal care' };
    }

    // 4. Free-text care restrictions
    const restr = (member.careRestrictions || '').toLowerCase();
    if (restr) {
      if ((restr.includes('no lift') || restr.includes('no lifting') || restr.includes('cannot lift')) && task === 'heavy_transfers') {
        return { eligible: false, reason: 'Explicit restriction on lifting' };
      }
      if (restr.includes('no bath') && task === 'bathing') {
        return { eligible: false, reason: 'Explicit restriction on bathing assistance' };
      }
      if ((restr.includes('no medic') || restr.includes('not trained')) && task === 'medications') {
        return { eligible: false, reason: 'Not cleared to administer medication' };
      }
      if (restr.includes('no night') && task === 'night_care') {
        return { eligible: false, reason: 'Explicit restriction on night duty' };
      }
    }

    return { eligible: true };
  }

  /**
   * True when a free-text work schedule reads as standard daytime employment. Only consulted for
   * members who never declared their own availability windows.
   */
  private static readsAsDaytimeJob(member: SecondaryFamilyMember): boolean {
    const sched = (member.workCommitmentSchedule || member.occupation || '').toLowerCase();
    if (!sched) return false;
    return sched.includes('full') || sched.includes('9am') || sched.includes('9-') || sched.includes('10am') || sched.includes('10-');
  }

  /**
   * Deterministic candidate preference for a block. Formal staff absorb work first, then family
   * who were mapped to the block, and the primary caregiver is always last so delegation
   * actually reduces their load. The night-shift arrangement and the named weekend shift leader
   * from the rotation policy reorder this where the family has expressed a preference.
   */
  private static blockRank(
    candidate: ShiftCandidate,
    block: DiurnalTimeBlock,
    rotation: MonthlyRotationPolicy
  ): number {
    const source = candidate.source;
    if (block === 'night_watch') {
      if (rotation.nightShiftArrangement === 'primary_solo') {
        return source === 'primary' ? 0 : source === 'formal' ? 1 : 2;
      }
      if (rotation.nightShiftArrangement === 'family_rotation') {
        return source === 'secondary' ? 0 : source === 'formal' ? 1 : 2;
      }
      // formal_24h_staff | formal_night_nurse
      return source === 'formal' ? 0 : source === 'secondary' ? 1 : 2;
    }
    return source === 'formal' ? 0 : source === 'secondary' ? 1 : 2;
  }

  private static candidateOrder(
    a: ShiftCandidate,
    b: ShiftCandidate,
    block: DiurnalTimeBlock,
    rotation: MonthlyRotationPolicy
  ): number {
    const rank = (c: ShiftCandidate) => ShiftAllocator.blockRank(c, block, rotation);
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;

    // The nominated shift leader gets first refusal among equally ranked family members.
    const leader = (rotation.weekendShiftLeader || '').trim().toLowerCase();
    if (leader) {
      const aLead = a.name.toLowerCase().includes(leader) ? 0 : 1;
      const bLead = b.name.toLowerCase().includes(leader) ? 0 : 1;
      if (aLead !== bLead) return aLead - bLead;
    }

    // Then spread load: whoever has the most uncommitted time left goes first.
    if (Math.abs(a.remainingDailyHours - b.remainingDailyHours) > 0.05) {
      return b.remainingDailyHours - a.remainingDailyHours;
    }
    return a.id.localeCompare(b.id);
  }

  /**
   * Picks the owner for one task. A member who was actually mapped to the responsibility wins
   * over one who merely could do it, so the family's own delegation drives the roster.
   */
  private static pickOwner(
    available: ShiftCandidate[],
    task: CareTask,
    held: Map<string, CareTask[]>,
    rankOf: (c: ShiftCandidate) => number
  ): ShiftCandidate | undefined {
    const permitted = available.filter((c) => c.capableTasks.includes(task));
    if (permitted.length === 0) return undefined;

    // The rotation policy is the family's explicit statement about who covers a block, so it
    // outranks a task designation; designation then decides within that tier.
    const bestRank = Math.min(...permitted.map(rankOf));
    const tier = permitted.filter((c) => rankOf(c) === bestRank);

    const designated = tier.filter((c) => c.designatedTasks.includes(task));
    const pool = designated.length > 0 ? designated : tier;

    // Among the pool, prefer whoever is carrying the fewest tasks in this block already.
    return pool.slice().sort((a, b) => {
      const load = (held.get(a.id) || []).length - (held.get(b.id) || []).length;
      if (load !== 0) return load;
      return 0; // `available` is already in preference order; keep it stable.
    })[0];
  }

  /**
   * Emits one relief order per prescribed respite day, evenly spaced across a 28-day month, in
   * the block where the primary caregiver is carrying the most work.
   */
  private static buildRespiteOrders(
    rotation: MonthlyRotationPolicy,
    rosterBlocks: Record<DiurnalTimeBlock, AssignedShiftBlock[]>,
    staffReport: StaffingRecommendationReport
  ): CareShiftRoster['respiteOrders'] {
    const requested = rotation.primaryCaregiverRespiteDaysPerMonth;
    const respiteDaysCount = Math.max(0, Math.min(28, Math.round(Number.isFinite(requested) ? requested : 4)));
    const orders: CareShiftRoster['respiteOrders'] = [];
    if (respiteDaysCount === 0) return orders;

    const blocks: DiurnalTimeBlock[] = ['morning_rush', 'afternoon', 'evening', 'night_watch'];
    let targetBlock: DiurnalTimeBlock = 'morning_rush';
    let heaviest = -1;
    for (const b of blocks) {
      const primaryHours = rosterBlocks[b]
        .filter((s) => s.role === 'primary_caregiver')
        .reduce((sum, s) => sum + s.hoursAllocated, 0);
      if (primaryHours > heaviest) {
        heaviest = primaryHours;
        targetBlock = b;
      }
    }

    const meta = DIURNAL_BLOCK_META[targetBlock];
    const recStaffing = staffReport.ladder.find((r) => r.rung === 'recommended') || staffReport.ladder[0];
    const respiteTasks = ['Sponge bath', 'Bed-to-chair transfer', 'Medication dispensing', 'Meal assistance'];
    const spacing = 28 / respiteDaysCount;

    for (let i = 1; i <= respiteDaysCount; i++) {
      const dayNumber = Math.max(1, Math.min(28, Math.round(spacing * i)));
      orders.push({
        dayNumber,
        block: targetBlock,
        reliefAssignee: recStaffing.title,
        specificTasks: respiteTasks,
        orderText: `Respite Day ${i} of ${respiteDaysCount}: ${recStaffing.hoursPerDay}h relief shift (${recStaffing.shiftWindow.replace(/_/g, ' ')}), ${meta.timeRange}, ${respiteTasks.join(' + ')}.`
      });
    }

    return orders;
  }

  /**
   * Generates an RFC 5545 compliant iCalendar string (.ics) emitting
   * distinct VEVENTs per member per assigned block over the rotation cycle,
   * complete with RRULE recurrence, real DTSTART/DTEND, and ATTENDEEs.
   *
   * Care shifts are *daily* commitments, so they recur FREQ=DAILY for the length of the rota
   * cycle. Every shift for a given day starts on that day: a member's morning and evening duties
   * must not land on different dates.
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
    const cycleDays = Math.max(1, activeRoster.cycleDays || 14);

    let vevents = '';
    const blocks: DiurnalTimeBlock[] = ['morning_rush', 'afternoon', 'evening', 'night_watch'];

    blocks.forEach((blockKey) => {
      const meta = DIURNAL_BLOCK_META[blockKey];
      const shifts = activeRoster.blocks[blockKey];

      shifts.forEach((shift, shiftIdx) => {
        const startDate = new Date(now);
        startDate.setHours(meta.startHour, 0, 0, 0);

        const endDate = new Date(startDate);
        if (meta.endHour <= meta.startHour) {
          // Crosses midnight (e.g. night watch 22:00 to 06:00)
          endDate.setDate(endDate.getDate() + 1);
        }
        endDate.setHours(meta.endHour, 0, 0, 0);

        const tasksStr = shift.assignedTasks.map((t) => t.replace(/_/g, ' ')).join(', ') || 'Patient Monitoring & Personal Care';
        const uid = `sanjeevani-shift-${blockKey}-${icsSlug(shift.assignedMemberId)}-${shiftIdx}@sanjeevani.health`;
        const ambulance = caregiver.emergencyLogistics?.ambulanceContact || '108';

        vevents += icsFold(`BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${formatIcsDate(startDate)}
DTEND:${formatIcsDate(endDate)}
RRULE:FREQ=DAILY;COUNT=${cycleDays}
SUMMARY:${icsEscape(`Sanjeevani Care Shift: ${meta.label} — ${shift.assignedMemberName}`)}
DESCRIPTION:${icsEscape(`Patient: ${patient.name}`)}\\n${icsEscape(`Assigned Caregiver: ${shift.assignedMemberName} (${shift.role.replace(/_/g, ' ')})`)}\\n${icsEscape(`Assigned Tasks: ${tasksStr}`)}\\n${icsEscape(`Committed Hours: ${shift.hoursAllocated}h`)}\\n${icsEscape(`Time Window: ${meta.timeRange}`)}\\n${icsEscape(`Emergency Ambulance: ${ambulance}`)}
ATTENDEE;CN=${icsEscape(shift.assignedMemberName)}:mailto:${icsSlug(shift.assignedMemberId)}@care.sanjeevani.local
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT`);
      });
    });

    // Add VEVENTs for Designated Respite Days
    activeRoster.respiteOrders.forEach((resp, idx) => {
      const respMeta = DIURNAL_BLOCK_META[resp.block];
      const respDate = new Date(now);
      respDate.setDate(respDate.getDate() + resp.dayNumber);
      respDate.setHours(respMeta.startHour, 0, 0, 0);
      const respEnd = new Date(respDate);
      if (respMeta.endHour <= respMeta.startHour) {
        respEnd.setDate(respEnd.getDate() + 1);
      }
      respEnd.setHours(respMeta.endHour, 0, 0, 0);

      vevents += icsFold(`BEGIN:VEVENT
UID:sanjeevani-respite-${idx}-${respDate.getTime()}@sanjeevani.health
DTSTAMP:${dtstamp}
DTSTART:${formatIcsDate(respDate)}
DTEND:${formatIcsDate(respEnd)}
SUMMARY:${icsEscape(`🌿 Respite Day for ${caregiver.name} (${resp.reliefAssignee})`)}
DESCRIPTION:${icsEscape(resp.orderText)}\\n${icsEscape(`Tasks: ${resp.specificTasks.join(', ')}`)}\\nPrimary Caregiver Relief Guaranteed
STATUS:CONFIRMED
END:VEVENT`);
    });

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sanjeevani Care//Kutumbh Care Matrix//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${icsEscape(`Sanjeevani Care Circle Roster - ${patient.name}`)}
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

    const rotation: MonthlyRotationPolicy = caregiver.rotationPolicy || {
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
        (s) =>
          `  • *${s.assignedMemberName}* (${s.role.replace(/_/g, ' ')}, ${s.hoursAllocated}h): ${
            s.assignedTasks.length > 0
              ? s.assignedTasks.map((t) => t.replace(/_/g, ' ')).join(', ')
              : 'supervision & presence'
          }`
      );
      return `${meta.icon} *${meta.label} (${meta.timeRange})*\n${lines.join('\n')}`;
    };

    const rosterText = (['morning_rush', 'afternoon', 'evening', 'night_watch'] as DiurnalTimeBlock[])
      .map(formatBlockShifts)
      .join('\n\n');

    const respiteOrdersText = activeRoster.respiteOrders.length > 0
      ? activeRoster.respiteOrders.map((r) => `• *Day ${r.dayNumber}:* ${r.orderText}`).join('\n')
      : '• No respite days currently prescribed — raise with the treating clinician.';

    const uncoveredGapsText = activeRoster.uncoveredGaps.length > 0
      ? activeRoster.uncoveredGaps
          .map((g) => `• ⚠️ *${DIURNAL_BLOCK_META[g.block].label}${g.kind === 'unowned_task' ? ` — no owner for ${g.task.replace(/_/g, ' ')}` : ''}:* ${g.recommendedStaffingOrder}`)
          .join('\n')
      : '• All diurnal blocks fully covered by Care Circle and assigned staff ✅';

    return `🏥 *SANJEEVANI / KUTUMBH CARE CIRCLE PLAN & SHIFT ROSTER*
━━━━━━━━━━━━━━━━━━━━
👤 *Patient:* ${patient.name} (Age ${patient.age})
🤝 *Primary Caregiver:* ${caregiver.name} (${caregiver.kinship}, ${caregiver.dailyHoursCommitted}h committed)
📊 *Care Demand:* ${evaluation.patientCareDemandHours}h/day | *Care Gap:* ${evaluation.netCareGapHours > 0 ? `${evaluation.netCareGapHours}h Deficit ⚠️` : '0h (Fully Covered ✅)'}
🩺 *NIOSH Lifting Index:* ${evaluation.liftingIndex.toFixed(1)} LI (${evaluation.caregiverInjuryRiskCategory} hazard)

📋 *DIURNAL SHIFT ALLOCATIONS (${activeRoster.cycleDays}-DAY ${rotation.rotationInterval.toUpperCase()} ROTATION)*
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
