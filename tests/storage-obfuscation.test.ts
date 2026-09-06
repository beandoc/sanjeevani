import { describe, it, expect } from 'vitest';
import { obfuscatePayload, deobfuscatePayload } from '@/lib/db/health-repository/obfuscation';

const LEGACY_MASK_KEY = 'sanjeevani_dpdp_aes_vault_2026';
const xor = (s: string, k: string) =>
  [...s].map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ k.charCodeAt(i % k.length))).join('');

describe('storage obfuscation codec', () => {
  const data = [{ bp: '120/80', note: 'रक्तचाप' }];

  it('round-trips a modern envelope', () => {
    expect(deobfuscatePayload(obfuscatePayload(data), null)).toEqual(data);
  });

  it('decodes a legacy __snj_enc_v1__ envelope written by the old codec', () => {
    const legacy = '__snj_enc_v1__' + Buffer.from(xor(JSON.stringify(data), LEGACY_MASK_KEY)).toString('base64');
    expect(deobfuscatePayload(legacy, null)).toEqual(data);
  });

  it('falls back for plain JSON and garbage', () => {
    expect(deobfuscatePayload(JSON.stringify(data), null)).toEqual(data);
    expect(deobfuscatePayload('not-json', 'fb')).toBe('fb');
  });
});
