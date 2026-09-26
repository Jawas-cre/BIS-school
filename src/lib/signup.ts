import "server-only";
import { db } from "@/lib/db";

/**
 * Whether anyone may open a new learning center at /register/center. An online platform with many
 * centers keeps it open. A copy with an owner — the person who set it up from the start-here file —
 * belongs to one center, and its link may be shared on the internet, so there it stays closed unless
 * BIS_CENTER_SIGNUP="on" in .env.
 */
export async function centerSignupOpen() {
  if (process.env.BIS_CENTER_SIGNUP === "on") return true;
  return !(await db.user.findFirst({ where: { isOwner: true }, select: { id: true } }));
}
