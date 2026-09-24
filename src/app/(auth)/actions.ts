"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { homeFor } from "@/lib/auth";
import { resolveInvite, consumeInvite } from "@/lib/invites";
import { ensureTeacherId, looksLikeTeacherId, normalizeTeacherId } from "@/lib/teacher-id";
import { randomCode, slugify } from "@/lib/utils";
import type { Dict } from "@/lib/i18n/dictionaries";
import { getT } from "@/lib/i18n/server";

export type FormState = { error?: string; ok?: string } | null;

function fields(t: Dict) {
  return {
    email: z.string().trim().toLowerCase().email(t.validation.email),
    password: z.string().min(8, t.validation.passwordMin),
    name: z.string().trim().min(2, t.validation.fullName).max(80),
  };
}

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

/** Log in with an email, or — for teachers — their teacher ID (e.g. T1001). */
export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const parsed = z
    .object({ login: z.string().trim().min(1, t.auth.enterLogin), password: z.string().min(1, t.auth.enterPassword) })
    .safeParse({ login: formData.get("login"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { login: typed } = parsed.data;
  const where = typed.includes("@")
    ? { email: typed.toLowerCase() }
    : looksLikeTeacherId(typed)
      ? { loginId: normalizeTeacherId(typed) }
      : null;
  const user = where ? await db.user.findUnique({ where }) : null;
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: t.auth.incorrectLogin };
  }
  await createSession(user);
  redirect(safeNext(formData.get("next")) ?? homeFor(user.role));
}

/** Sign-up with a code from a center: a student code or a teacher code decides the new account's role. */
export async function registerWithCode(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const parsed = z
    .object({
      ...fields(t),
      code: z.string().trim().toUpperCase().min(4, t.auth.enterInviteCode),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { code, ...data } = parsed.data;

  const invite = await resolveInvite(code);
  if (!invite.ok) {
    const reasons = { unknown: t.auth.unknownInviteCode, disabled: t.auth.codeDisabled, expired: t.auth.codeExpired, usedUp: t.auth.codeUsedUp };
    return { error: reasons[invite.reason] };
  }
  if (await db.user.findUnique({ where: { email: data.email } })) {
    return { error: t.auth.emailTaken };
  }
  if (invite.inviteId && !(await consumeInvite(invite.inviteId))) return { error: t.auth.codeUsedUp };

  const group = invite.groupId ? await db.group.findFirst({ where: { id: invite.groupId, centerId: invite.centerId } }) : null;
  const teacher = invite.role === "TEACHER";
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: invite.role,
      centerId: invite.centerId,
      branchId: group?.branchId ?? null,
      onboarded: teacher,
      memberships: group && !teacher ? { create: { groupId: group.id } } : undefined,
    },
  });
  await ensureTeacherId(user);
  await createSession(user);
  redirect(teacher ? "/teacher?welcome=1" : "/onboarding");
}

const centerFields = (t: Dict) => ({
  centerName: z.string().trim().min(2, t.auth.enterCenterName).max(80),
  city: z.string().trim().max(60).optional(),
  ...fields(t),
});

/** Creates a center with its main branch and its first admin, then signs the admin in. */
async function createCenterWithAdmin(t: Dict, d: { centerName: string; city?: string; name: string; email: string; password: string }, owner = false) {
  let slug = slugify(d.centerName) || "center";
  if (await db.center.findUnique({ where: { slug } })) slug = `${slug}-${randomCode(4).toLowerCase()}`;

  const user = await db.$transaction(async (tx) => {
    const center = await tx.center.create({
      data: {
        name: d.centerName,
        slug,
        city: d.city || null,
        inviteCode: randomCode(6),
        branches: { create: { name: t.auth.mainBranch, address: d.city || null } },
      },
    });
    return tx.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash: await bcrypt.hash(d.password, 10),
        role: "CENTER_ADMIN",
        isOwner: owner,
        centerId: center.id,
        onboarded: true,
      },
    });
  });
  await createSession(user);
}

export async function registerCenter(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const parsed = z.object(centerFields(t)).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (await db.user.findUnique({ where: { email: parsed.data.email } })) {
    return { error: t.auth.emailTaken };
  }
  await createCenterWithAdmin(t, parsed.data);
  redirect("/admin?welcome=1");
}

/** First start on a new install: the person setting up creates the center and their own admin password. */
export async function setupFirstCenter(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  if ((await db.user.count()) > 0) redirect("/login");
  const parsed = z
    .object({ ...centerFields(t), confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: t.validation.passwordsDiffer })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // The person installing the site owns it: they also get the platform settings.
  await createCenterWithAdmin(t, parsed.data, true);
  redirect("/admin?welcome=1");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
