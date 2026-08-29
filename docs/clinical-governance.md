# Clinical Governance Checklist

Sanjeevani clinical content and rules must be maintained as reviewable decision support. The app must not present local heuristics as validated outcome prediction, diagnosis, treatment, prescribing, or autonomous staffing orders.

## Evidence Labels

Every user-facing clinical output should carry one clear evidence label:

- **Validated Scale**: Published instrument score used within its intended interpretation limits, such as ZBI total score, Katz ADL, or Lawton IADL.
- **Guideline Screen**: Rule derived from a guideline or criteria set, such as selected AGS Beers/STOPP medication flags.
- **Expert Reviewed**: Content or safety note approved by a named clinician or interprofessional reviewer.
- **Planning Estimate**: Sanjeevani local heuristic, such as care-gap hours, staffing ladder rank, or manual-handling risk score.
- **User Entered**: Family, caregiver, nurse, or doctor-entered data that has not yet been independently verified.

## Review Cadence

- Review clinical policy values every 180 days.
- Review sooner after any adverse event, near miss, source-guideline update, workflow change, or pilot finding that could alter recommendations.
- Record reviewer name, specialty, date, source, decision, and rationale for every material rule change.

## Medication Safety Boundary

The medication checker is a limited high-yield screen. A complete medication review requires:

- Current medicine name, generic name when known, dose, route, frequency, timing, indication, start date or duration, and prescriber.
- Renal function/eGFR when dose safety may depend on kidney function.
- Fall history, delirium history, dementia, constipation, urinary retention, low blood pressure, hypoglycemia, bleeding risk, sedation, affordability, and goals of care.
- Prescriber or pharmacist confirmation before stopping, restarting, substituting, or changing dose.

## Validation Path

Before outcome claims, complete:

1. Interprofessional expert concordance study against de-identified dyad cases.
2. 6- to 12-week feasibility pilot in one discharge/home-care pathway.
3. Pre-registered comparative evaluation against usual discharge planning.
4. Safety review of falls, transfer injuries, medication errors, pressure injuries, delirium episodes, missed appointments, caregiver acute distress, and unplanned emergency care.

## Product Wording Rules

- Use "recommendation," "review note," "planning estimate," or "suggestion" for app-generated output.
- Use "prescription," "order," or "clinician directive" only when a licensed clinician explicitly issues it.
- Use "no high-yield alert detected" rather than "safe" for medication screens.
- Use "manual-handling risk flag" rather than deterministic injury prediction.
- Withhold exports when only demo/default data is available.
