import "server-only";
import { randomInt } from "node:crypto";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { key, servedOverHttps } from "@/lib/session";
import { COOKIE_PREFIX } from "@/lib/app-mode";
import { ownerCenter } from "@/lib/site";

// CD mock candidates have their own accounts and their own cookie, separate from BIS Learn's.
// The audience claim keeps a BIS Learn session from ever being accepted here, and the other way round.
const COOKIE = `${COOKIE_PREFIX}mock_session`;
const AUDIENCE = "bis-mock";
const DAYS = 30;

type MockSession = { candidateId: string; centerId: string };

export async function createMockSession(candidate: { id: string; centerId: string }) {
  const expires = new Date(Date.now() + DAYS * 86_400_000);
  const token = await new SignJWT({ candidateId: candidate.id, centerId: candidate.centerId })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${DAYS}d`)
    .sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: await servedOverHttps(), sameSite: "lax", path: "/", expires });
}

export async function deleteMockSession() {
  (await cookies()).delete(COOKIE);
}

async function readMockSession(): Promise<MockSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<MockSession>(token, key(), { algorithms: ["HS256"], audience: AUDIENCE });
    return payload;
  } catch {
    return null;
  }
}

/** The signed-in candidate, or null. */
export const getCandidate = cache(async () => {
  const session = await readMockSession();
  if (!session) return null;
  return db.mockCandidate.findUnique({ where: { id: session.candidateId }, include: { center: true } });
});

export async function requireCandidate() {
  const candidate = await getCandidate();
  if (!candidate) redirect("/mock");
  return candidate;
}

/**
 * Which center's mock a visitor is looking at: the one named in ?c=, else this copy's own center
 * (the owner's), else — on a platform with many centers — none, and the visitor picks one.
 */
export async function mockCenter(slug?: string | string[]) {
  if (typeof slug === "string" && slug) return db.center.findUnique({ where: { slug } });
  return ownerCenter();
}

/** A new six-digit candidate number nobody has yet. */
export async function newCandidateNumber() {
  for (;;) {
    const number = String(randomInt(100000, 1000000));
    if (!(await db.mockCandidate.findUnique({ where: { number }, select: { id: true } }))) return number;
  }
}

/** Digits and a leading +, so "+998 90 123-45-67" and "+998901234567" are the same phone. */
/** One spelling per phone number, so "90 111 00 02", "998901110002" and "+998 90 111-00-02" match. */
export function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 9 && !trimmed.startsWith("+")) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  return (trimmed.startsWith("+") ? "+" : "") + digits;
}

export function randomPin() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
