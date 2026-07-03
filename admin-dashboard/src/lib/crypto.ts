import crypto from 'crypto';

// SHA-256 helper
export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/** Trim and uppercase — canonical form for storage and hashing. */
export function normalizeLicenseKey(key: string): string {
  return String(key || '').trim().toUpperCase();
}

/** Ensure LPK-XXXX-XXXX-XXXX-XXXX formatting. */
export function formatLicenseKey(key: string): string {
  const trimmed = normalizeLicenseKey(key);
  if (trimmed.includes('-')) {
    return trimmed;
  }
  const stripped = trimmed.replace(/-/g, '');
  const groups = stripped.match(/.{1,4}/g);
  return groups ? groups.join('-') : trimmed;
}

/** All string forms used when looking up a license in the database. */
export function licenseKeyLookupVariants(key: string): string[] {
  const trimmed = normalizeLicenseKey(key);
  const formatted = formatLicenseKey(trimmed);
  const noHyphen = trimmed.replace(/-/g, '');
  return Array.from(new Set([trimmed, formatted, noHyphen]));
}

/** Hash the canonical (uppercase, trimmed) license key. */
export function hashLicenseKey(key: string): string {
  return sha256(normalizeLicenseKey(key));
}

/** Every SHA-256 hash we might have stored for a given user-entered key. */
export function allLicenseKeyHashes(key: string): string[] {
  return licenseKeyLookupVariants(key).map((variant) => sha256(variant));
}

// Generate license key: LPK-XXXX-XXXX-XXXX-XXXX
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const groups: string[] = [];

  for (let i = 0; i < 4; i++) {
    let group = '';
    const bytes = crypto.randomBytes(4);
    for (let j = 0; j < 4; j++) {
      group += chars[bytes[j] % chars.length];
    }
    groups.push(group);
  }

  return 'LPK-' + groups.join('-');
}
