# Care-Time Calibration Protocol

Extends `clinical-evaluation-plan.md`. That plan sequences expert concordance, a feasibility pilot, and a comparative evaluation. None of those calibrate care time. This protocol covers the missing study: replacing the care-demand model's assumed coefficients with measured ones, and replacing its assumed uncertainty with a measured prediction interval.

## Why this is needed

`care-demand-model.ts` emits a planning range built entirely from expert consensus. Every coefficient carries `@calibration expert-consensus, uncalibrated`, and the band's width is an assumption anchored on published variance ceilings rather than on this service's own error. Until that changes, the honest description of the output is "an uncalibrated planning range for clinician review," which is what the UI says.

Calibration does not make the model a determination of required hours. Purpose-built, time-calibrated home-care case-mix systems explain only 16–24% of individual care-hour variance (Parsons 2018; Bolster-Foucault 2023). Calibration moves the output from *assertion* to *estimate with a known error*. That is the whole goal, and it is worth having.

## What has to be measured

| Quantity | Model field | Unit | Method |
| --- | --- | --- | --- |
| Hands-on task time | `directCare` | Caregiver-minutes per episode, plus episodes/day | Episode log |
| Active supervision | `supervision` | Elapsed minutes, net of hands-on overlap | Presence grid |
| On-call presence | `onCall`, `coverage` | Elapsed minutes present-but-not-engaged | Presence grid |

56 load-bearing numbers: a frequency and a duration for each of 20 live Barthel item×level cells and 8 Lawton items. Plus shared-setup credit, the bed-bound and double-incontinence thresholds, four cognitive-supervision levels, night presence, and the band-width parameters.

Two of the 20 Barthel cells are two-person tasks. Staff count is structural, not estimated — but the episode log must record it, because workload and elapsed time diverge there.

## Design: nested diary with an observed subsample

**Do not calibrate on caregiver diaries alone.** Cotter et al. (Clin Rehabil 2002) found caregivers rate the *level* of dependence well (rs 0.62–0.91) but consistently overestimate how long their assistance takes, against videotaped observation. A model fitted to diaries inherits that overestimation as a permanent upward bias.

So:

- **Diary arm** — all enrolled dyads, 3 consecutive days including one weekend day.
- **Observation arm** — a random subsample of 12–15 dyads, one full waking day each, direct observation by a trained observer recording the same schema.
- **Bias model** — estimate the diary-to-observation ratio per task domain from the subsample; apply it as a measurement-error correction to the diary-derived coefficients. Report the ratio; it is a finding in its own right.

Randomise the observation subsample from enrolled dyads, stratified by dependence band, so the correction is not estimated on an unrepresentative slice.

## Outcome definition — fix before collection

Declare the target in the pre-registration. These are different quantities and the choice determines what the model means:

- **Delivered** — what the caregiver actually did. What a diary natively captures. Calibrating to this reproduces existing rationing as if it were need.
- **Needed** — delivered plus unmet. The model's stated purpose is planning what is required, so this is the target.

**Therefore every diary day must capture unmet need at task level**, not just activity: for each task, was help needed and not given, and for roughly how long. Without this field the study can only calibrate *delivered*, and the model's claim quietly changes from "required" to "customary," which is the error this whole exercise exists to avoid.

Record paid and unpaid time separately. A household that buys 12 hours of attendant time has different observed hours and identical underlying need.

## Instrument

Two parts per day, mapping one-to-one onto the model's three outputs.

**1. Episode log** — one row per care episode:

| Field | Note |
| --- | --- |
| Task | Picked from the Barthel/Lawton item list, so it joins to `BARTHEL_TASK_WEIGHTS` keys |
| Start / end time | Duration derived, not self-estimated as a total |
| Number of helpers | Distinguishes caregiver-minutes from elapsed minutes |
| Assistance level | Prompting / setup / standby / partial physical / full / hoist-or-two-person |
| Who | Family caregiver, paid attendant, nurse, other |
| Unmet | Needed and not given, with approximate shortfall |

**2. Presence grid** — 48 half-hour slots, each marked: *actively supervising*, *present and available*, or *absent*. This is the only reliable way to measure supervision and on-call, which diaries record badly as totals. It also yields the overlap directly: a slot that is both an episode and a supervision slot is counted once.

Assistance level must be captured per episode, not assumed from the Barthel score. The whole point of the graded model is that "major help, one or two people" and "minor help" are different tasks; the study has to observe that distinction rather than infer it.

## Sample and unit of analysis

The unit differs by parameter, which is what makes a modest sample workable:

| Parameter | Unit | Effective n at 40 dyads × 3 days |
| --- | --- | --- |
| Duration per item×level | Task episode | ~2,000–6,000 episodes |
| Frequency per item×level | Patient-day | 120 patient-days |
| Total-model accuracy | Patient | 40 |

Target **40–60 dependent dyads**, enrolled consecutively, excluding fully independent patients (they generate no episodes). Stratify enrolment across Barthel bands so severe and total dependence are represented; a consecutive sample skews moderate.

Durations are well-powered. Totals are not: between-patient n stays at 40, so the model's prediction interval will be wide. That is the correct result, not a failure of the study.

**Rare cells will not calibrate.** Two-person floor transfers and severe-sundowning supervision occur in few dyads. Expect partial calibration, and build for it (below) rather than pretending the whole table moved.

## Analysis plan — pre-register before unblinding

1. **Durations.** Mixed-effects model: `log(minutes) ~ item × assistance_level + helpers + (1 | patient)`. Log scale because durations are right-skewed and variance scales with the mean. Patient random intercept because episodes within a patient are correlated — treating 2,000 episodes as independent would produce false precision, which is this model's besetting sin.
2. **Frequencies.** Poisson or negative-binomial count model per item×level, offset by observed days. Report the *distribution*, not only the mean: frequency is patient-specific and the model already supports per-patient clinician override. The calibrated default is a starting point; the spread tells the clinician how much the override matters.
3. **Diary bias.** Estimate the observation-to-diary ratio per task domain from the subsample; apply to diary-derived durations with its own uncertainty propagated.
4. **Overlap.** Validate the de-overlap rule empirically from the presence grid: compare measured non-overlapping supervision against what the model's per-block subtraction predicts. Recalibrate `SHARED_SETUP_MINUTES_PER_TASK` from observed co-occurring episodes.
5. **Total-model validation.** Split-sample or k-fold. Report, on held-out data: R², mean absolute error in hours/day, calibration slope and intercept against observed, and a calibration plot across dependence bands. Report separately for `activeCare` and `coverage` — they are different quantities and may calibrate differently.
6. **Subgroups.** Sex, dementia vs none, joint vs nuclear household, urban vs rural, paid staff present vs absent. Pre-specify these; do not go looking afterwards.

Expect R² in the region of 0.2–0.3 for totals. **An R² much above 0.4 should be treated as a red flag for leakage or overfitting, not as success** — it would exceed what purpose-built case-mix systems achieve on larger samples.

## Band width and asymmetric loss

This is the main deliverable. Replace the assumed `BAND_WIDTH.base` with the measured out-of-sample prediction interval. Keep the additive widening terms for missing items, reporting source, and legacy binary input, but re-estimate each from the data rather than leaving them as assumptions.

Under-allocation and over-allocation are not symmetric harms. An underestimate lands on an unpaid family caregiver's health and on the patient's safety; an overestimate costs a family money out of pocket. `CLINICAL_POLICY.staffingRanking` already encodes this asymmetry by reading the high band edge for safety-critical coverage and the midpoint for cost tiering. Calibrate accordingly:

- **Quantile regression** for the safety edge — fit the 80th percentile of coverage, not the mean.
- **Median regression** for the cost edge.

Report the realised under-allocation rate on held-out data: the proportion of patient-days where observed need exceeded the model's upper edge. That number, not R², is the safety claim.

## Partial calibration is the expected outcome — build for it

Rare cells will stay uncalibrated. The model must therefore track calibration status per coefficient and widen the band when an uncalibrated cell is load-bearing for the patient in front of the clinician.

Extend `CALIBRATION` in `care-demand-model.ts` from a single boolean to a per-coefficient registry holding, for each cell: calibrated yes/no, episode count, point estimate, standard error, and date. Then `estimateCareDemand` adds a band-width term proportional to the share of a given patient's estimated minutes coming from uncalibrated cells, and `bandBasis` names them. A patient whose demand is dominated by a well-measured toileting cell gets a narrow band; one dominated by an unmeasured two-person floor transfer does not. The band stops being a global constant and becomes a property of the individual estimate — which is what it should have been.

## Governance

- Institutional ethics committee approval before any enrolment. This is human-subjects research on a vulnerable population.
- Informed consent from the caregiver, and from the patient or their surrogate, covering observation in the home. Consent to observation must be separately and explicitly given.
- Pre-register the protocol and analysis plan (CTRI accepts observational studies) before collection. Pre-registration is what separates calibration from curve-fitting.
- DPDP Act 2023 compliance for diary and observation data; minimise identifiers, store de-identified analysis extracts separately.
- Log the policy and engine version with every record, per the existing guardrails.
- On completion, bump `CLINICAL_POLICY.version` and `reviewedAt`, record the change in the content governance log with reviewer name and rationale, and update the `knownLimitations` in `CLINICAL_PROVENANCE.careDemandModel` to state what is now measured and what is not.
- Calibration does not change the evidence label. A locally calibrated local model remains **Planning Estimate** under `clinical-governance.md`. It may not be relabelled, and it must not become an automatic staffing or funding decision.

## Phasing

| Phase | Weeks | Work |
| --- | --- | --- |
| 0. Instrument what exists | 0–4 | Log every estimate with inputs, outputs, and policy version. Capture what the clinician actually prescribed against what the model said. Zero research cost. |
| 1. Governance and pilot | 4–10 | Ethics submission and pre-registration. Pilot the diary on 8–10 dyads; fix the instrument before it is used at scale. |
| 2. Collection | 10–22 | 40–60 dyads, 3 days each. Observation subsample of 12–15 in parallel. |
| 3. Fit and replace | 22–28 | Analysis per the plan. Replace coefficients, set band width from residuals, populate the calibration registry, bump policy version. |
| 4. Drift monitoring | ongoing | Keep comparing live estimates against prescribed and logged care. Re-review at the 180-day cadence. |

**Start with Phase 0.** Logging estimates against clinician overrides costs almost nothing and answers the first-order question within weeks: is the model systematically wrong, and in which direction. If it is out by a factor of two, that shows up in the override log long before a diary study reports, and it may change how the diary study is designed.

## What is already built

Phase 0 and the registry are implemented. The study design above is what remains.

| Piece | Where | Status |
| --- | --- | --- |
| Per-coefficient registry | `CALIBRATION_REGISTRY` in `care-demand-model.ts` | Built, empty by design |
| Calibrated values override consensus | `estimateCareDemand` | Built |
| Band widens by unmeasured share | `BAND_WIDTH.perUncalibratedShare` | Built |
| Estimate + decision log | `db/health-repository/calibration-log.ts` | Built, device-local |
| Decision capture at point of care | `doctor-care-blueprint-dialog.tsx` | Built |
| Calibration-in-the-large summary | `summarizeCalibrationInLarge()` | Built |
| Analysis export | `exportCalibrationRows()` | Built |
| Cloud aggregation across clinicians | — | **Not built** |
| Diary and observation capture | — | Not built |

### How the registry works

Keys are `<barthelItemId>:<optionValue>` for graded Barthel cells and the bare item id for Lawton. A cell needs `MIN_EPISODES_FOR_CALIBRATION` (20) observed episodes before it is used; below that the estimate is noise and must not narrow the band. A calibrated cell's measured duration and frequency replace the consensus default, while a clinician's explicit frequency override still beats both — they are describing this patient, the study described a population.

`band.calibrationCoverage` reports the calibrated and uncalibrated minutes behind each estimate and names the unmeasured cells. The band then widens in proportion to the unmeasured share, so two patients assessed the same day get different uncertainty when different cells drive them. Loading measured values is a data change, not a code change.

### Known limitation: the log is device-local

`calibration-log.ts` writes to `localStorage`, following the repository's offline-first convention. The log therefore lives on the clinician's own device and **does not aggregate across clinicians or survive a browser reset**. For a single-site pilot with one or two clinicians that is workable, with a periodic `exportCalibrationRows()` extract. For anything larger it is not.

Cloud aggregation needs a Firestore subcollection with append-only security rules and emulator-tested access control, matching the `functionScores` and `vitals` pattern. That is deliberately not written yet: security rules governing clinical data should not be added without the emulator test suite running against them.

### Reading the signal

`summarizeCalibrationInLarge()` returns the count of decisions, how many fell inside the model's band, and the mean signed and absolute error in hours per day. **A positive mean signed error means the model reads low against clinical judgement.** The absolute error is reported separately because a model wrong in both directions can show a mean signed error of zero.

Treat this as a bias detector, not a validation. Clinicians see the model's range before deciding, so their figure is anchored by it and the two are not independent. It will reliably catch a factor-of-two error; it cannot establish that the model is right.

## Stopping criteria

Pre-specify what would mean this approach should be abandoned rather than refined:

- Observed-to-diary ratios so unstable across domains that the bias correction cannot be estimated.
- Held-out calibration slope far from 1 with no stable recalibration across dependence bands.
- Under-allocation at the upper band edge on held-out data exceeding a pre-agreed safety threshold.
- Between-patient variance so dominant that item-level structure adds nothing over a simple dependence band.

If the last of these holds, the defensible product is a banded dependence category with an explicit coverage schedule — not an hours figure. That would be a legitimate finding, and a better outcome than a precise-looking number nobody can support.

## Alternatives to building this from scratch

If a calibration study is not feasible, use an instrument that already has one and accept its scope:

- **RUD (Resource Utilization in Dementia)** — validated for informal care-time measurement in community-dwelling dementia. Appropriate where care time is the actual outcome. Dementia-specific; it does not generalise to a geriatric care-hours formula.
- **interRAI Personal Support Algorithm** — an evidence-based home-support allocation framework. Its service-hour outputs reflect the system it was developed in and require local calibration before use here, so this does not remove the problem, only relocates it.
- **NPDS → NPCNA (Northwick Park)** — purpose-built to convert dependency into care hours and cost, with a published derivation. The closest existing analogue to what this model attempts.

Adopting one of these and reporting its scope limits honestly is a defensible choice. Keeping an uncalibrated local model and describing it as determining required hours is not.
