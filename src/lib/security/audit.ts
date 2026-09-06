/**
 * Server-side audit logging for clinical access and auth boundaries.
 * Emits structured JSON events compliant with compliance log drains.
 */

export interface AuditLogEntry {
  timestamp: string;
  eventType:
    | 'AUTH_SESSION_CREATED'
    | 'AUTH_SESSION_VERIFIED'
    | 'AUTH_SESSION_REJECTED'
    | 'CLINICAL_COHORT_READ'
    | 'ADMIN_CLAIMS_PROVISIONED'
    | 'ADMIN_CLAIMS_REJECTED'
    | 'RATE_LIMIT_EXCEEDED';
  actorUid?: string | null;
  actorRole?: string | null;
  targetUid?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  details?: Record<string, unknown>;
}

export function logAuditEvent(entry: AuditLogEntry): void {
  const record = {
    ...entry,
    auditLog: true,
    env: process.env.NODE_ENV || 'development'
  };
  console.info(`[SECURITY_AUDIT] ${JSON.stringify(record)}`);
}
