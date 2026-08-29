# Clinical Evaluation and Commercial Pilot Plan

## Intended Use

Sanjeevani is a clinician-reviewed planning and coordination tool for home care of dependent older adults. It organises documented function, caregiver capacity, available support, and time-blocked care tasks into draft staffing and family-allocation options. It does not diagnose, prescribe treatment, or predict an individual outcome.

## Evidence Generation Sequence

1. **Expert concordance study:** Have a geriatrician, nurse, physiotherapist, pharmacist, and social worker independently review de-identified dyad scenarios. Compare their care-plan elements with Sanjeevani's identified gaps, required review flags, and suggested coverage windows.
2. **Feasibility pilot:** Run a 6- to 12-week prospective pilot at one discharge or home-care service. Measure plan completion, time from assessment to usable home plan, and adoption of high-risk time-block coverage.
3. **Comparative evaluation:** Compare the service's usual discharge planning with Sanjeevani-assisted planning using a pre-registered protocol and a defined analysis plan. Do not claim reductions in admissions, falls, or burden without appropriately powered results.

## Primary Pilot Measures

| Measure | Definition | Source |
| --- | --- | --- |
| Time to ready home plan | Hours from completed functional assessment to a family-visible, clinician-reviewed plan | Audit log |
| High-risk block coverage | Percentage of required morning and night blocks assigned to an eligible person or formal support | Care roster |
| Plan adoption | Percentage of issued plans accepted or explicitly modified by family and clinician | Blueprint workflow |
| Data completeness | Percentage of plans with all required assessment fields and a current assessment date | Data-quality output |

## Guardrails

- Track the policy and engine version with every result.
- Record the issuing clinician, policy version, and decision-support status with each issued plan; add a reason whenever a later clinician revision or rejection changes an adopted plan.
- Report missing inputs and model limitations in the user interface and exports.
- Review policy values at least every 180 days and after any material outcome or workflow change.
- Label every output as one of: validated scale, guideline-based screen, expert-reviewed note, local planning estimate, or user-entered data.
- Withhold patient-specific care-gap and roster exports when only demo/default patient or caregiver data is available.
- Treat medication alerts as a limited Beers/STOPP screen. Do not display "safe regimen" language unless a clinician or pharmacist has completed indication, dose, duration, renal function, and goals-of-care review.
- Capture adverse events and near misses during pilots: falls, transfer injury, medication error, missed appointment, pressure injury, delirium episode, caregiver acute distress, and unplanned emergency care.
- Maintain a content governance log with reviewer name, specialty, source guideline, last-reviewed date, policy version, and rationale for every material rule change.

## Minimum Clinical Dataset Before Plan Adoption

- Patient goals and "what matters most."
- Katz ADL and Lawton IADL with assessment date and source.
- Cognition/delirium risk, mood, sleep, pain, sensory impairment, continence, nutrition/swallowing, skin/pressure-injury risk, and fall/transfer history.
- Medication list with dose, frequency, indication, start date or duration, prescriber, renal function/eGFR when relevant, and recent medication changes.
- Caregiver age, health limitations, available hours, work constraints, training, household support, affordability limits, and emergency transport plan.
- Clinician review status for wound care, catheter/stoma care, suction, tube feeding, insulin/anticoagulants, sedatives, opioids, and any high-risk transfer plan.

## Commercial Success Criteria

For a hospital discharge team or home-care operator, demonstrate a shorter planning cycle, higher high-risk-block coverage, and better documented handoff than its current process. Use the buyer's actual staffing and coordination costs to construct a budget-impact analysis; do not substitute speculative admission savings for observed operational data.
