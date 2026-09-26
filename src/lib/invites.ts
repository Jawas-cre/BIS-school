import "server-only";
import { db } from "@/lib/db";
import { randomCode } from "@/lib/utils";

export type InviteRole = "STUDENT" | "TEACHER";
export type InviteStatus = "active" | "disabled" | "expired" | "usedUp";

export function inviteStatus(code: { active: boolean; expiresAt: Date | null; maxUses: number | null; uses: number }, now = new Date()): InviteStatus {
  if (!code.active) return "disabled";
  if (code.expiresAt && code.expiresAt < now) return "expired";
  if (code.maxUses !== null && code.uses >= code.maxUses) return "usedUp";
  return "active";
}

/** A new code that clashes with neither invite codes nor centers' general student codes. */
export async function uniqueInviteCode(length = 8) {
  for (;;) {
    const code = randomCode(length);
    const [invite, center] = await Promise.all([db.inviteCode.findUnique({ where: { code } }), db.center.findUnique({ where: { inviteCode: code } })]);
    if (!invite && !center) return code;
  }
}

export type ResolvedInvite =
  | { ok: true; centerId: string; role: InviteRole; groupId: string | null; inviteId: string | null }
  | { ok: false; reason: "unknown" | Exclude<InviteStatus, "active"> };

/** What a code typed on the sign-up page gives access to: a role in a center, and maybe a group. */
export async function resolveInvite(raw: string): Promise<ResolvedInvite> {
  const code = raw.trim().toUpperCase();
  const invite = await db.inviteCode.findUnique({ where: { code } });
  if (invite) {
    const status = inviteStatus(invite);
    if (status !== "active") return { ok: false, reason: status };
    return { ok: true, centerId: invite.centerId, role: invite.role === "TEACHER" ? "TEACHER" : "STUDENT", groupId: invite.groupId, inviteId: invite.id };
  }
  const center = await db.center.findUnique({ where: { inviteCode: code } });
  if (center) return { ok: true, centerId: center.id, role: "STUDENT", groupId: null, inviteId: null };
  return { ok: false, reason: "unknown" };
}

/** Counts one use, unless the code ran out in the meantime. Returns false if it did. */
export async function consumeInvite(inviteId: string) {
  const invite = await db.inviteCode.findUnique({ where: { id: inviteId } });
  if (!invite || inviteStatus(invite) !== "active") return false;
  const { count } = await db.inviteCode.updateMany({
    where: { id: inviteId, uses: invite.uses },
    data: { uses: { increment: 1 } },
  });
  return count === 1;
}
