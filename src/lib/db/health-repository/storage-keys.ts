/**
 * localStorage keys for every vault this repository owns. Changing one
 * orphans existing on-device data, so treat these as a storage contract.
 */

export const STORAGE_KEYS = {
  CONSENT: 'sanjeevani_dpdp_consent',
  VITALS: 'sanjeevani_vitals_vault',
  DAILY_CARE_LOGS: 'sanjeevani_daily_care_logs_vault',
  APPOINTMENTS: 'sanjeevani_appointments_vault',
  ZARIT: 'sanjeevani_zarit_vault',
  FUNCTION_SCORES: 'sanjeevani_function_scores_vault',
  MODULE_PROGRESS: 'sanjeevani_module_sections_vault',
  USER_PROFILE: 'sanjeevani_user_profile',
  EMERGENCY_CONTACTS: 'sanjeevani_emergency_contacts',
  MEDICATIONS: 'sanjeevani_medications_vault',
  CARE_CIRCLE_MEMBERS: 'sanjeevani_circle_members',
  CARE_CIRCLE_TASKS: 'sanjeevani_circle_tasks',
  CAREGIVER_ATTRIBUTES: 'sanjeevani_caregiver_attributes',
  PATIENT_PROFILE: 'sanjeevani_patient_dependence_profile',
  CARE_GAP_EVALUATION: 'sanjeevani_care_gap_evaluation',
  CLINICIAN_PATIENTS: 'sanjeevani_clinician_patients',
  DYAD_INVITES: 'sanjeevani_dyad_invites'
};
