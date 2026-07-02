import crypto from 'crypto';

// SHA-256 helper
export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
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
