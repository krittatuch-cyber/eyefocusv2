// lib/crypto.ts — AES-256-GCM encryption for sensitive PII fields
// Used for: taxId, medicalHistory in customers table
// Key: ENCRYPTION_KEY env var (must be 32-byte hex string, 64 chars)

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV for GCM

function getKeyMaterial(): string {
  const key = process.env.ENCRYPTION_KEY ?? "";
  if (!key || key.length < 32) {
    // In development without key — return empty to skip encryption
    return "";
  }
  return key.substring(0, 64); // use first 32 bytes (64 hex chars)
}

async function importKey(hexKey: string): Promise<CryptoKey> {
  const keyBytes = new Uint8Array(
    hexKey.match(/.{1,2}/g)!.map(b => parseInt(b, 16))
  );
  return crypto.subtle.importKey("raw", keyBytes, { name: ALGORITHM, length: KEY_LENGTH }, false, ["encrypt", "decrypt"]);
}

/**
 * Encrypt a plaintext string. Returns "enc:base64iv.base64ciphertext"
 * Returns original string unchanged if ENCRYPTION_KEY not set (dev mode).
 */
export async function encrypt(plaintext: string | null | undefined): Promise<string | null> {
  if (!plaintext) return plaintext ?? null;
  const keyHex = getKeyMaterial();
  if (!keyHex) return plaintext; // no key = skip (dev)

  try {
    const key = await importKey(keyHex);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
    return `enc:${ivB64}.${ctB64}`;
  } catch (error) {
    console.error("[crypto] Encryption failed:", error);
    return plaintext; // fail open in prod to avoid data loss
  }
}

/**
 * Decrypt an encrypted string. Returns plaintext.
 * If string doesn't start with "enc:" — already plaintext, return as-is.
 */
export async function decrypt(ciphertext: string | null | undefined): Promise<string | null> {
  if (!ciphertext) return ciphertext ?? null;
  if (!ciphertext.startsWith("enc:")) return ciphertext; // plaintext/legacy

  const keyHex = getKeyMaterial();
  if (!keyHex) return ciphertext; // no key = return as-is

  try {
    const [ivB64, ctB64] = ciphertext.slice(4).split(".");
    const iv = new Uint8Array(atob(ivB64).split("").map(c => c.charCodeAt(0)));
    const ct = new Uint8Array(atob(ctB64).split("").map(c => c.charCodeAt(0)));
    const key = await importKey(keyHex);
    const plainBuffer = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ct);
    return new TextDecoder().decode(plainBuffer);
  } catch (error) {
    console.error("[crypto] Decryption failed:", error);
    return "[ENCRYPTED]"; // don't expose ciphertext on failure
  }
}

/**
 * Mask a Thai national ID for display: "1234567890123" → "1-2345-67890-12-*"
 */
export function maskTaxId(taxId: string | null | undefined): string {
  if (!taxId) return "-";
  const digits = taxId.replace(/\D/g, "");
  if (digits.length !== 13) return "***";
  return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-*`;
}

/**
 * Generate a secure ENCRYPTION_KEY (32 random bytes as hex)
 * Run: node -e "const c=require('crypto');console.log(c.randomBytes(32).toString('hex'))"
 */
export function generateKeyHint(): string {
  return "Run: node -e \"const c=require('crypto');console.log(c.randomBytes(32).toString('hex'))\"";
}
