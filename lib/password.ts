// lib/password.ts — WebCrypto PBKDF2 password hashing
// Uses native Web Crypto API — runs as native op in Cloudflare Workers,
// does NOT exhaust JS CPU time unlike bcrypt (which is pure-JS and very slow).
//
// Format stored in DB: "pbkdf2:<saltHex>:<hashHex>"
// Compatible with both Cloudflare Workers (Web Crypto) and Node 18+ (crypto.subtle)

const ALGORITHM = "PBKDF2";
const HASH = "SHA-256";
const ITERATIONS = 100_000;  // NIST recommended minimum for PBKDF2-SHA256
const KEY_BYTES = 32;

// ── Encode ─────────────────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    ALGORITHM,
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: ALGORITHM, salt, iterations: ITERATIONS, hash: HASH },
    key,
    KEY_BYTES * 8
  );
  const toHex = (arr: Uint8Array) => Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

// ── Verify ─────────────────────────────────────────────────────────────────────
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (!stored.startsWith("pbkdf2:")) {
      // Legacy bcrypt hash stored in DB — cannot verify in Workers environment
      // Return false so caller gets 401; prompt rehash via admin script.
      console.warn("[password] Legacy bcrypt hash detected — please run rehash script.");
      return false;
    }
    const parts = stored.split(":");
    if (parts.length !== 3) return false;

    const saltHex = parts[1];
    const storedHashHex = parts[2];
    const salt = new Uint8Array((saltHex.match(/.{2}/g) ?? []).map(h => parseInt(h, 16)));

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      ALGORITHM,
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: ALGORITHM, salt, iterations: ITERATIONS, hash: HASH },
      key,
      KEY_BYTES * 8
    );
    const testHashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");

    // Constant-time comparison (prevent timing attacks)
    if (testHashHex.length !== storedHashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < testHashHex.length; i++) {
      diff |= testHashHex.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
