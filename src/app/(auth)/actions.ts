"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { homeFor } from "@/lib/auth";
import { randomCode, slugify } from "@/lib/utils";

export type FormState = { error?: string; ok?: string } | null;

const email = z.string().trim().toLowerCase().email("Enter a valid email");
const password = z.string().min(8, "Password must be at least 8 characters");
const name = z.string().trim().min(2, "Enter your full name").max(80);

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: "Incorrect email or password" };
  }
  await createSession(user);
  redirect(safeNext(formData.get("next")) ?? homeFor(user.role));
}

export async function registerStudent(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name,
      email,
      password,
      code: z.string().trim().toUpperCase().min(4, "Enter your center's invite code"),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { code, ...data } = parsed.data;

  const center = await db.center.findUnique({ where: { inviteCode: code } });
  if (!center) return { error: "That invite code doesn't match any learning center" };
  if (await db.user.findUnique({ where: { email: data.email } })) {
    return { error: "An account with this email already exists" };
  }

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: "STUDENT",
      centerId: center.id,
    },
  });
  await createSession(user);
  redirect("/onboarding");
}

export async function registerCenter(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      centerName: z.string().trim().min(2, "Enter the center's name").max(80),
      city: z.string().trim().max(60).optional(),
      name,
      email,
      password,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (await db.user.findUnique({ where: { email: d.email } })) {
    return { error: "An account with this email already exists" };
  }

  let slug = slugify(d.centerName) || "center";
  if (await db.center.findUnique({ where: { slug } })) slug = `${slug}-${randomCode(4).toLowerCase()}`;

  const user = await db.$transaction(async (tx) => {
    const center = await tx.center.create({
      data: {
        name: d.centerName,
        slug,
        city: d.city || null,
        inviteCode: randomCode(6),
        branches: { create: { name: "Main branch", address: d.city || null } },
      },
    });
    return tx.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash: await bcrypt.hash(d.password, 10),
        role: "CENTER_ADMIN",
        centerId: center.id,
        onboarded: true,
      },
    });
  });
  await createSession(user);
  redirect("/admin?welcome=1");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
