import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

export const encryptSecret = (plainText: string): string => {
  if (!plainText) return '';
  const key = Buffer.from(config.encryptionKey, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
};

export const decryptSecret = (cipherPayload: string): string => {
  if (!cipherPayload) return '';
  const parts = cipherPayload.split(':');
  if (parts.length !== 3) return '';
  const [ivHex, tagHex, encryptedHex] = parts;
  const key = Buffer.from(config.encryptionKey, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const isSsrfSafeUrl = (urlString: string, allowlist: string[] = []): { safe: boolean; reason?: string } => {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { safe: false, reason: 'Invalid protocol. Only HTTP and HTTPS are permitted.' };
    }

    const hostname = url.hostname.toLowerCase();

    // Check loopback / local hosts
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost') ||
      hostname === '169.254.169.254' // AWS/Cloud metadata service
    ) {
      return { safe: false, reason: 'Loopback and link-local cloud metadata addresses are blocked.' };
    }

    // Check private RFC 1918 IPv4 ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const b1 = parseInt(match[1], 10);
      const b2 = parseInt(match[2], 10);

      // 10.0.0.0/8
      if (b1 === 10) return { safe: false, reason: 'Private network (10.0.0.0/8) is blocked.' };
      // 172.16.0.0/12
      if (b1 === 172 && b2 >= 16 && b2 <= 31) return { safe: false, reason: 'Private network (172.16.0.0/12) is blocked.' };
      // 192.168.0.0/16
      if (b1 === 192 && b2 === 168) return { safe: false, reason: 'Private network (192.168.0.0/16) is blocked.' };
      // 0.0.0.0
      if (b1 === 0) return { safe: false, reason: 'Non-routable 0.0.0.0 address is blocked.' };
    }

    // If allowlist is populated and non-empty, ensure hostname is on allowlist
    if (allowlist.length > 0) {
      const allowed = allowlist.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
      if (!allowed) {
        return { safe: false, reason: `Target host '${hostname}' is not in organization allowlist.` };
      }
    }

    return { safe: true };
  } catch (err: any) {
    return { safe: false, reason: `Malformed URL: ${err.message}` };
  }
};
