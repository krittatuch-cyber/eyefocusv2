// lib/auth.ts — JWT helpers (edge-compatible with jose)
import { SignJWT, jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET environment variable is required");
const JWT_SECRET = new TextEncoder().encode(secret);

const JWT_EXPIRY = "7d";

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "OD" | "OPTICIAN" | "SALES" | "CASHIER" | "SELLER";
  roles: string[]; // multi-role array
  branchId: string | null;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  // Check cookie
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, ...v] = c.split("=");
        return [k, v.join("=")];
      })
    );
    return cookies["auth_token"] || null;
  }
  return null;
}
