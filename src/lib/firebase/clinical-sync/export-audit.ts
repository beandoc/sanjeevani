/**
 * Append-only audit trail of consented exports (WhatsApp digest, .ics roster) for a dyad.
 * `users/{patientUid}/exportAuditLog/{entryId}` — creatable by the owner or a granted clinician,
 * readable by both, never updated or deleted from the client.
 */

import { collection, doc, getDocs, orderBy, query, setDoc, limit as qLimit } from 'firebase/firestore';
import { db } from '../client';
import type { ExportAuditEntry } from '@/lib/sharing/consented-export';

const LOCAL_KEY = 'sanjeevani_export_audit_v1';

function readLocal(): Record<string, ExportAuditEntry[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ExportAuditEntry[]>) : {};
  } catch {
    return {};
  }
}

function writeLocal(all: Record<string, ExportAuditEntry[]>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch {
    // Storage quota / private mode: the cloud copy is the durable one.
  }
}

/** Records the export locally first (so an offline export still leaves a trace), then in the cloud. */
export async function recordExportAuditFor(patientUid: string, entry: ExportAuditEntry): Promise<{ cloud: boolean }> {
  const all = readLocal();
  all[patientUid] = [entry, ...(all[patientUid] || [])].slice(0, 200);
  writeLocal(all);

  if (!db) return { cloud: false };
  try {
    await setDoc(doc(db, 'users', patientUid, 'exportAuditLog', entry.id), entry);
    return { cloud: true };
  } catch (err) {
    console.error('Export audit cloud write failed (local copy kept):', err);
    return { cloud: false };
  }
}

export async function getExportAuditFor(patientUid: string, max = 50): Promise<ExportAuditEntry[]> {
  if (db) {
    try {
      const snap = await getDocs(
        query(collection(db, 'users', patientUid, 'exportAuditLog'), orderBy('exportedAt', 'desc'), qLimit(max))
      );
      if (!snap.empty) return snap.docs.map((d) => d.data() as ExportAuditEntry);
    } catch {
      // fall through
    }
  }
  return (readLocal()[patientUid] || []).slice(0, max);
}
