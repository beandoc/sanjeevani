/**
 * Duty Roster & Role-Scope Guardrail Engine
 *
 * Implements the operational duty roster for home care:
 * - Every task has a time window, accountable person, status, and verification proof
 * - Explicit scope validation prevents dangerous task-role assignments (e.g., catheter care by domestic helper)
 * - Identifies uncovered shift intervals and alerts on night gaps
 */

export type CareRole =
  | 'family_untrained'
  | 'family_trained'
  | 'domestic_helper' // maid/cook (unskilled domestic support)
  | 'general_duty_attendant' // GDA / Bedside assistant
  | 'registered_nurse' // GNM / BSc Nursing
  | 'physiotherapist';

export type TaskType =
  | 'heavy_transfer_bed_to_chair'
  | 'turning_and_repositioning'
  | 'sponge_bath_and_hygiene'
  | 'diaper_change_and_sanitation'
  | 'oral_medication_prompting'
  | 'complex_injection_or_iv'
  | 'catheter_care_and_emptying'
  | 'nasogastric_rt_tube_feed'
  | 'deep_wound_dressing'
  | 'passive_physiotherapy_exercises'
  | 'meal_preparation_and_cooking'
  | 'general_housekeeping_and_laundry'
  | 'overnight_watch_and_monitoring';

export type ShiftTimeWindow =
  | 'morning_07_10'
  | 'midday_11_14'
  | 'afternoon_15_18'
  | 'evening_19_22'
  | 'night_watch_22_06';

export type RosterItemStatus =
  | 'unassigned'
  | 'offered_to_member'
  | 'accepted_by_member'
  | 'completed'
  | 'missed_or_delayed';

export interface RosterItem {
  id: string;
  taskType: TaskType;
  taskLabel: string;
  timeWindow: ShiftTimeWindow;
  assignedRole: CareRole;
  assignedPersonName: string;
  backupPersonName?: string;
  status: RosterItemStatus;
  isCriticalClinicalTask: boolean;
  completionProofNotes?: string;
  completedAt?: string;
}

export interface ScopeValidationResult {
  isSafe: boolean;
  violationReason?: string;
  severity: 'forbidden_scope_violation' | 'unsafe_manual_handling' | 'supervision_recommended' | 'safe';
  recommendedRole: CareRole;
}

export class DutyRosterEngine {
  /**
   * Validates whether a specific care role is clinically permitted to perform a task.
   */
  public static validateTaskRoleScope(task: TaskType, role: CareRole): ScopeValidationResult {
    // 1. Sterile / Invasive / High-risk clinical tasks
    const invasiveTasks: TaskType[] = ['complex_injection_or_iv', 'deep_wound_dressing'];
    if (invasiveTasks.includes(task)) {
      if (role !== 'registered_nurse') {
        return {
          isSafe: false,
          severity: 'forbidden_scope_violation',
          violationReason:
            'Clinical procedure hazard: Injections and deep wound dressings strictly require a licensed Registered Nurse (GNM/BSc) to prevent systemic infection or tissue necrosis.',
          recommendedRole: 'registered_nurse'
        };
      }
      return { isSafe: true, severity: 'safe', recommendedRole: 'registered_nurse' };
    }

    // 2. Catheter & RT Tube feeding
    const tubeTasks: TaskType[] = ['catheter_care_and_emptying', 'nasogastric_rt_tube_feed'];
    if (tubeTasks.includes(task)) {
      if (role === 'domestic_helper' || role === 'family_untrained') {
        return {
          isSafe: false,
          severity: 'forbidden_scope_violation',
          violationReason:
            'Aspiration & Sepsis Hazard: Nasogastric feeding and catheter care must NOT be performed by domestic staff or untrained family. Risk of pulmonary aspiration or severe urinary tract infection.',
          recommendedRole: 'registered_nurse'
        };
      }
      if (role === 'general_duty_attendant') {
        return {
          isSafe: true,
          severity: 'supervision_recommended',
          violationReason: 'General Duty Attendant may assist with catheter bag drainage under clinical supervision, but not insertion/irrigation.',
          recommendedRole: 'registered_nurse'
        };
      }
      return { isSafe: true, severity: 'safe', recommendedRole: 'registered_nurse' };
    }

    // 3. Heavy patient transfers (Bed to chair)
    if (task === 'heavy_transfer_bed_to_chair') {
      if (role === 'domestic_helper') {
        return {
          isSafe: false,
          severity: 'unsafe_manual_handling',
          violationReason:
            'Injury risk: Domestic staff are not trained in ergonomic pivot transfers or gait belt usage. High risk of patient drop or spine injury.',
          recommendedRole: 'general_duty_attendant'
        };
      }
      if (role === 'family_untrained') {
        return {
          isSafe: false,
          severity: 'unsafe_manual_handling',
          violationReason: 'Untrained family members must not lift without bedside transfer training and assistive devices (e.g. slide board/gait belt).',
          recommendedRole: 'family_trained'
        };
      }
      return { isSafe: true, severity: 'safe', recommendedRole: 'general_duty_attendant' };
    }

    // 4. Physical Therapy
    if (task === 'passive_physiotherapy_exercises') {
      if (role === 'domestic_helper') {
        return {
          isSafe: false,
          severity: 'forbidden_scope_violation',
          violationReason: 'Joint subluxation risk: Passive limb mobilization requires a Physiotherapist or specifically trained caregiver.',
          recommendedRole: 'physiotherapist'
        };
      }
      return { isSafe: true, severity: 'safe', recommendedRole: 'physiotherapist' };
    }

    // 5. Domestic helpers doing personal care
    if (role === 'domestic_helper' && (task === 'sponge_bath_and_hygiene' || task === 'diaper_change_and_sanitation')) {
      return {
        isSafe: false,
        severity: 'unsafe_manual_handling',
        violationReason:
          'Personal dignity and hygiene safety: Incontinence care and bed bathing require a trained Bedside Attendant (GDA) to preserve skin integrity and avoid perineal excoriation.',
        recommendedRole: 'general_duty_attendant'
      };
    }

    return {
      isSafe: true,
      severity: 'safe',
      recommendedRole: role
    };
  }

  /**
   * Audits the entire duty roster to find coverage gaps and safety violations.
   */
  public static auditRosterCoverage(items: RosterItem[]): {
    isFullyCovered: boolean;
    uncoveredItems: RosterItem[];
    scopeViolations: { item: RosterItem; validation: ScopeValidationResult }[];
    nightShiftCovered: boolean;
    auditSummary: string;
  } {
    const uncoveredItems = items.filter(
      (item) => item.status === 'unassigned' || item.status === 'offered_to_member'
    );

    const scopeViolations: { item: RosterItem; validation: ScopeValidationResult }[] = [];
    for (const item of items) {
      const validation = this.validateTaskRoleScope(item.taskType, item.assignedRole);
      if (!validation.isSafe) {
        scopeViolations.push({ item, validation });
      }
    }

    const nightItems = items.filter((item) => item.timeWindow === 'night_watch_22_06');
    const nightShiftCovered =
      nightItems.length > 0 &&
      nightItems.every((item) => item.status === 'accepted_by_member' || item.status === 'completed');

    const isFullyCovered = uncoveredItems.length === 0 && scopeViolations.length === 0 && nightShiftCovered;

    let auditSummary = 'Duty roster is fully covered with verified scope boundaries.';
    if (scopeViolations.length > 0) {
      auditSummary = `DANGER: ${scopeViolations.length} task-role scope violation(s) detected. Inappropriate personnel assigned to clinical or transfer tasks.`;
    } else if (!nightShiftCovered) {
      auditSummary = 'CRITICAL GAP: Night Watch (22:00 - 06:00) is uncovered or unaccepted. Imminent nocturnal neglect or caregiver collapse risk.';
    } else if (uncoveredItems.length > 0) {
      auditSummary = `WARNING: ${uncoveredItems.length} task(s) currently unassigned or awaiting family acceptance.`;
    }

    return {
      isFullyCovered,
      uncoveredItems,
      scopeViolations,
      nightShiftCovered,
      auditSummary
    };
  }
}
