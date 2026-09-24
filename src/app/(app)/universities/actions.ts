"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function setDreamUniversity(universityId: string | null) {
  const user = await requireUser();
  if (universityId && !(await db.university.findUnique({ where: { id: universityId } }))) throw new Error("Not found");
  await db.user.update({ where: { id: user.id }, data: { targetUniId: universityId } });
  revalidatePath("/universities");
  revalidatePath("/dashboard");
}
