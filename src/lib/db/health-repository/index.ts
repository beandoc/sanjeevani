/**
 * Sanjeevani Health & Clinical Repository
 * Offline-first, privacy-compliant data repository conforming to DPDP Act 2023.
 * Supports complete data portability (export) and Right to Erasure (instant purge).
 */

/**
 * ---------------------------------------------------------------------
 * This was one 1,713-line class of static methods. It is now split by
 * record type into the modules imported below, with `HealthRepository`
 * kept as an explicit facade so the original import path
 * (`@/lib/db/health-repository`) and every `HealthRepository.x()` call
 * site work unchanged. The facade is spelled out rather than spread so
 * the public surface stays visible in one place.
 */

import * as consent from './consent';
import * as vitals from './vitals';
import * as dailycarelogs from './daily-care-logs';
import * as appointments from './appointments';
import * as moduleprogress from './module-progress';
import * as assessments from './assessments';
import * as emergencycontacts from './emergency-contacts';
import * as checklists from './checklists';
import * as medications from './medications';
import * as nursingprocedures from './nursing-procedures';
import * as carecircle from './care-circle';
import * as dyadprofile from './dyad-profile';
import * as registeredpatients from './registered-patients';
import * as dataportability from './data-portability';

export * from './types';
export { STORAGE_KEYS } from './storage-keys';

export const HealthRepository = {
  getConsent: consent.getConsent,
  saveConsent: consent.saveConsent,
  getVitals: vitals.getVitals,
  addVital: vitals.addVital,
  deleteVital: vitals.deleteVital,
  getDismissedVitalIds: vitals.getDismissedVitalIds,
  dismissVital: vitals.dismissVital,
  undismissVital: vitals.undismissVital,
  getVitalsFor: vitals.getVitalsFor,
  saveVitalFor: vitals.saveVitalFor,
  mergeVitals: vitals.mergeVitals,
  getDailyCareLogs: dailycarelogs.getDailyCareLogs,
  saveDailyCareLog: dailycarelogs.saveDailyCareLog,
  getDailyCareLogsFor: dailycarelogs.getDailyCareLogsFor,
  saveDailyCareLogFor: dailycarelogs.saveDailyCareLogFor,
  getAppointments: appointments.getAppointments,
  addAppointment: appointments.addAppointment,
  deleteAppointment: appointments.deleteAppointment,
  mergeAppointments: appointments.mergeAppointments,
  getModuleProgressMap: moduleprogress.getModuleProgressMap,
  getCompletedSections: moduleprogress.getCompletedSections,
  toggleSectionCompletion: moduleprogress.toggleSectionCompletion,
  mergeModuleProgress: moduleprogress.mergeModuleProgress,
  getZaritAssessments: assessments.getZaritAssessments,
  saveZaritAssessment: assessments.saveZaritAssessment,
  mergeZaritAssessments: assessments.mergeZaritAssessments,
  getZaritAssessmentsFor: assessments.getZaritAssessmentsFor,
  saveZaritAssessmentFor: assessments.saveZaritAssessmentFor,
  getFunctionScoresFor: assessments.getFunctionScoresFor,
  saveFunctionScoreFor: assessments.saveFunctionScoreFor,
  getEmergencyContacts: emergencycontacts.getEmergencyContacts,
  saveEmergencyContacts: emergencycontacts.saveEmergencyContacts,
  getBedsideRoutineChecklist: checklists.getBedsideRoutineChecklist,
  saveBedsideRoutineChecklist: checklists.saveBedsideRoutineChecklist,
  getDischargeMilestones: checklists.getDischargeMilestones,
  saveDischargeMilestones: checklists.saveDischargeMilestones,
  getMedications: medications.getMedications,
  saveMedications: medications.saveMedications,
  getMedicationsFor: medications.getMedicationsFor,
  saveMedicationsFor: medications.saveMedicationsFor,
  toggleMedicationTaken: medications.toggleMedicationTaken,
  getNursingProceduresFor: nursingprocedures.getNursingProceduresFor,
  saveNursingProceduresFor: nursingprocedures.saveNursingProceduresFor,
  getCareCircleMembers: carecircle.getCareCircleMembers,
  saveCareCircleMembers: carecircle.saveCareCircleMembers,
  getCareCircleTasks: carecircle.getCareCircleTasks,
  saveCareCircleTasks: carecircle.saveCareCircleTasks,
  toggleCareCircleTask: carecircle.toggleCareCircleTask,
  careCircleToday: carecircle.careCircleToday,
  rolloverCareCircleTasks: carecircle.rolloverCareCircleTasks,
  reconcileCareCircleTasks: carecircle.reconcileCareCircleTasks,
  reconcileCareCircleMembers: carecircle.reconcileCareCircleMembers,
  getCaregiverAttributes: dyadprofile.getCaregiverAttributes,
  hasStoredCaregiverAttributes: dyadprofile.hasStoredCaregiverAttributes,
  saveCaregiverAttributes: dyadprofile.saveCaregiverAttributes,
  getPatientProfile: dyadprofile.getPatientProfile,
  hasStoredPatientProfile: dyadprofile.hasStoredPatientProfile,
  hasStoredDyadProfile: dyadprofile.hasStoredDyadProfile,
  savePatientProfile: dyadprofile.savePatientProfile,
  getCareGapEvaluation: dyadprofile.getCareGapEvaluation,
  saveCareGapEvaluation: dyadprofile.saveCareGapEvaluation,
  getStoredCareGapEvaluation: dyadprofile.getStoredCareGapEvaluation,
  getRegisteredPatients: registeredpatients.getRegisteredPatients,
  saveRegisteredPatient: registeredpatients.saveRegisteredPatient,
  removeRegisteredPatient: registeredpatients.removeRegisteredPatient,
  getArchivedDyads: registeredpatients.getArchivedDyads,
  archiveDyad: registeredpatients.archiveDyad,
  unarchiveDyad: registeredpatients.unarchiveDyad,
  getRegisteredPatient: registeredpatients.getRegisteredPatient,
  savePatientProfileFor: registeredpatients.savePatientProfileFor,
  getPatientProfileFor: registeredpatients.getPatientProfileFor,
  saveCaregiverAttributesFor: registeredpatients.saveCaregiverAttributesFor,
  getCaregiverAttributesFor: registeredpatients.getCaregiverAttributesFor,
  getDyadInvites: registeredpatients.getDyadInvites,
  saveDyadInvite: registeredpatients.saveDyadInvite,
  getDyadInvite: registeredpatients.getDyadInvite,
  purgeAllDemoDyadsFromStorage: registeredpatients.purgeAllDemoDyadsFromStorage,
  exportAllUserData: dataportability.exportAllUserData,
  deleteAllUserData: dataportability.deleteAllUserData,
};
