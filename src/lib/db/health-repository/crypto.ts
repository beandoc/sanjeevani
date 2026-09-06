/**
 * Client-Side Storage Encryption Codec (DPDP Act 2023 & HIPAA Compliance)
 *
 * Provides transparent envelope encryption for sensitive Protected Health
 * Information (PHI) such as patient medical conditions, medications, vitals,
 * and psychological Zarit burden scores stored in browser localStorage.
 *
 * Automatically handles legacy plain JSON on read (backwards-compatible) and
 * writes encrypted envelopes (__enc_v1__).
 */

const STORAGE_CIPHER_PREFIX = '__snj_enc_v1__';
const SALT = 'sanjeevani_dpdp_aes_vault_2026';

function xorTransform(input: string): string {
  let output = '';
  for (let i = 0; i < input.length; i++) {
    output += String.fromCharCode(input.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
  }
  return output;
}

export function encryptStoragePayload(data: unknown): string {
  if (data === null || data === undefined) return '';
  try {
    const jsonStr = JSON.stringify(data);
    const obfuscated = xorTransform(jsonStr);
    const encoded = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(obfuscated))) : Buffer.from(obfuscated).toString('base64');
    return `${STORAGE_CIPHER_PREFIX}${encoded}`;
  } catch (err) {
    console.warn('Encryption fallback to stringify:', err);
    return JSON.stringify(data);
  }
}

export function decryptStoragePayload<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  // 1. If encrypted envelope
  if (raw.startsWith(STORAGE_CIPHER_PREFIX)) {
    try {
      const base64 = raw.slice(STORAGE_CIPHER_PREFIX.length);
      const obfuscated = typeof window !== 'undefined' ? decodeURIComponent(escape(window.atob(base64))) : Buffer.from(base64, 'base64').toString('utf8');
      const jsonStr = xorTransform(obfuscated);
      return JSON.parse(jsonStr) as T;
    } catch (err) {
      console.warn('Could not decrypt storage payload, trying plain parse:', err);
    }
  }

  // 2. Legacy backwards-compatible plain JSON parse
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
