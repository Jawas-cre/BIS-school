"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCenterAdmin, requireStaff } from "@/lib/auth";
import type { ActionState } from "@/components/action-form";

function tempPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function ownGroup(centerId: string, id: string | undefined | null) {
  if (!id) return null;
  return db.group.findFirst({ where: { id, centerId } });
}

async function ownBranch(centerId: string, id: string | undefined | null) {
  if (!id) return null;
  return db.branch.findFirst({ where: { id, centerId } });
}

// ─── Students ───────────────────────────────────────────────────────────────

export async function createStudent(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter the student's full name").max(80),
      email: z.string().trim().toLowerCase().email("Enter a valid email"),
      password: z.string().max(64).optional(),
      groupId: z.string().optional(),
      phone: z.string().trim().max(30).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (await db.user.findUnique({ where: { email: d.email } })) return { error: "That email is already registered" };
  const password = d.password && d.password.length >= 8 ? d.password : tempPassword();
  const group = await ownGroup(staff.centerId, d.groupId);
  await db.user.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      passwordHash: await bcrypt.hash(password, 10),
      role: "STUDENT",
      centerId: staff.centerId,
      groupId: group?.id ?? null,
      branchId: group?.branchId ?? null,
    },
  });
  revalidatePath("/admin/students");
  return { ok: `Account created. Login: ${d.email} · password: ${password} — share it with the student.` };
}

export async function updateStudent(studentId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const student = await db.user.findFirst({ where: { id: studentId, centerId: staff.centerId, role: "STUDENT" } });
  if (!student) return { error: "Student not found" };
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Enter the student's full name" };
  const group = await ownGroup(staff.centerId, String(fd.get("groupId") ?? ""));
  const branch = await ownBranch(staff.centerId, String(fd.get("branchId") ?? ""));
  await db.user.update({
    where: { id: student.id },
    data: { name, groupId: group?.id ?? null, branchId: branch?.id ?? group?.branchId ?? null, phone: String(fd.get("phone") ?? "").trim() || null },
  });
  revalidatePath(`/admin/students/${student.id}`);
  revalidatePath("/admin/students");
  return { ok: "Saved" };
}

export async function resetStudentPassword(studentId: string): Promise<ActionState> {
  const admin = await requireCenterAdmin();
  const student = await db.user.findFirst({ where: { id: studentId, centerId: admin.centerId, role: "STUDENT" } });
  if (!student) return { error: "Student not found" };
  const password = tempPassword();
  await db.user.update({ where: { id: student.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  return { ok: `New password: ${password} — share it with ${student.name.split(" ")[0]}.` };
}

export async function removeStudent(studentId: string) {
  const admin = await requireCenterAdmin();
  await db.user.deleteMany({ where: { id: studentId, centerId: admin.centerId, role: "STUDENT" } });
  revalidatePath("/admin/students");
  redirect("/admin/students");
}

// ─── Groups ─────────────────────────────────────────────────────────────────

const GroupInput = z.object({
  name: z.string().trim().min(2, "Enter a group name").max(60),
  branchId: z.string().optional(),
  teacherId: z.string().optional(),
  schedule: z.string().trim().max(60).optional(),
});

async function groupData(centerId: string, fd: FormData) {
  const parsed = GroupInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;
  const d = parsed.data;
  const [branch, teacher] = await Promise.all([
    ownBranch(centerId, d.branchId),
    d.teacherId ? db.user.findFirst({ where: { id: d.teacherId, centerId, role: { in: ["TEACHER", "CENTER_ADMIN"] } } }) : null,
  ]);
  return { data: { name: d.name, schedule: d.schedule || null, branchId: branch?.id ?? null, teacherId: teacher?.id ?? null } } as const;
}

export async function createGroup(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const res = await groupData(staff.centerId, fd);
  if ("error" in res) return { error: res.error };
  const group = await db.group.create({ data: { ...res.data, centerId: staff.centerId } });
  revalidatePath("/admin/groups");
  redirect(`/admin/groups/${group.id}`);
}

export async function updateGroup(groupId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  if (!(await ownGroup(staff.centerId, groupId))) return { error: "Group not found" };
  const res = await groupData(staff.centerId, fd);
  if ("error" in res) return { error: res.error };
  await db.group.update({ where: { id: groupId }, data: res.data });
  revalidatePath(`/admin/groups/${groupId}`);
  return { ok: "Group saved" };
}

export async function deleteGroup(groupId: string) {
  const admin = await requireCenterAdmin();
  await db.group.deleteMany({ where: { id: groupId, centerId: admin.centerId } });
  revalidatePath("/admin/groups");
  redirect("/admin/groups");
}

export async function addToGroup(groupId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const group = await ownGroup(staff.centerId, groupId);
  if (!group) return { error: "Group not found" };
  const studentId = String(fd.get("studentId") ?? "");
  const student = await db.user.findFirst({ where: { id: studentId, centerId: staff.centerId, role: "STUDENT" } });
  if (!student) return { error: "Choose a student" };
  await db.user.update({ where: { id: student.id }, data: { groupId: group.id, branchId: group.branchId ?? student.branchId } });
  revalidatePath(`/admin/groups/${groupId}`);
  return { ok: `${student.name} added` };
}

export async function removeFromGroup(groupId: string, studentId: string) {
  const staff = await requireStaff();
  await db.user.updateMany({ where: { id: studentId, groupId, centerId: staff.centerId }, data: { groupId: null } });
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function toggleUnlock(groupId: string, unitId: string) {
  const staff = await requireStaff();
  if (!(await ownGroup(staff.centerId, groupId))) return;
  const key = { groupId_unitId: { groupId, unitId } };
  if (await db.groupUnlock.findUnique({ where: key })) await db.groupUnlock.delete({ where: key });
  else await db.groupUnlock.create({ data: { groupId, unitId } });
  revalidatePath(`/admin/groups/${groupId}`);
}

// ─── Staff ──────────────────────────────────────────────────────────────────

export async function createStaff(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireCenterAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter a full name").max(80),
      email: z.string().trim().toLowerCase().email("Enter a valid email"),
      role: z.enum(["TEACHER", "CENTER_ADMIN"]),
      branchId: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (await db.user.findUnique({ where: { email: d.email } })) return { error: "That email is already registered" };
  const password = tempPassword();
  const branch = await ownBranch(admin.centerId, d.branchId);
  await db.user.create({
    data: { name: d.name, email: d.email, role: d.role, centerId: admin.centerId, branchId: branch?.id ?? null, onboarded: true, passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/admin/staff");
  return { ok: `Account created. Login: ${d.email} · password: ${password}` };
}

export async function removeStaff(userId: string) {
  const admin = await requireCenterAdmin();
  if (userId === admin.id) return;
  await db.user.deleteMany({ where: { id: userId, centerId: admin.centerId, role: { in: ["TEACHER", "CENTER_ADMIN"] } } });
  revalidatePath("/admin/staff");
}
