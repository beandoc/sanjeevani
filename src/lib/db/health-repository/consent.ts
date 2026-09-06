/** DPDP Act 2023 consent record. */

import type { UserConsentPreferences } from './types';
import { STORAGE_KEYS } from './storage-keys';
import { DEFAULT_CONSENT } from './defaults';
// --- 1. Consent Management (DPDP Act 2023) ---

export function getConsent(): UserConsentPreferences {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSENT);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading consent from storage:', e);
  }
  return DEFAULT_CONSENT;
}

export function saveConsent(consent: Partial<UserConsentPreferences>): UserConsentPreferences {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  const current = getConsent();
  const updated: UserConsentPreferences = {
    ...current,
    ...consent,
    consentTimestamp: new Date().toISOString(),
    dpdpNoticeVersion: '2026.1'
  };
  try {
    localStorage.setItem(STORAGE_KEYS.CONSENT, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving consent to storage:', e);
  }
  return updated;
}
