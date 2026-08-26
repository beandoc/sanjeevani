# **App Name**: Sanjeevani (संजीवनी) / Kutumbh Care Network (कुटुम्ब)

## Core Clinical Highlights: Eliminating the Post-Discharge Care Void

### The Real-World Clinical Problem It Solves

```text
[ Traditional Discharge (Broken) ]
  Doctor gives medical discharge summary ──▶ Family goes home in panic ──▶ Unstructured caregiving & sleep deprivation ──▶ Caregiver breakdown / Readmission in 30 days
```

In traditional geriatric practice:
- **Uncertainty & Panic**: Doctors say *"manage at home with an attendant"*, but families have no idea what tier of staff they need (Nurse vs. Ayah vs. Physio aide), what hours matter, or how to divide tasks among working children.
- **Financial Toxicity**: Families either overspend on expensive 24h nurses they don't need, or hire untrained helpers who drop the patient during transfers.
- **Caregiver Lumbar Injury**: An elderly spouse is left doing heavy bed-to-chair lifts alone.

---

### The "Doctor's Home Care Blueprint" Model (Collaborative Handshake)

```text
[ Doctor in Clinic / OPD / Ward ]
  ├─ 1. Assesses Katz ADLs & Multimorbidity (60 seconds)
  ├─ 2. Prescribes Staffing Tier & Shift Window (e.g. "Targeted 4h Morning Attendant")
  ├─ 3. Orders Assistive Devices (e.g. "Motorized Bed + Ripple Mattress")
  └─ 4. Issues 8-char Invite Code or Sends WhatsApp Link
                │
                ▼ (Instant Cloud Sync via Firestore)
[ Family at Home on Phone (/care-circle) ]
  ├─ 1. Opens the Pre-filled "Doctor's Home Care Blueprint" (Zero blank-page friction)
  ├─ 2. Fine-tunes Real-World Family Logistics (e.g. "Rahul covers 07:30–09:00 before office; Pooja covers evenings")
  └─ 3. Generates 1-Tap WhatsApp Family Care Digest & Calendar Sync (.ics)
```

---

### Why This Is Clinically & Operationally Transformative

#### 1. Zero "Blank Page" Cognitive Friction for Families
When families open the app, they don't see an intimidating blank form asking them to invent a care schedule from scratch. They see:
> **"Dr. Vivek’s Home Care Prescription & Blueprint"**
> - **Prescribed Support**: 4h Morning Shift Attendant (07:00–11:00) for sponge bath and pivot transfers.
> - **Safety Precaution**: Primary caregiver (Smt. Shanti) must not perform solo manual transfers.
> - **Device Orders**: Motorized backrest bed + alternating pressure ripple mattress.

#### 2. Clear Boundary Between "Clinical Orders" vs. "Family Logistics"
- **Doctor’s Role (Clinical Blueprint)**:
  - Determines **Clinical Acuity Tier** (e.g., Catheter/Pressure sore $\rightarrow$ Must be Nurse tier; Bedbound $\rightarrow$ Q2H turning protocol).
  - Flags **Safety Red Lines** (e.g., No heavy lifting for 65+ spouse with osteoporosis).
- **Family’s Role (Logistical Fine-Tuning)**:
  - Assigns who physically does what based on office commutes and family availability (e.g., who drops kids to school, who is free in evenings).
  - Rotates weekend shifts and schedules respite days among siblings.

#### 3. Prevents 30-Day Emergency Hospital Readmissions
- Studies in geriatric transitional care show that structured, task-placed home care plans reduce **30-day post-discharge readmissions by up to 35%**.
- Prevents the three classic causes of readmission: **aspiration pneumonia, transfer-related falls, and pressure ulcer sepsis**.

---

### How Sanjeevani Supports This Flow Today

1. **Doctor Registers & Seeds the Blueprint**:
   - In [`RegisterPatientDialog`](file:///Users/sachinsrivastava/Downloads/sanjeevani/src/components/clinician/register-patient-dialog.tsx) and [`DoctorCareBlueprintDialog`](file:///Users/sachinsrivastava/Downloads/sanjeevani/src/components/clinician/doctor-care-blueprint-dialog.tsx), the doctor enters the baseline and generates an invite code (e.g., `7XK2QNPR`).
   - The doctor's ADL assessment and staffing recommendation draft is stored on the invite (`patientProfileDraft` and `careBlueprint`).
2. **Family Claims the Blueprint**:
   - In [`/onboarding`](file:///Users/sachinsrivastava/Downloads/sanjeevani/src/app/(main)/onboarding/page.tsx) or via SMS/WhatsApp link, the caregiver types the code (or auto-claims via verified phone).
   - The entire clinical profile, demand hours, and recommended staff tier appear pre-populated.
3. **Family Fine-Tunes in `/care-circle`**:
   - The family visits [`/care-circle`](file:///Users/sachinsrivastava/Downloads/sanjeevani/src/app/(main)/care-circle/page.tsx), adds secondary relatives, assigns diurnal blocks, and shares the final plan with the family WhatsApp group.
4. **Doctor Views the Live Dyad Roster in `/clinic/dyad/[patientUid]`**:
   - In follow-up OPD teleconsults or clinic visits, the doctor sees the live updated matrix, actual family compliance, and current care gap score.

---

## Core Features & Modules:

- **Diurnal Care Gap & Biomechanical Load Engine**: Per-block diurnal mismatch index ($g_b$) and NIOSH RNLE lifting index ($LI$).
- **Doctor's Clinical Care Blueprint & Prescription**: Structured discharge prescription bridge linking hospital doctor to home family circle.
- **Multi-Generational Care Circle & WhatsApp Roster**: Constraint satisfaction shift allocator, RFC 5545 `.ics` export, and WhatsApp digest.
- **AGS Beers 2023 / STOPP-START Medication Safety**: Anticholinergic Cognitive Burden ($\text{ACB}$) and deprescribing decision support.
- **Multilingual Geriatric Education Hub**: Evidence-based guides in English, Hindi (हिंदी), and Marathi (मराठी).