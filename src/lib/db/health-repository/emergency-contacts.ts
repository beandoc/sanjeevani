/** Emergency contact list. */

import type { EmergencyContact } from './types';
import { STORAGE_KEYS } from './storage-keys';
import { DEFAULT_EMERGENCY_CONTACTS } from './defaults';
// --- 6. Emergency Contacts ---

export function getEmergencyContacts(): EmergencyContact[] {
  if (typeof window === 'undefined') return DEFAULT_EMERGENCY_CONTACTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading emergency contacts:', e);
  }
  return DEFAULT_EMERGENCY_CONTACTS;
}

export function saveEmergencyContacts(contacts: EmergencyContact[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_CONTACTS, JSON.stringify(contacts));
  } catch (e) {
    console.error('Error saving emergency contacts:', e);
  }
}
