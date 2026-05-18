/**
 * AES-256-GCM encryption helpers for sensitive fields (wire account numbers).
 * Key is loaded from WIRE_ENCRYPTION_KEY env var (64 hex chars = 32 bytes).
 *
 * Ciphertext format: <ivHex>:<authTagHex>:<dataHex>
 * All components are hex-encoded so the result is a plain ASCII string.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES   = 12; // 96-bit IV — recommended for GCM

function getKey() {
  const hex = process.env.WIRE_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'WIRE_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: node -e "require(\'crypto\').randomBytes(32).toString(\'hex\')"'
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns a colon-delimited string: iv:authTag:ciphertext (all hex).
 */
export function encrypt(plaintext) {
  const key    = getKey();
  const iv     = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);

  return [
    iv.toString('hex'),
    cipher.getAuthTag().toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypt a ciphertext produced by encrypt().
 * Throws on tampered or corrupt data (GCM auth tag mismatch).
 */
export function decrypt(ciphertext) {
  const [ivHex, tagHex, dataHex] = ciphertext.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Malformed ciphertext.');

  const key      = getKey();
  const iv       = Buffer.from(ivHex,  'hex');
  const authTag  = Buffer.from(tagHex, 'hex');
  const data     = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/**
 * Mask an account number, showing only the last 4 digits.
 * e.g. "123456789" → "••••6789"
 */
export function maskAccountNumber(raw) {
  if (!raw) return '••••';
  const s = String(raw).replace(/\D/g, '');
  return '••••' + s.slice(-4);
}
