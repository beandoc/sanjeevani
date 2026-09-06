/**
 * Client-Side Storage Obfuscation Codec
 *
 * NOTE: This provides basic string obfuscation for data held in browser
 * localStorage to prevent casual shoulder-surfing in local device caches.
 * It is NOT cryptographic encryption, does NOT provide confidentiality
 * against device compromise or script injection, and should NOT be relied
 * upon as a security or HIPAA/DPDP compliance boundary.
 *
 * Sensitive cross-patient clinical PHI must be queried directly from
 * authorized backend services and not cached long-term on client devices.
 */

const STORAGE_OBFUSCATION_PREFIX = '__snj_obf_v1__';
const LEGACY_PREFIX = '__snj_enc_v1__';
const MASK_KEY = 'snj_local_cache_mask';
// The key the superseded `crypto.ts` codec masked with. Envelopes written by
// it must be decoded with it, not with MASK_KEY — otherwise the payload
// silently decodes to garbage, fails JSON.parse, and the caller falls through
// to `fallback`, losing the record with no error. (That codec was never
// actually wired into the repository, so no such envelope is expected to
// exist in the wild; this keeps the read path correct regardless.)
const LEGACY_MASK_KEY = 'sanjeevani_dpdp_aes_vault_2026';

function maskTransform(input: string, key: string = MASK_KEY): string {
  let output = '';
  for (let i = 0; i < input.length; i++) {
    output += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return output;
}

export function obfuscatePayload(data: unknown): string {
  if (data === null || data === undefined) return '';
  try {
    const jsonStr = JSON.stringify(data);
    const masked = maskTransform(jsonStr);
    const encoded =
      typeof window !== 'undefined'
        ? window.btoa(unescape(encodeURIComponent(masked)))
        : Buffer.from(masked).toString('base64');
    return `${STORAGE_OBFUSCATION_PREFIX}${encoded}`;
  } catch (err) {
    console.warn('Storage obfuscation fallback to plain stringify:', err);
    return JSON.stringify(data);
  }
}

export function deobfuscatePayload<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  // 1. If modern obfuscated envelope
  if (raw.startsWith(STORAGE_OBFUSCATION_PREFIX) || raw.startsWith(LEGACY_PREFIX)) {
    try {
      const isLegacy = !raw.startsWith(STORAGE_OBFUSCATION_PREFIX);
      const prefixLength = isLegacy ? LEGACY_PREFIX.length : STORAGE_OBFUSCATION_PREFIX.length;
      const base64 = raw.slice(prefixLength);
      const masked =
        typeof window !== 'undefined'
          ? decodeURIComponent(escape(window.atob(base64)))
          : Buffer.from(base64, 'base64').toString('utf8');
      const jsonStr = maskTransform(masked, isLegacy ? LEGACY_MASK_KEY : MASK_KEY);
      return JSON.parse(jsonStr) as T;
    } catch (err) {
      console.warn('Could not decode storage payload, falling back to plain parse:', err);
    }
  }

  // 2. Backwards-compatible plain JSON parse
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
