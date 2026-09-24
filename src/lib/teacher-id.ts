import "server-only";
import { db } from "@/lib/db";

// Teachers get a short ID (T1001, T1002, …) that they can log in with instead of their email.
const PREFIX = "T";
const FIRST = 1001;

async function nextTeacherId() {
  const taken = await db.user.findMany({ where: { loginId: { startsWith: PREFIX } }, select: { loginId: true } });
  const highest = taken.reduce((max, u) => Math.max(max, Number(u.loginId?.slice(PREFIX.length)) || 0), FIRST - 1);
  return `${PREFIX}${highest + 1}`;
}

/** Gives a teacher their ID if they don't have one yet (new accounts, and accounts made before IDs existed). */
export async function ensureTeacherId(user: { id: string; role: string; loginId: string | null }) {
  if (user.role !== "TEACHER" || user.loginId) return user.loginId;
  // Two teachers created at the same moment can pick the same number; the unique index rejects one, which retries.
  for (let attempt = 0; attempt < 5; attempt++) {
    const loginId = await nextTeacherId();
    try {
      await db.user.update({ where: { id: user.id }, data: { loginId } });
      return loginId;
    } catch {
      const current = await db.user.findUnique({ where: { id: user.id }, select: { loginId: true } });
      if (current?.loginId) return current.loginId;
    }
  }
  return null;
}

/** Normalizes what someone typed as a teacher ID: " t1001 " → "T1001". */
export function normalizeTeacherId(value: string) {
  return value.trim().toUpperCase();
}

export function looksLikeTeacherId(value: string) {
  return /^T\d{3,}$/.test(normalizeTeacherId(value));
}
