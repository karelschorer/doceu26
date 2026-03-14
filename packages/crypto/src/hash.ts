/** SHA-256 hash using Web Crypto API */
export async function sha256(data: ArrayBuffer | string): Promise<ArrayBuffer> {
  const buf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return crypto.subtle.digest('SHA-256', buf);
}

export function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/** Hash-chain: compute SHA-256(prev_hash || entry) for audit log integrity */
export async function chainHash(prevHash: string, entry: string): Promise<string> {
  const combined = new TextEncoder().encode(prevHash + entry);
  const hash = await sha256(combined.buffer);
  return toHex(hash);
}
