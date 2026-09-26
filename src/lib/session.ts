import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

export type Role = "SUPER_ADMIN" | "CENTER_ADMIN" | "TEACHER" | "STUDENT";

export type SessionPayload = {
  userId: string;
  role: Role;
  centerId: string | null;
  expiresAt: string;
};

const COOKIE = "session";
const MAX_AGE_DAYS = 30;

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_DAYS}d`)
    .sign(key());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, key(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Secure cookies only when the page was served over https. On http://localhost or a local network
 * address (the start-here launchers) a Secure cookie would be dropped by some browsers.
 */
async function servedOverHttps() {
  const proto = (await headers()).get("x-forwarded-proto");
  return proto ? proto.split(",")[0].trim() === "https" : process.env.NODE_ENV === "production";
}

export async function createSession(user: { id: string; role: string; centerId: string | null }) {
  const expires = new Date(Date.now() + MAX_AGE_DAYS * 86_400_000);
  const token = await encrypt({
    userId: user.id,
    role: user.role as Role,
    centerId: user.centerId,
    expiresAt: expires.toISOString(),
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: await servedOverHttps(),
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function readSession() {
  return decrypt((await cookies()).get(COOKIE)?.value);
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE);
}
