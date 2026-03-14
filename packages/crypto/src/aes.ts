/**
 * AES-256-GCM encryption using Web Crypto API.
 * All operations are async and run in the browser's crypto subsystem.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV for GCM

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: ALGORITHM, length: KEY_LENGTH }, true, ['encrypt', 'decrypt']);
}

export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

export async function importKey(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: ALGORITHM, length: KEY_LENGTH }, true, ['encrypt', 'decrypt']);
}

export async function encrypt(key: CryptoKey, plaintext: ArrayBuffer): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, plaintext);
  return { ciphertext, iv };
}

export async function decrypt(key: CryptoKey, ciphertext: ArrayBuffer, iv: Uint8Array): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext);
}

/** Encode ciphertext + IV into a single Uint8Array: [IV (12 bytes)][ciphertext] */
export function packEncrypted(ciphertext: ArrayBuffer, iv: Uint8Array): Uint8Array {
  const result = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), IV_LENGTH);
  return result;
}

/** Decode a packed encrypted blob back into { ciphertext, iv } */
export function unpackEncrypted(packed: Uint8Array): { ciphertext: ArrayBuffer; iv: Uint8Array } {
  const iv = packed.slice(0, IV_LENGTH);
  const ciphertext = packed.slice(IV_LENGTH).buffer;
  return { ciphertext, iv };
}
