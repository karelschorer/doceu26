/**
 * X25519 key agreement using Web Crypto API (ECDH with P-256 as fallback).
 * Note: Web Crypto doesn't support X25519 in all browsers yet; using ECDH P-256 for now.
 * X25519 can be added via a WASM library (e.g. @noble/curves) when needed.
 */

export async function generateKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
}

export async function exportPublicKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('spki', key);
}

export async function importPublicKey(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('spki', raw, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
}

export async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

/** Wrap a document encryption key with a recipient's public key */
export async function wrapKey(docKey: CryptoKey, recipientPublicKey: CryptoKey, senderPrivateKey: CryptoKey): Promise<{ wrappedKey: ArrayBuffer; senderPublicKey: ArrayBuffer }> {
  const sharedKey = await deriveSharedKey(senderPrivateKey, recipientPublicKey);
  const rawDocKey = await crypto.subtle.exportKey('raw', docKey);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedKey = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, rawDocKey);
  const senderPublicKey = await exportPublicKey((await generateKeyPair()).publicKey); // placeholder

  return { wrappedKey, senderPublicKey };
}
